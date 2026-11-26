// Live checks of the newest migrations on a REAL Supabase project (agenda, planning, privacy settings,
// leaderboard, statistics, achievements, notifications, simulator scenarios, account deletion), through the public API only: publishable key, no secret.
//
//   node scripts/check-live.mjs --url https://<ref>.supabase.co --key <publishable key>
//   (or NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY in the environment)
//
// It creates TWO throwaway accounts (random e-mail @example.test, random password that is never
// printed or stored), uses them, then deletes both with delete_my_account(), which is itself
// under test. E-mail confirmation must be OFF on the project, as for the demo accounts.
// If the script is interrupted, the leftovers are accounts named `check-live-*@example.test`.
import { randomUUID } from "node:crypto";

const args = process.argv.slice(2);
const opt = (name, fallback) => {
  const i = args.indexOf(name);
  return i >= 0 && args[i + 1] ? args[i + 1] : fallback;
};
const URL_BASE = opt("--url", process.env.NEXT_PUBLIC_SUPABASE_URL);
const KEY = opt("--key", process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY);
if (!URL_BASE || !KEY) {
  console.error("Usage: node scripts/check-live.mjs --url <supabase url> --key <publishable key>");
  process.exit(1);
}

async function call(path, { method = "GET", token, body, prefer } = {}) {
  const res = await fetch(`${URL_BASE}${path}`, {
    method,
    headers: {
      apikey: KEY,
      "content-type": "application/json",
      ...(token ? { authorization: `Bearer ${token}` } : {}),
      ...(prefer ? { prefer } : {}),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const text = await res.text();
  let json = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    /* not JSON */
  }
  return { ok: res.ok, status: res.status, json, text };
}
const must = async (promise, what) => {
  const r = await promise;
  if (!r.ok) throw new Error(`${what} → ${r.status} ${r.text.slice(0, 200)}`);
  return r.json;
};

let failures = 0;
const ok = (name, cond) => {
  console.log(`${cond ? "PASS" : "FAIL"}  ${name}`);
  if (!cond) failures++;
};

const password = randomUUID();
const tag = randomUUID().slice(0, 8);

async function signUp(label) {
  const email = `check-live-${tag}-${label}@example.test`;
  const up = await call("/auth/v1/signup", { method: "POST", body: { email, password } });
  if (!up.json?.access_token) {
    throw new Error(`Sign-up gave no session (${up.status}): is e-mail confirmation still ON?`);
  }
  const id = up.json.user.id;
  await must(
    call(`/rest/v1/profiles?id=eq.${id}`, {
      method: "PATCH",
      token: up.json.access_token,
      body: { username: `cl_${label}_${tag}`, display_name: `check ${label}` },
    }),
    "set username",
  );
  return { email, id, token: up.json.access_token };
}

const rest = (user, path, options = {}) => call(`/rest/v1/${path}`, { token: user.token, ...options });
const rpc = (user, fn, body = {}) => call(`/rest/v1/rpc/${fn}`, { method: "POST", token: user?.token, body });
const rows = async (user, path) => {
  const r = await rest(user, path);
  return r.ok && Array.isArray(r.json) ? r.json : null;
};

const users = [];
try {
  const A = await signUp("a");
  users.push(A);
  const B = await signUp("b");
  users.push(B);

  // friends
  const [link] = await must(
    rest(A, "friendships?select=id", {
      method: "POST",
      prefer: "return=representation",
      body: { requester_id: A.id, addressee_id: B.id },
    }),
    "friend request",
  );
  await must(
    rest(B, `friendships?id=eq.${link.id}`, {
      method: "PATCH",
      body: { status: "accepted", responded_at: new Date().toISOString() },
    }),
    "accept",
  );

  // --- agenda ---------------------------------------------------------------------------
  const ev = (user, extra) =>
    rest(user, "calendar_events?select=id", {
      method: "POST",
      prefer: "return=representation",
      body: { title: "Révision", starts_on: "2026-12-07", last_on: "2026-12-07", ...extra },
    });
  const created = await ev(A, { start_time: "18:00", end_time: "19:00" });
  ok("A creates an agenda event", created.ok && created.json?.length === 1);
  ok("end before start is rejected", !(await ev(A, { start_time: "19:00", end_time: "18:00" })).ok);
  ok(
    "series longer than a year is rejected",
    !(await ev(A, { last_on: "2028-01-01", recurrence: "daily" })).ok,
  );
  ok("B cannot see A events", (await rows(B, "calendar_events?select=id"))?.length === 0);
  ok(
    "B cannot edit A events",
    (
      await rest(B, `calendar_events?select=id&id=eq.${created.json[0].id}`, {
        method: "PATCH",
        prefer: "return=representation",
        body: { title: "hack" },
      })
    ).json?.length === 0,
  );
  const subjA = (
    await must(
      rest(A, "subjects?select=id", {
        method: "POST",
        prefer: "return=representation",
        body: { name: "Droit", coefficient: 2 },
      }),
      "subject",
    )
  )[0].id;
  ok("B cannot attach an event to A's subject", !(await ev(B, { subject_id: subjA })).ok);

  // --- planning -------------------------------------------------------------------------
  const planned = (extra) =>
    ev(A, { kind: "study", start_time: "09:00", end_time: "09:45", plan_status: "recommended", ...extra });
  ok("A creates a recommended session", (await planned({})).ok);
  ok("a planned session must be timed", !(await planned({ start_time: null, end_time: null })).ok);
  ok("a planned session cannot repeat", !(await planned({ recurrence: "weekly", last_on: "2026-12-14" })).ok);
  ok("unknown plan status is rejected", !(await planned({ plan_status: "magic" })).ok);

  // --- privacy settings -----------------------------------------------------------------
  const started = await rpc(A, "start_study_session", { p_mode: "free" });
  ok("A starts a session (default visibility friends)", started.ok && started.json?.visibility === "friends");
  const seen = () => rows(B, `study_sessions?select=id&user_id=eq.${A.id}&status=eq.in_progress`);
  ok("friend sees the running session", (await seen())?.length === 1);
  await must(
    rest(A, "user_settings?on_conflict=user_id", {
      method: "POST",
      prefer: "resolution=merge-duplicates",
      body: { user_id: A.id, show_live_status: false },
    }),
    "hide live status",
  );
  ok("friend no longer sees it once live status is off", (await seen())?.length === 0);
  ok("owner still sees it", (await rows(A, "study_sessions?select=id&status=eq.in_progress"))?.length === 1);
  await must(rpc(A, "cancel_study_session", { p_session_id: started.json.id }), "cancel");
  await must(
    rest(A, `user_settings?user_id=eq.${A.id}`, {
      method: "PATCH",
      body: { show_live_status: true, default_visibility: "private" },
    }),
    "private default",
  );
  const priv = await rpc(A, "start_study_session", { p_mode: "free" });
  ok("new session follows the private default", priv.ok && priv.json?.visibility === "private");
  ok("friend does not see a private session", (await seen())?.length === 0);
  await must(rpc(A, "cancel_study_session", { p_session_id: priv.json.id }), "cancel");
  ok(
    "unknown default visibility is rejected",
    !(
      await rest(A, `user_settings?user_id=eq.${A.id}`, {
        method: "PATCH",
        body: { default_visibility: "public" },
      })
    ).ok,
  );

  // --- weekly leaderboard (S-19) ----------------------------------------------------------
  const board = async (user) => (await rpc(user, "weekly_leaderboard")).json;
  const boardA = await board(A);
  ok("A's board has A and B, XP only", Array.isArray(boardA) && boardA.length === 2);
  ok(
    "board exposes no grade or subject column",
    !Object.keys(boardA?.[0] ?? {}).some((k) => /grade|subject|average|note/.test(k)),
  );
  ok("anonymous cannot read a board", !(await rpc(null, "weekly_leaderboard")).ok);
  await must(
    rest(B, "user_settings?on_conflict=user_id", {
      method: "POST",
      prefer: "resolution=merge-duplicates",
      body: { user_id: B.id, show_in_leaderboard: false },
    }),
    "B leaves the board",
  );
  ok(
    "a friend who left disappears from the board",
    (await board(A))?.every((r) => r.user_id !== B.id),
  );
  ok("someone who left sees no board", (await board(B))?.length === 0);
  await must(
    rest(B, `user_settings?user_id=eq.${B.id}`, { method: "PATCH", body: { show_in_leaderboard: true } }),
    "B rejoins",
  );

  // --- statistics (S-20) and achievements (S-18) -----------------------------------------
  const statsBefore = (await rpc(A, "my_study_stats", { p_days: 30 })).json;
  ok(
    "stats: 30-day series, no session yet",
    statsBefore?.daily?.length === 30 && statsBefore?.sessionsCount === 0,
  );
  ok("stats refuse an absurd window", !(await rpc(A, "my_study_stats", { p_days: 5000 })).ok);
  const catalogue = (await rpc(A, "my_achievements")).json;
  ok(
    "achievements: full catalogue, first session locked",
    catalogue?.length === 11 && !catalogue.find((a) => a.id === "first_session")?.unlockedAt,
  );
  ok(
    "achievements: accepted friendship unlocks 'Premier ami'",
    !!catalogue?.find((a) => a.id === "first_friend")?.unlockedAt,
  );
  const quick = await rpc(A, "start_study_session", { p_mode: "free" });
  await must(rpc(A, "finish_study_session", { p_session_id: quick.json?.id }), "finish a session");
  const statsAfter = (await rpc(A, "my_study_stats", { p_days: 30 })).json;
  ok("stats count the finished session", statsAfter?.sessionsCount === 1);
  ok(
    "finishing a session unlocks 'Premier pas' (trigger)",
    !!(await rpc(A, "my_achievements")).json?.find((a) => a.id === "first_session")?.unlockedAt,
  );
  ok(
    "B's stats never include A's session",
    (await rpc(B, "my_study_stats", { p_days: 30 })).json?.sessionsCount === 0,
  );
  ok(
    "client cannot grant itself an achievement",
    !(
      await rest(A, "user_achievements", {
        method: "POST",
        body: { user_id: A.id, achievement_id: "streak_100" },
      })
    ).ok,
  );
  ok(
    "B cannot read A's awards",
    (await rows(B, `user_achievements?select=achievement_id&user_id=eq.${A.id}`))?.length === 0,
  );

  // --- notifications (S-21) --------------------------------------------------------------
  const notesA = await rows(A, "notifications?select=id,kind,read_at");
  ok(
    "A is notified once that the request was accepted",
    notesA?.filter((n) => n.kind === "friend_accepted").length === 1,
  );
  ok(
    "client cannot create a notification",
    !(
      await rest(A, "notifications", {
        method: "POST",
        body: { user_id: B.id, kind: "post_reaction", actor_id: A.id, dedupe_key: "x" },
      })
    ).ok,
  );
  ok(
    "B cannot read A's notifications",
    (await rows(B, "notifications?select=id&kind=eq.friend_accepted"))?.length === 0,
  );
  ok(
    "A can mark a notification read",
    (
      await rest(A, "notifications?read_at=is.null", {
        method: "PATCH",
        prefer: "return=representation",
        body: { read_at: new Date().toISOString() },
      })
    ).json?.length >= 1,
  );

  // --- simulator scenarios (S-22) --------------------------------------------------------
  const hypothesis = [{ subjectId: subjA, value: 15, maxValue: 20, coefficient: 1 }];
  const scenario = (user, extra) =>
    rest(user, "simulation_scenarios?select=id", {
      method: "POST",
      prefer: "return=representation",
      body: { name: "Plan A", hypotheses: hypothesis, ...extra },
    });
  ok("A saves a scenario", (await scenario(A, {})).ok);
  ok("blank name rejected", !(await scenario(A, { name: "   " })).ok);
  ok("empty hypotheses rejected", !(await scenario(A, { hypotheses: [] })).ok);
  ok("B cannot read A's scenarios", (await rows(B, "simulation_scenarios?select=id"))?.length === 0);
  ok("A cannot save a scenario for B", !(await scenario(A, { user_id: B.id })).ok);
  ok("A reads own scenario", (await rows(A, "simulation_scenarios?select=id"))?.length === 1);

  // --- schools and school choice -----------------------------------------------------------
  const found = await rpc(A, "search_schools", {
    p_query: "saint gabriel bagneux",
    p_kind: "lycee",
    p_limit: 20,
  });
  ok("schools are loaded and searchable", found.ok && found.json?.some((r) => r.id === "0920894X"));
  ok("anonymous cannot search schools", !(await rpc(null, "search_schools", { p_query: "paris" })).ok);
  ok(
    "a client cannot add a school",
    !(
      await rest(A, "schools", {
        method: "POST",
        body: { id: "ZZZ9999Z", name: "x", kind: "lycee", search: "x" },
      })
    ).ok,
  );
  const education = (user, schoolId) =>
    rest(user, "user_education?on_conflict=user_id", {
      method: "POST",
      prefer: "resolution=merge-duplicates,return=representation",
      body: { user_id: user.id, school_id: schoolId, onboarding_done: true },
    });
  ok("A saves a school", (await education(A, "0920894X")).ok);
  ok("an unknown school is refused", !(await education(B, "NOPE0000")).ok);
  ok("B cannot read A's school", (await rows(B, "user_education?select=school_id"))?.length === 0);
  ok("A reads own school", (await rows(A, "user_education?select=school_id"))?.[0]?.school_id === "0920894X");

  // --- account deletion -----------------------------------------------------------------
  ok("anonymous cannot delete an account", !(await rpc(null, "delete_my_account")).ok);
  ok("A deletes own account", (await rpc(A, "delete_my_account")).ok);
  ok(
    "A can no longer sign in",
    !(
      await call("/auth/v1/token?grant_type=password", { method: "POST", body: { email: A.email, password } })
    ).ok,
  );
  ok("A's profile is gone for the friend", (await rows(B, `profiles?select=id&id=eq.${A.id}`))?.length === 0);
  ok("A's friendship is gone", (await rows(B, "friendships?select=id"))?.length === 0);
  ok("B is untouched", (await rows(B, `profiles?select=id&id=eq.${B.id}`))?.length === 1);
} catch (error) {
  failures++;
  console.error(`ERROR  ${error.message}`);
} finally {
  // Always remove the throwaway accounts (A may already be gone: the call then fails, which is fine).
  for (const user of users) await rpc(user, "delete_my_account").catch(() => undefined);
}

console.log(failures ? `\n${failures} FAILED` : "\nALL PASSED (throwaway accounts deleted)");
process.exit(failures ? 1 : 0);
