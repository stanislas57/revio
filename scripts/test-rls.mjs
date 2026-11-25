// RLS / constraint checks for the Supabase migrations, without Docker.
// Applies every migration (sorted) on PGlite (Postgres in WASM) with a minimal
// shim of Supabase's auth schema and roles, then exercises the policies.
// Usage: npm run test:db   (node scripts/test-rls.mjs supabase/migrations)
// Limits: the shim is not the real Supabase stack; also validate with
// `supabase db reset` (Docker) or on a real project before production.
import { PGlite } from "@electric-sql/pglite";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const db = new PGlite();
const shim = `
create role anon nologin; create role authenticated nologin; create role service_role nologin bypassrls;
create schema auth;
create table auth.users (id uuid primary key, email text, raw_user_meta_data jsonb default '{}');
create function auth.uid() returns uuid language sql stable as $$
  select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
grant usage on schema public, auth to anon, authenticated, service_role;
grant execute on function auth.uid() to anon, authenticated;
alter default privileges in schema public grant all on tables to anon, authenticated, service_role;
alter default privileges in schema public grant all on functions to anon, authenticated, service_role;
`;
await db.exec(shim);
const dir = process.argv[2] ?? "supabase/migrations";
for (const file of readdirSync(dir)
  .filter((f) => f.endsWith(".sql"))
  .sort()) {
  await db.exec(readFileSync(join(dir, file), "utf8"));
}

const A = "00000000-0000-0000-0000-00000000000a";
const B = "00000000-0000-0000-0000-00000000000b";
const C = "00000000-0000-0000-0000-00000000000c";
await db.exec(`insert into auth.users (id, email, raw_user_meta_data) values
 ('${A}','a@x.fr','{"display_name":"Alice"}'),('${B}','b@x.fr','{}'),('${C}','c@x.fr','{}');`);

let failures = 0;
const ok = (name, cond) => {
  console.log(`${cond ? "PASS" : "FAIL"}  ${name}`);
  if (!cond) failures++;
};
async function as(uid, sql, params) {
  await db.exec(
    `reset role; select set_config('request.jwt.claim.sub', '${uid ?? ""}', false); set role ${uid ? "authenticated" : "anon"};`,
  );
  try {
    return { rows: (await db.query(sql, params)).rows };
  } catch (e) {
    return { error: e.message };
  } finally {
    await db.exec("reset role;");
  }
}

ok(
  "profile auto-created with display_name",
  (await db.query(`select display_name from profiles where id='${A}'`)).rows[0]?.display_name === "Alice",
);

// subjects / grades privacy
const s = await as(A, `insert into subjects (name, coefficient) values ('Maths', 4) returning id`);
const subj = s.rows?.[0]?.id;
ok("A creates subject", !!subj);
ok(
  "A creates grade",
  !(await as(A, `insert into grades (subject_id, value, coefficient) values ($1, 15, 2)`, [subj])).error,
);
ok(
  "grade > max rejected",
  !!(await as(A, `insert into grades (subject_id, value) values ($1, 25)`, [subj])).error,
);
ok("B cannot see A subjects", (await as(B, `select * from subjects`)).rows.length === 0);
ok("B cannot see A grades", (await as(B, `select * from grades`)).rows.length === 0);
ok(
  "B cannot attach grade to A subject",
  !!(await as(B, `insert into grades (subject_id, value) values ($1, 10)`, [subj])).error,
);
ok(
  "B cannot insert grade as A",
  !!(await as(B, `insert into grades (user_id, subject_id, value) values ('${A}', $1, 10)`, [subj])).error,
);
ok(
  "anon sees no profiles",
  (await as(null, `select * from profiles`)).rows?.length === 0 ||
    !!(await as(null, `select * from profiles`)).error,
);

// sessions before friendship
const sess = (await as(A, `insert into study_sessions (planned_minutes) values (25) returning id`)).rows?.[0]
  ?.id;
ok("A starts session", !!sess);
ok(
  "second running session rejected",
  !!(await as(A, `insert into study_sessions (planned_minutes) values (25)`)).error,
);
ok("B cannot see A session (not friends)", (await as(B, `select * from study_sessions`)).rows.length === 0);

// friendships
ok(
  "A requests B",
  !(await as(A, `insert into friendships (requester_id, addressee_id) values ('${A}','${B}')`)).error,
);
ok(
  "duplicate reverse request rejected",
  !!(await as(B, `insert into friendships (requester_id, addressee_id) values ('${B}','${A}')`)).error,
);
ok(
  "A cannot self-accept",
  (await as(A, `update friendships set status='accepted' returning id`)).rows?.length === 0,
);
ok("B cannot rewrite requester_id", !!(await as(B, `update friendships set requester_id='${C}'`)).error);
ok("C cannot see A-B friendship", (await as(C, `select * from friendships`)).rows.length === 0);
ok(
  "B accepts",
  (await as(B, `update friendships set status='accepted', responded_at=now() returning id`)).rows?.length ===
    1,
);
ok(
  "C cannot probe are_friends(A,B)",
  (await as(C, `select public.are_friends('${A}','${B}') as f`)).rows?.[0]?.f === false,
);

ok("B sees A session once friends", (await as(B, `select * from study_sessions`)).rows.length === 1);
ok("C still cannot", (await as(C, `select * from study_sessions`)).rows.length === 0);
ok("B still cannot see A grades", (await as(B, `select * from grades`)).rows.length === 0);
{
  // Since focus_xp_social, status is no longer client-updatable at all (error),
  // and RLS still hides A's rows from B (0 rows). Both mean "cannot".
  const r = await as(B, `update study_sessions set status='abandoned' returning id`);
  ok("B cannot update A session", !!r.error || r.rows?.length === 0);
}
await as(A, `update study_sessions set visibility='private'`);
ok("private session hidden from friend", (await as(B, `select * from study_sessions`)).rows.length === 0);

// XP
ok(
  "client cannot insert XP",
  !!(
    await as(
      A,
      `insert into xp_transactions (user_id, amount, reason, idempotency_key) values ('${A}', 10, 'session_completed', 'x')`,
    )
  ).error,
);
await db.query(
  `insert into xp_transactions (user_id, amount, reason, idempotency_key, study_session_id) values ($1, 50, 'session_completed', 'session:'||$2::text, $2::uuid)`,
  [A, sess],
);
let dup = null;
try {
  await db.query(
    `insert into xp_transactions (user_id, amount, reason, idempotency_key) values ($1, 50, 'session_completed', 'session:'||$2::text)`,
    [A, sess],
  );
} catch (e) {
  dup = e;
}
ok("duplicate XP grant rejected (idempotent)", !!dup);
ok("A reads own XP", (await as(A, `select * from xp_transactions`)).rows.length === 1);
ok("B cannot read A XP", (await as(B, `select * from xp_transactions`)).rows.length === 0);

// ---------------------------------------------------------------------------
// Focus / XP / streak / reactions (migration focus_xp_social)
// ---------------------------------------------------------------------------
const call = (uid, fn, id) => as(uid, `select public.${fn}($1) as r`, [id]);
const backdate = (id, sql) => db.query(`update study_sessions set ${sql} where id = $1`, [id]);

ok("A abandons running session", !(await call(A, "abandon_study_session", sess)).error);

const s2 = (
  await as(
    A,
    `insert into study_sessions (started_at, status, ended_at, xp_awarded, label, visibility)
     values ('2020-01-01', 'completed', '2020-01-02', 999, 'Statistiques', 'friends')
     returning id, started_at, status, xp_awarded`,
  )
).rows?.[0];
ok(
  "insert cannot backdate, pre-complete or self-award XP",
  s2?.status === "in_progress" && s2?.xp_awarded === null && new Date(s2.started_at).getFullYear() > 2020,
);
ok(
  "client cannot complete a session by update",
  !!(await as(A, `update study_sessions set status='completed', ended_at=now() where id=$1`, [s2.id])).error,
);
ok(
  "client cannot rewrite started_at",
  !!(await as(A, `update study_sessions set started_at='2020-01-01' where id=$1`, [s2.id])).error,
);
ok(
  "owner can rename label",
  !(await as(A, `update study_sessions set label='Statistiques' where id=$1`, [s2.id])).error,
);

await backdate(s2.id, `started_at = now() - interval '45 minutes'`);
ok("B cannot complete A session", !!(await call(B, "complete_study_session", s2.id)).error);
ok("anon cannot complete a session", !!(await call(null, "complete_study_session", s2.id)).error);
const r2 = (await call(A, "complete_study_session", s2.id)).rows?.[0]?.r;
ok("complete: 45 min gives 45 XP", r2?.duration_minutes === 45 && r2?.xp_session === 45);
ok("complete twice rejected", !!(await call(A, "complete_study_session", s2.id)).error);
ok(
  "one ledger entry per session",
  (
    await db.query(`select count(*)::int n from xp_transactions where idempotency_key = 'session:' || $1`, [
      s2.id,
    ])
  ).rows[0].n === 1,
);

// Pause time is not counted.
const s3 = (await as(A, `insert into study_sessions default values returning id`)).rows?.[0]?.id;
ok("A pauses", !(await call(A, "pause_study_session", s3)).error);
ok("pause twice rejected", !!(await call(A, "pause_study_session", s3)).error);
await backdate(s3, `started_at = now() - interval '20 minutes', paused_at = now() - interval '10 minutes'`);
ok(
  "paused time excluded (20 min - 10 min paused = 10)",
  (await call(A, "complete_study_session", s3)).rows?.[0]?.r?.duration_minutes === 10,
);

// Streak: 6 previous days validated + today -> 7 days, bonus once per day.
for (let k = 1; k <= 6; k++) {
  const id = (await db.query(`insert into study_sessions (user_id) values ($1) returning id`, [A])).rows[0]
    .id;
  await backdate(
    id,
    `status='completed', started_at = now() - interval '${k} days 30 minutes',
     ended_at = now() - interval '${k} days', duration_minutes = 30`,
  );
}
const s4 = (await as(A, `insert into study_sessions default values returning id`)).rows?.[0]?.id;
await backdate(s4, `started_at = now() - interval '15 minutes'`);
const r4 = (await call(A, "complete_study_session", s4)).rows?.[0]?.r;
ok("7-day streak grants 100 XP bonus", r4?.streak_days === 7 && r4?.xp_streak_bonus === 100);
const s5 = (await as(A, `insert into study_sessions default values returning id`)).rows?.[0]?.id;
await backdate(s5, `started_at = now() - interval '5 minutes'`);
ok(
  "streak bonus not granted twice the same day",
  (await call(A, "complete_study_session", s5)).rows?.[0]?.r?.xp_streak_bonus === 0,
);
const g = (await as(A, `select public.my_gamification() as g`)).rows?.[0]?.g;
ok(
  "my_gamification: streak and total XP",
  g?.current_streak === 7 && g?.best_streak === 7 && g?.total_xp === 50 + 45 + 10 + 15 + 100 + 5,
);
ok("client cannot call streak_stats directly", !!(await call(B, "streak_stats", A)).error);

// Friends overview + live status.
const s6 = (
  await as(A, `insert into study_sessions (label, visibility) values ('Finance', 'friends') returning id`)
).rows?.[0]?.id;
const ov = (await as(B, `select * from public.get_friends_overview()`)).rows ?? [];
ok(
  "B sees A in friends overview with XP, streak and live label",
  ov.length === 1 && ov[0].user_id === A && ov[0].current_streak === 7 && ov[0].live_label === "Finance",
);
ok(
  "C has no friends in overview",
  (await as(C, `select * from public.get_friends_overview()`)).rows?.length === 0,
);
await as(A, `update study_sessions set visibility='private' where id=$1`, [s6]);
ok(
  "private live session hidden from friends overview",
  (await as(B, `select * from public.get_friends_overview()`)).rows?.[0]?.live_label === null,
);

// Reactions.
const react = (uid, id) => as(uid, `insert into session_reactions (session_id) values ($1)`, [id]);
ok("B reacts to A shared session", !(await react(B, s2.id)).error);
ok("B cannot react twice", !!(await react(B, s2.id)).error);
ok("A cannot react to own session", !!(await react(A, s2.id)).error);
ok("C (not friend) cannot react", !!(await react(C, s2.id)).error);
ok("B cannot react to a running session", !!(await react(B, s6)).error);
ok("A sees the reaction", (await as(A, `select * from session_reactions`)).rows?.length === 1);
ok("C cannot see reactions", (await as(C, `select * from session_reactions`)).rows?.length === 0);
await as(A, `update study_sessions set visibility='private' where id=$1`, [s2.id]);
ok(
  "reactions hidden when the session becomes private",
  (await as(B, `select * from session_reactions`)).rows?.length === 0,
);

// delete cascade
await db.exec(`delete from auth.users where id='${A}'`);
ok("user deletion cascades", (await db.query(`select count(*)::int n from grades`)).rows[0].n === 0);

console.log(failures ? `\n${failures} FAILED` : "\nALL PASSED");
process.exit(failures ? 1 : 0);
