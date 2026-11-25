// Seeds two DEMO accounts that are friends, with a few subjects and grades each.
// Works on the local fake server and on a hosted Supabase project (public API
// only: no service-role key, so nothing secret is needed or stored).
//
//   DEMO_PASSWORD='choose-a-password' node scripts/seed-demo.mjs \
//     --url http://127.0.0.1:54399 --key local-fake-key [--prefix demo]
//
// On a hosted project the e-mail confirmation must be OFF (or the accounts
// confirmed by hand), otherwise sign-up returns no session and the script stops.
// Never commit the password. It is idempotent per prefix: re-running signs in.
const args = process.argv.slice(2);
const opt = (name, fallback) => {
  const i = args.indexOf(name);
  return i >= 0 && args[i + 1] ? args[i + 1] : fallback;
};
const URL_BASE = opt("--url", process.env.NEXT_PUBLIC_SUPABASE_URL);
const KEY = opt("--key", process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY);
const PREFIX = opt("--prefix", "demo")
  .toLowerCase()
  .replace(/[^a-z0-9_]/g, "");
const PASSWORD = process.env.DEMO_PASSWORD;

if (!URL_BASE || !KEY || !PASSWORD || PASSWORD.length < 8) {
  console.error(
    "Usage: DEMO_PASSWORD=<8+ chars> node scripts/seed-demo.mjs --url <supabase url> --key <publishable key>",
  );
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
  if (!res.ok) throw new Error(`${method} ${path} → ${res.status} ${text.slice(0, 200)}`);
  return json;
}

async function account(email, username, displayName) {
  let session = null;
  try {
    session = await call("/auth/v1/token?grant_type=password", {
      method: "POST",
      body: { email, password: PASSWORD },
    });
  } catch {
    const up = await call("/auth/v1/signup", { method: "POST", body: { email, password: PASSWORD } });
    session = up?.access_token ? up : null;
  }
  if (!session?.access_token) {
    throw new Error(`No session for ${email}: is e-mail confirmation still ON on this project?`);
  }
  const token = session.access_token;
  const id = session.user.id;
  await call(`/rest/v1/profiles?id=eq.${id}`, {
    method: "PATCH",
    token,
    body: { username, display_name: displayName },
  });
  return { token, id, email, username };
}

async function academics(user, subjects) {
  const existing = await call("/rest/v1/subjects?select=id", { token: user.token });
  if (existing.length > 0) return console.log(`  ${user.username}: subjects already there, skipped`);
  const created = await call("/rest/v1/subjects?select=id,name", {
    method: "POST",
    token: user.token,
    prefer: "return=representation",
    body: subjects.map((s) => ({ name: s.name, coefficient: s.coef, semester: "S1" })),
  });
  const byName = new Map(created.map((s) => [s.name, s.id]));
  await call("/rest/v1/grades", {
    method: "POST",
    token: user.token,
    body: subjects.flatMap((s) =>
      s.grades.map((value) => ({
        subject_id: byName.get(s.name),
        value,
        max_value: 20,
        coefficient: 1,
        kind: "continuous",
      })),
    ),
  });
}

const domain = "example.test";
const alice = await account(`${PREFIX}-alice@${domain}`, `${PREFIX}_alice`, "Alice (démo)");
const bob = await account(`${PREFIX}-bob@${domain}`, `${PREFIX}_bob`, "Bob (démo)");

const links = await call("/rest/v1/friendships?select=id", { token: alice.token });
if (links.length === 0) {
  const [row] = await call("/rest/v1/friendships?select=id", {
    method: "POST",
    token: alice.token,
    prefer: "return=representation",
    body: { requester_id: alice.id, addressee_id: bob.id },
  });
  await call(`/rest/v1/friendships?id=eq.${row.id}`, {
    method: "PATCH",
    token: bob.token,
    body: { status: "accepted", responded_at: new Date().toISOString() },
  });
}

await academics(alice, [
  { name: "Marketing", coef: 3, grades: [11, 14] },
  { name: "Comptabilité", coef: 4, grades: [8, 9.5] },
  { name: "Anglais", coef: 2, grades: [15] },
]);
await academics(bob, [
  { name: "Droit", coef: 3, grades: [12] },
  { name: "Maths", coef: 3, grades: [9, 13] },
]);

console.log(
  `Demo accounts ready (password = DEMO_PASSWORD):\n  ${alice.email}  (@${alice.username})\n  ${bob.email}  (@${bob.username})\nThey are friends. Start a Focus session live during the demo: XP cannot be seeded (durations are locked server-side).`,
);
