// Live checks of the newest migrations on a REAL Supabase project (agenda, planning, privacy settings,
// account deletion), through the public API only: publishable key, no secret.
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
