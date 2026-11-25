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
const f1 = (await as(B, `select status, ended_at from public.finish_study_session($1)`, [bs])).rows?.[0];
const f2 = (await as(B, `select status, ended_at from public.finish_study_session($1)`, [bs])).rows?.[0];
ok("finish completes the session", f1?.status === "completed" && !!f1?.ended_at);
ok("finish is idempotent", String(f1?.ended_at) === String(f2?.ended_at));
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

// ---------------------------------------------------------------------------
// XP engine, streak, posts, reactions (migration focus_xp_social)
// ---------------------------------------------------------------------------
const D = "00000000-0000-0000-0000-0000000000d1";
const E = "00000000-0000-0000-0000-0000000000e1";
const F = "00000000-0000-0000-0000-0000000000f1";
const G = "00000000-0000-0000-0000-0000000000a1";
await db.exec(`insert into auth.users (id, email) values
 ('${D}','d@x.fr'),('${E}','e@x.fr'),('${F}','f@x.fr'),('${G}','g@x.fr');
 insert into friendships (requester_id, addressee_id, status) values ('${D}','${E}','accepted');`);

const startAs = async (uid, minutesAgo, extra = "") => {
  const id = (await as(uid, `select id from public.start_study_session('free')`)).rows?.[0]?.id;
  await db.query(
    `update study_sessions set started_at = now() - make_interval(mins => $2) ${extra} where id = $1`,
    [id, minutesAgo],
  );
  return id;
};
const finalize = async (uid, id) =>
  (await as(uid, `select public.finalize_study_session($1) as r`, [id])).rows?.[0]?.r;
const xpRows = async (uid) =>
  (await db.query(`select reason, amount, idempotency_key from xp_transactions where user_id = $1`, [uid]))
    .rows;

// 45 min + daily goal = 95 XP (spec example without planning bonus)
const d1 = await startAs(D, 45);
await as(D, `select public.set_study_session_label($1, '  Statistiques ')`, [d1]);
const r1 = await finalize(D, d1);
ok("45 min session = 45 + 50 (daily goal) = 95 XP", r1?.earnedXp === 95 && r1?.xpBreakdown?.length === 2);
ok(
  "result carries label, minutes and post flag",
  r1?.subjectName === "Statistiques" && r1?.durationMinutes === 45 && r1?.postCreated === true,
);
const r1b = await finalize(D, d1);
ok(
  "finalize twice: same result, flagged, no extra XP",
  r1b?.alreadyFinalized === true && r1b?.earnedXp === 95 && (await xpRows(D)).length === 2,
);
ok(
  "one post per session",
  (await db.query(`select count(*)::int n from posts where study_session_id = $1`, [d1])).rows[0].n === 1,
);

// minimum, per-session and per-day caps
const dShort = await startAs(D, 0);
const rShort = await finalize(D, dShort);
ok(
  "< 5 min: saved, 0 XP, no post",
  rShort?.belowMinimum === true && rShort?.earnedXp === 0 && rShort?.postCreated === false,
);
const dLong = await startAs(D, 240);
const rLong = await finalize(D, dLong);
ok(
  "session counts at most 180 min (45 + 180 = 225 of 300)",
  rLong?.countedMinutes === 180 && rLong?.earnedXp === 180,
);
const dCap = await startAs(D, 200);
const rCap = await finalize(D, dCap);
ok("daily study XP capped at 300 (75 left)", rCap?.earnedXp === 75);
const dCap2 = await startAs(D, 60);
ok("nothing left today: 0 duration XP", (await finalize(D, dCap2))?.earnedXp === 0);
ok("total XP of the day = 300 + 50", (await xpRows(D)).reduce((a, r) => a + r.amount, 0) === 350);

// who can finalize
const dRun = (await as(D, `select id from public.start_study_session('free')`)).rows?.[0]?.id;
ok("E cannot finalize D session", !!(await as(E, `select public.finalize_study_session($1)`, [dRun])).error);
ok("anon cannot finalize", !!(await as(null, `select public.finalize_study_session($1)`, [dRun])).error);
await as(D, `select public.cancel_study_session($1)`, [dRun]);
ok(
  "cancelled session cannot be finalized",
  !!(await as(D, `select public.finalize_study_session($1)`, [dRun])).error,
);

// clients cannot write game data
ok(
  "client cannot write user_stats",
  !!(await as(D, `insert into user_stats (user_id, total_xp) values ('${D}', 99999)`)).error,
);
ok("client cannot update user_stats", !!(await as(D, `update user_stats set total_xp = 99999`)).error);
ok(
  "client cannot create a post",
  !!(
    await as(
      D,
      `insert into posts (user_id, study_session_id, duration_minutes, earned_xp, streak_days) values ('${D}', $1, 600, 9999, 99)`,
      [d1],
    )
  ).error,
);
ok("client cannot call _streak_stats", !!(await as(D, `select * from public._streak_stats('${D}')`)).error);
ok(
  "client cannot insert XP with the new reasons",
  !!(
    await as(
      D,
      `insert into xp_transactions (user_id, amount, reason, idempotency_key) values ('${D}', 500, 'daily_goal', 'hack')`,
    )
  ).error,
);
ok(
  "other user cannot relabel a session",
  !!(await as(E, `select public.set_study_session_label($1, 'x')`, [d1])).error,
);
ok(
  "label longer than 60 chars rejected",
  !!(await as(D, `select public.set_study_session_label($1, $2)`, [d1, "x".repeat(61)])).error,
);

// visibility of stats, posts and reactions
ok(
  "friend reads D stats",
  (await as(E, `select * from user_stats where user_id = '${D}'`)).rows?.length === 1,
);
ok(
  "stranger cannot read D stats",
  (await as(F, `select * from user_stats where user_id = '${D}'`)).rows?.length === 0,
);
ok(
  "owner reads own stats (total XP)",
  (await as(D, `select total_xp from user_stats`)).rows?.[0]?.total_xp === 350,
);
const postId = (await db.query(`select id from posts where study_session_id = $1`, [d1])).rows[0].id;
ok("friend sees the post", (await as(E, `select * from posts where id = $1`, [postId])).rows?.length === 1);
ok(
  "stranger does not see the post",
  (await as(F, `select * from posts where id = $1`, [postId])).rows?.length === 0,
);
const react = (uid) => as(uid, `insert into post_reactions (post_id) values ($1)`, [postId]);
ok("friend reacts", !(await react(E)).error);
ok("one reaction per person", !!(await react(E)).error);
ok("stranger cannot react", !!(await react(F)).error);
ok("friend sees the reaction", (await as(D, `select * from post_reactions`)).rows?.length === 1);
ok("stranger sees no reaction", (await as(F, `select * from post_reactions`)).rows?.length === 0);
ok(
  "cannot react in someone else's name",
  !!(await as(F, `insert into post_reactions (post_id, user_id) values ($1, '${E}')`, [postId])).error,
);
await as(D, `select public.set_study_session_visibility($1, 'private')`, [d1]);
ok(
  "making the session private hides the post",
  (await as(E, `select * from posts where id = $1`, [postId])).rows?.length === 0,
);
ok(
  "owner still sees the post",
  (await as(D, `select * from posts where id = $1`, [postId])).rows?.length === 1,
);
await as(D, `select public.set_study_session_visibility($1, 'friends')`, [d1]);
ok(
  "friend can remove own reaction",
  !(await as(E, `delete from post_reactions where post_id = $1 returning 1`, [postId])).error,
);
ok("reaction removed", (await as(D, `select * from post_reactions`)).rows?.length === 0);

// live friends: a shared running session is readable by friends only
const dLive = (await as(D, `select id from public.start_study_session('free', null, null, 'friends')`))
  .rows?.[0]?.id;
ok(
  "friend sees the running session, stranger does not",
  (await as(E, `select id from study_sessions where id = $1 and status = 'in_progress'`, [dLive])).rows
    ?.length === 1 &&
    (await as(F, `select id from study_sessions where id = $1`, [dLive])).rows?.length === 0,
);
await as(D, `select public.cancel_study_session($1)`, [dLive]);

// regularity grid
ok(
  "my_daily_minutes returns today's minutes",
  (await as(D, `select * from public.my_daily_minutes(28)`)).rows?.[0]?.minutes >= 45,
);
ok(
  "my_daily_minutes is private to the caller",
  (await as(F, `select * from public.my_daily_minutes(28)`)).rows?.length === 0,
);

// streak: 6 validated days + today = 7 days, +100 XP once
for (let k = 1; k <= 6; k++) {
  await db.query(
    `insert into study_sessions (user_id, status, mode, started_at, ended_at)
     values ($1, 'completed', 'free', now() - make_interval(days => $2, mins => 30), now() - make_interval(days => $2))`,
    [G, k],
  );
}
const g1 = await startAs(G, 15);
const rg1 = await finalize(G, g1);
ok(
  "7th streak day grants +100 XP (15 + 100)",
  rg1?.streak?.currentDays === 7 &&
    rg1?.earnedXp === 115 &&
    rg1?.xpBreakdown?.some((b) => b.reason === "streak_milestone" && b.xp === 100),
);
ok(
  "daily goal not reached with 15 min",
  rg1?.dailyGoalCompleted === false && rg1?.streak?.todayValidated === true,
);
const g2 = await startAs(G, 6);
const rg2 = await finalize(G, g2);
ok(
  "milestone bonus not granted twice the same day",
  rg2?.xpBreakdown?.every((b) => b.reason !== "streak_milestone"),
);
ok(
  "user_stats reflects the streak",
  (await db.query(`select current_streak, best_streak from user_stats where user_id = $1`, [G])).rows[0]
    ?.current_streak === 7,
);
// a gap breaks the streak: drop yesterday and today, the last validated day is 2 days ago
await db.query(
  `delete from study_sessions where user_id = $1 and ended_at > now() - interval '1 day 12 hours'`,
  [G],
);
ok(
  "a missed day resets the current streak",
  (await db.query(`select current_streak from public._streak_stats($1)`, [G])).rows[0]?.current_streak === 0,
);

// delete cascade
await db.exec(`delete from auth.users where id='${A}'`);
ok("user deletion cascades", (await db.query(`select count(*)::int n from grades`)).rows[0].n === 0);
ok(
  "user deletion cascades to exams and settings",
  (await db.query(`select (select count(*) from exams) + (select count(*) from academic_settings) as n`))
    .rows[0].n == 0,
);

console.log(failures ? `\n${failures} FAILED` : "\nALL PASSED");
process.exit(failures ? 1 : 0);
