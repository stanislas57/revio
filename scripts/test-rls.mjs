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
ok(
  "B cannot update A session",
  (await as(B, `update study_sessions set status='abandoned' returning id`)).rows?.length === 0,
);
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
