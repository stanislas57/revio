// RLS / constraint checks for the Supabase migrations, without Docker.
// Applies every migration (sorted) on PGlite (Postgres in WASM) with a minimal
// shim of Supabase's auth schema and roles, then exercises the policies.
// Usage: npm run test:db   (node scripts/test-rls.mjs supabase/migrations)
// Limits: the shim is not the real Supabase stack; also validate with
// `supabase db reset` (Docker) or on a real project before production.
import { PGlite } from "@electric-sql/pglite";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { SUPABASE_SHIM_SQL } from "./pglite-supabase-shim.mjs";

const db = new PGlite();
await db.exec(SUPABASE_SHIM_SQL);
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
const sess = (await as(A, `select id from public.start_study_session('countdown', null, 25)`)).rows?.[0]?.id;
ok("A starts session", !!sess);
ok(
  "second running session rejected",
  !!(await as(A, `select public.start_study_session('countdown', null, 25)`)).error,
);
ok(
  "client cannot insert a session directly",
  !!(await as(A, `insert into study_sessions (planned_minutes, mode) values (25, 'countdown')`)).error,
);
ok(
  "client cannot backdate started_at",
  !!(await as(A, `update study_sessions set started_at = now() - interval '10 hours'`)).error,
);
ok(
  "client cannot complete a session directly",
  !!(await as(A, `update study_sessions set status = 'completed', ended_at = now()`)).error,
);
ok(
  "timer modes require planned minutes",
  !!(await as(B, `select public.start_study_session('countdown', null, null)`)).error,
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
ok(
  "B cannot update A session",
  !!(await as(B, `update study_sessions set status='abandoned' returning id`)).error,
);
ok("B cannot pause A session", !!(await as(B, `select public.pause_study_session($1)`, [sess])).error);
ok("B cannot finish A session", !!(await as(B, `select public.finish_study_session($1)`, [sess])).error);
ok("anon cannot start a session", !!(await as(null, `select public.start_study_session()`)).error);
await as(A, `select public.set_study_session_visibility($1, 'private')`, [sess]);
ok("private session hidden from friend", (await as(B, `select * from study_sessions`)).rows.length === 0);

// session lifecycle (server timestamps only)
const bs = (await as(B, `select id from public.start_study_session('free')`)).rows?.[0]?.id;
ok("B starts a free session", !!bs);
ok("B pauses", !(await as(B, `select public.pause_study_session($1)`, [bs])).error);
ok("double pause rejected", !!(await as(B, `select public.pause_study_session($1)`, [bs])).error);
ok("B resumes", !(await as(B, `select public.resume_study_session($1)`, [bs])).error);
ok("resume when running rejected", !!(await as(B, `select public.resume_study_session($1)`, [bs])).error);
ok("heartbeat ok", !(await as(B, `select public.heartbeat_study_session($1)`, [bs])).error);
const f1 = (await as(B, `select public.finish_study_session($1) as r`, [bs])).rows?.[0]?.r;
const f2 = (await as(B, `select public.finish_study_session($1) as r`, [bs])).rows?.[0]?.r;
const bsRow = (await db.query(`select status, ended_at from study_sessions where id=$1`, [bs])).rows[0];
ok("finish completes the session", bsRow?.status === "completed" && !!bsRow?.ended_at);
ok("finish is idempotent", f1?.already_finalized === false && f2?.already_finalized === true);
ok(
  "too-short session earns nothing and posts nothing",
  f1?.below_minimum === true && f1?.earned_xp === 0 && f1?.post_created === false,
);
ok("cancel after finish rejected", !!(await as(B, `select public.cancel_study_session($1)`, [bs])).error);
ok(
  "duration is computed by the server and never negative",
  (await as(B, `select public.study_session_seconds(s) as n from study_sessions s where id=$1`, [bs]))
    .rows?.[0]?.n >= 0,
);
const bs2 = (await as(B, `select id from public.start_study_session('free')`)).rows?.[0]?.id;
ok("new session after finishing", !!bs2);
ok(
  "cancel abandons",
  (await as(B, `select status from public.cancel_study_session($1)`, [bs2])).rows?.[0]?.status ===
    "abandoned",
);
ok("finish after cancel rejected", !!(await as(B, `select public.finish_study_session($1)`, [bs2])).error);
const bs3 = (await as(B, `select id from public.start_study_session('free')`)).rows?.[0]?.id;
await db.query(`update study_sessions set last_heartbeat_at = now() - interval '13 hours' where id=$1`, [
  bs3,
]);
ok(
  "stale session does not block a new start",
  !(await as(B, `select public.start_study_session('free')`)).error,
);
ok(
  "stale session was abandoned",
  (await db.query(`select status from study_sessions where id=$1`, [bs3])).rows[0]?.status === "abandoned",
);
ok(
  "cannot start on another user's subject",
  !!(await as(C, `select public.start_study_session('free', $1)`, [subj])).error,
);

// gamification engine (finish grants XP, streak, stats, post)
await db.query(
  `update study_sessions set status='abandoned', ended_at=now() where user_id=$1 and status='in_progress'`,
  [B],
);
const g1 = (await as(B, `select (public.start_study_session('free')).id`)).rows?.[0]?.id;
await db.query(
  `update study_sessions set started_at = now() - interval '45 minutes', last_heartbeat_at = now() where id=$1`,
  [g1],
);
const r1 = (await as(B, `select public.finish_study_session($1) as r`, [g1])).rows?.[0]?.r;
ok("45 min + daily goal = 95 XP", r1?.earned_xp === 95 && r1?.daily_goal_completed === true);
ok("streak day validated", r1?.streak_days === 1 && r1?.today_validated === true);
ok("post created for a shared session", r1?.post_created === true);
const r1b = (await as(B, `select public.finish_study_session($1) as r`, [g1])).rows?.[0]?.r;
ok("replaying finish grants nothing more", r1b?.already_finalized === true && r1b?.earned_xp === 95);
ok(
  "XP ledger holds exactly 95 for B",
  (await db.query(`select sum(amount)::int n from xp_transactions where user_id=$1`, [B])).rows[0].n === 95,
);
ok(
  "one post for the session",
  (await db.query(`select count(*)::int n from posts where study_session_id=$1`, [g1])).rows[0].n === 1,
);
const g2 = (await as(B, `select (public.start_study_session('free')).id`)).rows?.[0]?.id;
await db.query(`update study_sessions set started_at = now() - interval '20 minutes' where id=$1`, [g2]);
const r2 = (await as(B, `select public.finish_study_session($1) as r`, [g2])).rows?.[0]?.r;
ok("daily goal bonus only once per day", r2?.earned_xp === 20 && r2?.total_xp === 115);
ok(
  "subject not shared in feed by default",
  (await db.query(`select subject_name from posts where study_session_id=$1`, [g1])).rows[0].subject_name ===
    null,
);
ok("A (friend) sees B posts", (await as(A, `select * from posts`)).rows?.length === 2);
ok("C (not friend) sees no B post", (await as(C, `select * from posts`)).rows?.length === 0);
ok(
  "A sees B stats",
  (await as(A, `select total_xp from user_stats where user_id='${B}'`)).rows?.[0]?.total_xp === 115,
);
ok("C cannot see B stats", (await as(C, `select * from user_stats`)).rows?.length === 0);
ok("client cannot write stats", !!(await as(B, `update user_stats set total_xp = 99999`)).error);
ok(
  "client cannot forge a post",
  !!(
    await as(
      B,
      `insert into posts (user_id, duration_minutes, earned_xp, streak_days) values ('${B}', 600, 9999, 99)`,
    )
  ).error,
);
const post1 = (await db.query(`select id from posts where study_session_id=$1`, [g1])).rows[0].id;
ok("A reacts to B post", !(await as(A, `insert into post_reactions (post_id) values ($1)`, [post1])).error);
ok(
  "double reaction rejected",
  !!(await as(A, `insert into post_reactions (post_id) values ($1)`, [post1])).error,
);
ok(
  "C cannot react to an invisible post",
  !!(await as(C, `insert into post_reactions (post_id) values ($1)`, [post1])).error,
);
ok(
  "C cannot react as A",
  !!(await as(C, `insert into post_reactions (post_id, user_id) values ($1, '${A}')`, [post1])).error,
);
ok(
  "B sees the reaction count",
  (await as(B, `select count(*)::int n from post_reactions where post_id=$1`, [post1])).rows?.[0]?.n === 1,
);
ok(
  "B deletes own post",
  (await as(B, `delete from posts where id=$1 returning id`, [post1])).rows?.length === 1,
);
ok("A cannot delete B post", (await as(A, `delete from posts returning id`)).rows?.length === 0);
ok(
  "settings are private",
  !(await as(B, `insert into user_settings (timezone) values ('Europe/Paris')`)).error &&
    (await as(A, `select * from user_settings`)).rows?.length === 0,
);
ok(
  "unknown time zone rejected",
  !!(await as(A, `insert into user_settings (timezone) values ('Mars/Olympus')`)).error,
);

// streak milestone: 6 past days + today = 7 days → +100, once
for (let k = 6; k >= 1; k--) {
  await db.query(
    `insert into study_sessions (user_id, status, started_at, ended_at, last_heartbeat_at)
     values ($1, 'completed', now() - make_interval(days => $2) - interval '15 minutes', now() - make_interval(days => $2), now())`,
    [C, k],
  );
}
const c7 = (await as(C, `select (public.start_study_session('free')).id`)).rows?.[0]?.id;
await db.query(`update study_sessions set started_at = now() - interval '15 minutes' where id=$1`, [c7]);
const rc = (await as(C, `select public.finish_study_session($1) as r`, [c7])).rows?.[0]?.r;
ok("7-day streak detected", rc?.streak_days === 7 && rc?.record_days === 7);
ok(
  "streak milestone bonus granted",
  rc?.breakdown?.some((b) => b.reason === "streak_milestone" && b.xp === 100) && rc?.earned_xp === 115,
);
const c8 = (await as(C, `select (public.start_study_session('free')).id`)).rows?.[0]?.id;
await db.query(`update study_sessions set started_at = now() - interval '15 minutes' where id=$1`, [c8]);
const rc2 = (await as(C, `select public.finish_study_session($1) as r`, [c8])).rows?.[0]?.r;
ok(
  "milestone not granted twice (15 min + daily goal 50)",
  rc2?.earned_xp === 65 && !rc2?.breakdown?.some((b) => b.reason === "streak_milestone"),
);

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
ok(
  "B cannot read A XP",
  (await as(B, `select * from xp_transactions where user_id = '${A}'`)).rows.length === 0,
);

// academic module: settings, exams, new subject/grade fields
ok("A sets own target", !(await as(A, `insert into academic_settings (target_average) values (12)`)).error);
ok("B cannot read A target", (await as(B, `select * from academic_settings`)).rows.length === 0);
ok(
  "B cannot write a target for A",
  !!(await as(B, `insert into academic_settings (user_id, target_average) values ('${A}', 5)`)).error,
);
ok(
  "target above 20 rejected",
  !!(await as(B, `insert into academic_settings (target_average) values (21)`)).error,
);
ok(
  "A creates subject with UE, semester, target, coef 0",
  !(
    await as(
      A,
      `insert into subjects (name, coefficient, teaching_unit, semester, target_average) values ('Option', 0, 'UE 1', 'S1', 11)`,
    )
  ).error,
);
ok(
  "A creates grade with kind and coef 0",
  !(
    await as(A, `insert into grades (subject_id, value, coefficient, kind) values ($1, 12, 0, 'oral')`, [
      subj,
    ])
  ).error,
);
ok(
  "unknown grade kind rejected",
  !!(await as(A, `insert into grades (subject_id, value, kind) values ($1, 12, 'magic')`, [subj])).error,
);
ok(
  "B cannot update A subject",
  (await as(B, `update subjects set name='hack' returning id`)).rows?.length === 0,
);
ok("B cannot delete A grades", (await as(B, `delete from grades returning id`)).rows?.length === 0);
ok(
  "A cannot move own grade to B",
  !!(await as(A, `update grades set user_id='${B}' where subject_id=$1`, [subj])).error ||
    (await as(B, `select * from grades`)).rows.length === 0,
);
ok(
  "A creates exam on own subject",
  !(
    await as(A, `insert into exams (subject_id, title, exam_on) values ($1, 'Partiel', '2026-12-10')`, [subj])
  ).error,
);
ok(
  "B cannot attach exam to A subject",
  !!(await as(B, `insert into exams (subject_id, title, exam_on) values ($1, 'x', '2026-12-10')`, [subj]))
    .error,
);
ok("B cannot see A exams", (await as(B, `select * from exams`)).rows.length === 0);
ok("anon cannot see exams", ((await as(null, `select * from exams`)).rows?.length ?? 0) === 0);
await as(A, `delete from subjects where id=$1`, [subj]);
ok(
  "deleting a subject keeps the exam, detached",
  (await as(A, `select subject_id from exams`)).rows?.[0]?.subject_id === null,
);

// agenda: calendar_events (private, owner only)
const AG = (await as(B, `insert into subjects (name, coefficient) values ('Droit', 2) returning id`))
  .rows?.[0]?.id;
const ev = (cols, vals, params) => as(B, `insert into calendar_events (${cols}) values (${vals})`, params);
ok(
  "B creates a timed event",
  !(
    await ev(
      "title, starts_on, last_on, start_time, end_time",
      "'Révision', '2026-12-01', '2026-12-01', '18:00', '19:00'",
    )
  ).error,
);
ok(
  "B creates an all-day event",
  !(await ev("title, starts_on, last_on, kind", "'Férié', '2026-12-25', '2026-12-25', 'other'")).error,
);
ok(
  "B creates a weekly series",
  !(await ev("title, starts_on, last_on, recurrence", "'Cours', '2026-12-01', '2027-01-26', 'weekly'")).error,
);
ok(
  "end before start rejected",
  !!(
    await ev(
      "title, starts_on, last_on, start_time, end_time",
      "'x', '2026-12-01', '2026-12-01', '19:00', '18:00'",
    )
  ).error,
);
ok(
  "only one of start/end time rejected",
  !!(await ev("title, starts_on, last_on, start_time", "'x', '2026-12-01', '2026-12-01', '19:00'")).error,
);
ok(
  "series ending before it starts rejected",
  !!(await ev("title, starts_on, last_on, recurrence", "'x', '2026-12-10', '2026-12-01', 'daily'")).error,
);
ok(
  "series longer than a year rejected",
  !!(await ev("title, starts_on, last_on, recurrence", "'x', '2026-12-01', '2028-01-01', 'daily'")).error,
);
ok(
  "non repeating event spanning several days rejected",
  !!(await ev("title, starts_on, last_on", "'x', '2026-12-01', '2026-12-03'")).error,
);
ok(
  "unknown kind rejected",
  !!(await ev("title, starts_on, last_on, kind", "'x', '2026-12-01', '2026-12-01', 'magic'")).error,
);
ok(
  "B attaches an event to own subject",
  !(await ev("title, starts_on, last_on, subject_id", "'Droit', '2026-12-02', '2026-12-02', $1", [AG])).error,
);
ok(
  "C cannot attach an event to B subject",
  !!(
    await as(
      C,
      `insert into calendar_events (title, starts_on, last_on, subject_id) values ('x', '2026-12-02', '2026-12-02', $1)`,
      [AG],
    )
  ).error,
);
ok("C cannot see B events", (await as(C, `select * from calendar_events`)).rows.length === 0);
ok("anon cannot see events", ((await as(null, `select * from calendar_events`)).rows?.length ?? 0) === 0);
ok(
  "C cannot update B events",
  (await as(C, `update calendar_events set title='hack' returning id`)).rows?.length === 0,
);
ok("C cannot delete B events", (await as(C, `delete from calendar_events returning id`)).rows?.length === 0);
ok(
  "B cannot hand an event to C",
  !!(await as(B, `update calendar_events set user_id='${C}'`)).error ||
    (await as(C, `select * from calendar_events`)).rows.length === 0,
);
await as(B, `delete from subjects where id=$1`, [AG]);
ok(
  "deleting a subject keeps its events, detached",
  (await as(B, `select count(*)::int n from calendar_events where title='Droit' and subject_id is null`))
    .rows?.[0]?.n === 1,
);

// planning: plan_status on calendar_events
const planned = (status, extra = "") =>
  as(
    C,
    `insert into calendar_events (title, kind, starts_on, last_on, start_time, end_time, plan_status${extra ? ", " + extra.split("=")[0] : ""}) values ('Réviser', 'study', '2026-12-03', '2026-12-03', '18:00', '18:45', ${status}${extra ? ", " + extra.split("=")[1] : ""})`,
  );
ok("C creates a recommended session", !(await planned("'recommended'")).error);
ok("C creates an accepted session", !(await planned("'accepted'")).error);
ok(
  "C creates a locked session with a reason",
  !(await planned("'locked'", "plan_reason='Examen proche'")).error,
);
ok("unknown plan status rejected", !!(await planned("'magic'")).error);
ok(
  "planned session must be a timed study slot",
  !!(
    await as(
      C,
      `insert into calendar_events (title, kind, starts_on, last_on, start_time, end_time, plan_status) values ('x', 'class', '2026-12-03', '2026-12-03', '18:00', '18:45', 'accepted')`,
    )
  ).error &&
    !!(
      await as(
        C,
        `insert into calendar_events (title, kind, starts_on, last_on, plan_status) values ('x', 'study', '2026-12-03', '2026-12-03', 'accepted')`,
      )
    ).error,
);
ok(
  "planned session cannot repeat",
  !!(
    await as(
      C,
      `insert into calendar_events (title, kind, starts_on, last_on, start_time, end_time, recurrence, plan_status) values ('x', 'study', '2026-12-03', '2026-12-10', '18:00', '18:45', 'weekly', 'accepted')`,
    )
  ).error,
);
ok(
  "plan reason longer than 400 rejected",
  !!(await planned("'accepted'", `plan_reason='${"x".repeat(401)}'`)).error,
);
ok(
  "C moves a session through the statuses",
  !(await as(C, `update calendar_events set plan_status='locked' where plan_status='recommended'`)).error,
);
ok(
  "a manual event keeps a null plan_status",
  (await as(B, `select count(*)::int n from calendar_events where plan_status is not null`)).rows?.[0]?.n ===
    0,
);
ok(
  "B cannot change the status of C sessions",
  (await as(B, `update calendar_events set plan_status='locked' where user_id='${C}' returning id`)).rows
    ?.length === 0,
);

// privacy settings (S-15) and account deletion (S-14)
{
  const D = "00000000-0000-0000-0000-00000000000d";
  const E = "00000000-0000-0000-0000-00000000000e";
  await db.exec(
    `insert into auth.users (id, email, raw_user_meta_data) values ('${D}','d@x.fr','{}'),('${E}','e@x.fr','{}');`,
  );
  await db.exec(
    `insert into friendships (requester_id, addressee_id, status) values ('${D}','${E}','accepted') on conflict do nothing;`,
  );
  ok(
    "default visibility is friends",
    (await as(D, `select default_visibility from user_settings`)).rows.length === 0,
  );
  const live = (await as(D, `select id from start_study_session('free')`)).rows?.[0];
  ok(
    "new session follows the default (friends)",
    (await as(D, `select visibility from study_sessions`)).rows?.[0]?.visibility === "friends",
  );
  ok(
    "friend sees the running session",
    (await as(E, `select id from study_sessions where user_id='${D}'`)).rows.length === 1,
  );
  await as(D, `insert into user_settings (show_live_status) values (false)`);
  ok(
    "friend no longer sees the running session once live status is off",
    (await as(E, `select id from study_sessions where user_id='${D}'`)).rows.length === 0,
  );
  ok("owner still sees it", (await as(D, `select id from study_sessions`)).rows.length === 1);
  await as(D, `select cancel_study_session($1)`, [live?.id]);
  await as(D, `update user_settings set default_visibility='private', show_live_status=true`);
  await as(D, `select start_study_session('free')`);
  ok(
    "new session follows the private default",
    (await as(D, `select visibility from study_sessions where status='in_progress'`)).rows?.[0]
      ?.visibility === "private",
  );
  ok(
    "explicit visibility wins over the default",
    !(await as(D, `select cancel_study_session(id) from study_sessions where status='in_progress'`)).error &&
      (await as(D, `select visibility from start_study_session('free', null, null, 'friends')`)).rows?.[0]
        ?.visibility === "friends",
  );
  ok(
    "unknown default visibility rejected",
    !!(await as(D, `update user_settings set default_visibility='public'`)).error,
  );
  ok(
    "another user cannot read the live flag row",
    (await as(E, `select * from user_settings where user_id='${D}'`)).rows.length === 0,
  );

  // achievements (S-18): automatic, non-repeatable, owner-only, no client write
  await db.exec(
    `update study_sessions set started_at = now() - interval '45 minutes', paused_seconds = 0
       where user_id='${D}' and status='in_progress'`,
  );
  const achSid = (await as(D, `select id from study_sessions where status='in_progress'`)).rows?.[0]?.id;
  ok("D finishes a session", !(await as(D, `select finish_study_session($1)`, [achSid])).error);
  const ach = (await as(D, `select my_achievements() as a`)).rows?.[0]?.a ?? [];
  const byId = Object.fromEntries(ach.map((a) => [a.id, a]));
  ok("catalogue is returned in full", ach.length === 11);
  ok(
    "first session unlocked by finishing one",
    !!byId.first_session?.unlockedAt && byId.first_session.progress === null,
  );
  ok("friend achievement unlocked by an accepted friendship", !!byId.first_friend?.unlockedAt);
  ok(
    "a locked achievement shows progress",
    byId.friends_5?.progress?.current === 1 && byId.friends_5?.progress?.target === 5,
  );
  ok("streak achievement not unlocked after one day", !byId.streak_7?.unlockedAt);
  const before = (await as(D, `select count(*)::int n from user_achievements`)).rows?.[0]?.n;
  await as(D, `select my_achievements()`);
  await as(D, `select my_achievements()`);
  ok(
    "awards are never duplicated",
    (await as(D, `select count(*)::int n from user_achievements`)).rows?.[0]?.n === before,
  );
  ok(
    "client cannot grant itself an achievement",
    !!(await as(D, `insert into user_achievements (user_id, achievement_id) values ('${D}','streak_100')`))
      .error,
  );
  ok(
    "client cannot delete an award",
    ((await as(D, `delete from user_achievements returning 1`)).rows ?? []).length === 0 ||
      !!(await as(D, `delete from user_achievements`)).error,
  );
  ok(
    "another user cannot read my awards",
    (await as(E, `select * from user_achievements where user_id='${D}'`)).rows.length === 0,
  );
  ok("anon cannot read achievements", !!(await as(null, `select my_achievements()`)).error);

  // account deletion: everything of D goes, E stays
  await as(D, `insert into subjects (name, coefficient) values ('Maths', 2)`);
  await as(D, `insert into exams (title, exam_on) values ('Partiel', '2026-12-10')`);
  await as(
    D,
    `insert into calendar_events (title, starts_on, last_on) values ('x', '2026-12-10', '2026-12-10')`,
  );
  ok("anon cannot delete an account", !!(await as(null, `select delete_my_account()`)).error);
  ok("D deletes own account", !(await as(D, `select delete_my_account()`)).error);
  const tables = (
    await db.query(
      `select table_name from information_schema.columns where table_schema='public' and column_name='user_id' group by 1`,
    )
  ).rows.map((r) => r.table_name);
  let leftover = 0;
  for (const t of tables)
    leftover += (await db.query(`select count(*)::int n from public.${t} where user_id='${D}'`)).rows[0].n;
  leftover += (
    await db.query(
      `select count(*)::int n from public.friendships where requester_id='${D}' or addressee_id='${D}'`,
    )
  ).rows[0].n;
  leftover += (await db.query(`select count(*)::int n from public.profiles where id='${D}'`)).rows[0].n;
  leftover += (await db.query(`select count(*)::int n from auth.users where id='${D}'`)).rows[0].n;
  ok(`no row of the deleted user remains (${tables.length} tables checked)`, leftover === 0);
  ok(
    "the friend account is untouched",
    (await db.query(`select count(*)::int n from auth.users where id='${E}'`)).rows[0].n === 1,
  );
  await db.exec(`delete from auth.users where id='${E}'`);
}

// delete cascade
await db.exec(`delete from auth.users where id='${A}'`);
ok("user deletion cascades", (await db.query(`select count(*)::int n from grades`)).rows[0].n === 0);
ok(
  "user deletion cascades to exams and settings",
  (await db.query(`select (select count(*) from exams) + (select count(*) from academic_settings) as n`))
    .rows[0].n == 0,
);

await db.exec(`delete from auth.users where id in ('${B}', '${C}')`);
ok(
  "user deletion cascades to calendar events",
  (await db.query(`select count(*)::int n from calendar_events`)).rows[0].n === 0,
);

console.log(failures ? `\n${failures} FAILED` : "\nALL PASSED");
process.exit(failures ? 1 : 0);
