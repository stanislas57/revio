// FAKE Supabase server for LOCAL DEVELOPMENT AND TESTS ONLY. Never deploy it.
//
// Why: no Docker on the founders' machines, so `supabase start` is not an
// option. This server runs the real migrations on PGlite (Postgres in WASM)
// and enforces the real RLS policies, behind a tiny subset of the Supabase
// HTTP API that the app uses:
//   - Auth (GoTrue): signup, password sign-in, refresh, get user, logout.
//     Users are auto-confirmed. Tokens are HS256 JWTs signed with a random
//     secret generated at start-up (restarting signs everyone out).
//   - RPC: POST /rest/v1/rpc/<function> with named arguments (scalar, composite
//     or void results; set-returning functions come back as an array).
//   - PostgREST: select (columns, eq/neq/gt/gte/lt/lte/is/in filters, order,
//     limit, offset), insert, upsert (on_conflict), update, delete, single().
//     Every query runs as role `authenticated` with auth.uid() = token's sub,
//     so RLS decides exactly as it would on Supabase.
// Not supported: embedded resources, realtime, storage, e-mails.
//
// Usage: node scripts/fake-supabase.mjs [--port 54321] [--data .fake-supabase]
//   --data persists the database in a folder (omit for a fresh in-memory DB).
//   --test-clock enables POST /__test/advance-clock {"minutes": n, "username"?: "…"}: it moves the start of the
//   running study sessions (of that user only, when given) n minutes into the past, so a test can finish a "long" session without waiting.
//   Off by default; it exists only in this fake server (the app has no test hook at all).
// Then in .env.local: NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:<port>
//                     NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=local-fake-key
import { PGlite, types } from "@electric-sql/pglite";
import { createHmac, randomBytes, randomUUID, scryptSync, timingSafeEqual } from "node:crypto";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { createServer } from "node:http";
import { join } from "node:path";
import { SUPABASE_SHIM_SQL } from "./pglite-supabase-shim.mjs";

const args = process.argv.slice(2);
const option = (name, fallback) => {
  const i = args.indexOf(name);
  return i >= 0 && args[i + 1] ? args[i + 1] : fallback;
};
const PORT = Number(option("--port", "54321"));
const DATA_DIR = option("--data", null);
const TEST_CLOCK = args.includes("--test-clock");
const MIGRATIONS = option("--migrations", "supabase/migrations");
const JWT_SECRET = randomBytes(32);
const ACCESS_TTL = 3600;

// Return values the way PostgREST serialises them in JSON.
const parsers = {
  [types.NUMERIC]: (v) => Number(v),
  [types.DATE]: (v) => v,
  [types.TIMESTAMPTZ]: (v) => new Date(v).toISOString(),
  [types.TIMESTAMP]: (v) => v,
};
const db = DATA_DIR ? new PGlite(DATA_DIR) : new PGlite();

async function migrate() {
  await db.exec(`create table if not exists public._fake_migrations (name text primary key)`);
  const hasShim = (await db.query(`select 1 from pg_namespace where nspname = 'auth'`)).rows.length > 0;
  if (!hasShim) await db.exec(SUPABASE_SHIM_SQL);
  const applied = new Set(
    (await db.query(`select name from public._fake_migrations`)).rows.map((r) => r.name),
  );
  for (const file of readdirSync(MIGRATIONS)
    .filter((f) => f.endsWith(".sql"))
    .sort()) {
    if (applied.has(file)) continue;
    await db.exec(readFileSync(join(MIGRATIONS, file), "utf8"));
    await db.query(`insert into public._fake_migrations (name) values ($1)`, [file]);
    console.log(`[fake-supabase] applied ${file}`);
  }
  await db.exec(`revoke all on public._fake_migrations from anon, authenticated`);
}

// --- JWT (HS256) ------------------------------------------------------------
const b64url = (input) => Buffer.from(input).toString("base64url");
function signJwt(payload) {
  const head = b64url(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const body = b64url(JSON.stringify(payload));
  const sig = createHmac("sha256", JWT_SECRET).update(`${head}.${body}`).digest("base64url");
  return `${head}.${body}.${sig}`;
}
function verifyJwt(token) {
  const [head, body, sig] = String(token ?? "").split(".");
  if (!head || !body || !sig) return null;
  const expected = createHmac("sha256", JWT_SECRET).update(`${head}.${body}`).digest();
  const given = Buffer.from(sig, "base64url");
  if (given.length !== expected.length || !timingSafeEqual(given, expected)) return null;
  const payload = JSON.parse(Buffer.from(body, "base64url").toString());
  return payload.exp > Date.now() / 1000 ? payload : null;
}

// --- Auth -------------------------------------------------------------------
const refreshTokens = new Map(); // token -> user id
const hashPassword = (password, salt = randomBytes(16).toString("hex")) =>
  `${salt}:${scryptSync(password, salt, 32).toString("hex")}`;
function checkPassword(password, stored) {
  const [salt, hash] = String(stored ?? "").split(":");
  if (!salt || !hash) return false;
  return timingSafeEqual(Buffer.from(hash, "hex"), scryptSync(password, salt, 32));
}
const toUser = (row) => ({
  id: row.id,
  aud: "authenticated",
  role: "authenticated",
  email: row.email,
  email_confirmed_at: row.created_at,
  phone: "",
  app_metadata: { provider: "email", providers: ["email"] },
  user_metadata: row.raw_user_meta_data ?? {},
  identities: [],
  created_at: row.created_at,
  updated_at: row.created_at,
});
function session(row) {
  const now = Math.floor(Date.now() / 1000);
  const refresh = randomBytes(24).toString("hex");
  refreshTokens.set(refresh, row.id);
  return {
    access_token: signJwt({
      sub: row.id,
      aud: "authenticated",
      role: "authenticated",
      email: row.email,
      iat: now,
      exp: now + ACCESS_TTL,
      session_id: randomUUID(),
    }),
    token_type: "bearer",
    expires_in: ACCESS_TTL,
    expires_at: now + ACCESS_TTL,
    refresh_token: refresh,
    user: toUser(row),
  };
}
const authError = (status, code, msg) => [status, { code: status, error_code: code, msg, message: msg }];
const findUser = async (where, value) =>
  (await db.query(`select * from auth.users where ${where} = $1`, [value])).rows[0];

async function handleAuth(method, path, url, body, bearer) {
  if (method === "POST" && path === "/signup") {
    const email = String(body.email ?? "")
      .trim()
      .toLowerCase();
    const password = String(body.password ?? "");
    if (!email.includes("@") || password.length < 8)
      return authError(422, "validation_failed", "Invalid email or password");
    if (await findUser("email", email))
      return authError(422, "user_already_exists", "User already registered");
    const id = randomUUID();
    await db.query(
      `insert into auth.users (id, email, encrypted_password, raw_user_meta_data) values ($1, $2, $3, $4)`,
      [id, email, hashPassword(password), JSON.stringify(body.data ?? {})],
    );
    return [200, session(await findUser("id", id))];
  }
  if (method === "POST" && path === "/token") {
    const grant = url.searchParams.get("grant_type");
    if (grant === "password") {
      const row = await findUser(
        "email",
        String(body.email ?? "")
          .trim()
          .toLowerCase(),
      );
      if (!row || !checkPassword(String(body.password ?? ""), row.encrypted_password))
        return authError(400, "invalid_credentials", "Invalid login credentials");
      return [200, session(row)];
    }
    if (grant === "refresh_token") {
      const id = refreshTokens.get(body.refresh_token);
      const row = id && (await findUser("id", id));
      if (!row) return authError(400, "refresh_token_not_found", "Invalid Refresh Token");
      refreshTokens.delete(body.refresh_token);
      return [200, session(row)];
    }
    return authError(400, "unsupported_grant_type", "Unsupported grant type");
  }
  if (method === "GET" && path === "/user") {
    const claims = verifyJwt(bearer);
    const row = claims && (await findUser("id", claims.sub));
    if (!row) return authError(403, "bad_jwt", "invalid JWT");
    return [200, toUser(row)];
  }
  if (method === "POST" && path === "/logout") {
    return [204, null];
  }
  return authError(404, "not_found", `Fake auth: ${method} ${path} not supported`);
}

// --- PostgREST subset -------------------------------------------------------
const IDENT = /^[a-z_][a-z0-9_]*$/;
const ident = (name) => {
  if (!IDENT.test(name)) throw new RestError(400, "PGRST100", `Invalid identifier: ${name}`);
  return `"${name}"`;
};
class RestError extends Error {
  constructor(status, code, message) {
    super(message);
    this.status = status;
    this.code = code;
  }
}
const OPS = { eq: "=", neq: "<>", gt: ">", gte: ">=", lt: "<", lte: "<=" };
const RESERVED = new Set(["select", "order", "limit", "offset", "on_conflict", "columns"]);

function buildWhere(url, params) {
  const clauses = [];
  for (const [key, raw] of url.searchParams) {
    if (RESERVED.has(key)) continue;
    const column = ident(key);
    const dot = raw.indexOf(".");
    const op = raw.slice(0, dot);
    const value = raw.slice(dot + 1);
    if (op in OPS) {
      params.push(value);
      clauses.push(`${column} ${OPS[op]} $${params.length}`);
    } else if (op === "ilike" || op === "like") {
      // PostgREST uses * as the URL wildcard; SQL % is also accepted as sent by the app.
      params.push(value.replace(/\*/g, "%"));
      clauses.push(`${column} ${op} $${params.length}`);
    } else if (op === "is") {
      const v = { null: "null", true: "true", false: "false" }[value];
      if (!v) throw new RestError(400, "PGRST100", `Unsupported is.${value}`);
      clauses.push(`${column} is ${v}`);
    } else if (op === "in") {
      const list = value
        .replace(/^\(|\)$/g, "")
        .split(",")
        .map((v) => v.replace(/^"|"$/g, ""));
      const holders = list.map((v) => {
        params.push(v);
        return `$${params.length}`;
      });
      clauses.push(holders.length ? `${column} in (${holders.join(", ")})` : "false");
    } else {
      throw new RestError(400, "PGRST100", `Unsupported filter: ${key}=${raw}`);
    }
  }
  return clauses.length ? ` where ${clauses.join(" and ")}` : "";
}

function buildSelect(url) {
  const select = url.searchParams.get("select") ?? "*";
  if (select.trim() === "*") return "*";
  return select
    .split(",")
    .map((c) => c.trim())
    .filter(Boolean)
    .map(ident)
    .join(", ");
}

function buildOrder(url) {
  const order = url.searchParams.get("order");
  if (!order) return "";
  const parts = order.split(",").map((part) => {
    const [col, ...mods] = part.split(".");
    let sql = ident(col);
    for (const m of mods) {
      if (m === "asc" || m === "desc") sql += ` ${m}`;
      else if (m === "nullsfirst") sql += " nulls first";
      else if (m === "nullslast") sql += " nulls last";
      else throw new RestError(400, "PGRST100", `Unsupported order modifier: ${m}`);
    }
    return sql;
  });
  return ` order by ${parts.join(", ")}`;
}

function buildPaging(url) {
  let sql = "";
  const limit = url.searchParams.get("limit");
  const offset = url.searchParams.get("offset");
  if (limit !== null) sql += ` limit ${Math.max(0, Number.parseInt(limit, 10) || 0)}`;
  if (offset !== null) sql += ` offset ${Math.max(0, Number.parseInt(offset, 10) || 0)}`;
  return sql;
}

const PG_STATUS = { 42501: 403, 23505: 409, 23503: 409, 23514: 400, "22P02": 400, 42703: 400, "42P01": 404 };

async function handleRest(method, table, url, body, headers, claims) {
  const prefer = String(headers["prefer"] ?? "");
  const returning = prefer.includes("return=representation");
  const params = [];
  let sql;
  const t = `public.${ident(table)}`;

  if (method === "GET" || method === "HEAD") {
    sql = `select ${buildSelect(url)} from ${t}${buildWhere(url, params)}${buildOrder(url)}${buildPaging(url)}`;
  } else if (method === "POST") {
    const rows = Array.isArray(body) ? body : [body];
    if (rows.length === 0) return [201, []];
    const columns = [...new Set(rows.flatMap((r) => Object.keys(r)))];
    const values = rows.map((row) => {
      const holders = columns.map((c) => {
        if (!(c in row)) return "default";
        params.push(row[c]);
        return `$${params.length}`;
      });
      return `(${holders.join(", ")})`;
    });
    sql = `insert into ${t} (${columns.map(ident).join(", ")}) values ${values.join(", ")}`;
    if (prefer.includes("resolution=merge-duplicates")) {
      const target = (url.searchParams.get("on_conflict") ?? "id").split(",").map(ident).join(", ");
      const updates = columns.map((c) => `${ident(c)} = excluded.${ident(c)}`).join(", ");
      sql += ` on conflict (${target}) do update set ${updates}`;
    } else if (prefer.includes("resolution=ignore-duplicates")) {
      sql += " on conflict do nothing";
    }
    sql += ` returning ${buildSelect(url)}`;
  } else if (method === "PATCH") {
    const columns = Object.keys(body ?? {});
    if (columns.length === 0) throw new RestError(400, "PGRST102", "Empty update");
    const sets = columns.map((c) => {
      params.push(body[c]);
      return `${ident(c)} = $${params.length}`;
    });
    sql = `update ${t} set ${sets.join(", ")}${buildWhere(url, params)} returning ${buildSelect(url)}`;
  } else if (method === "DELETE") {
    sql = `delete from ${t}${buildWhere(url, params)} returning ${buildSelect(url)}`;
  } else {
    throw new RestError(405, "PGRST000", `Method ${method} not supported`);
  }

  const result = await db.transaction(async (tx) => {
    await tx.query(`select set_config('request.jwt.claim.sub', $1, true)`, [claims?.sub ?? ""]);
    await tx.exec(`set local role ${claims ? "authenticated" : "anon"}`);
    return tx.query(sql, params, { parsers });
  });
  const rows = result.rows;

  const wantsObject = String(headers["accept"] ?? "").includes("application/vnd.pgrst.object+json");
  if (wantsObject) {
    if (rows.length !== 1) {
      throw new RestError(
        406,
        "PGRST116",
        `JSON object requested, multiple (or no) rows returned (${rows.length} rows)`,
      );
    }
    return [method === "POST" ? 201 : 200, rows[0]];
  }
  if (method === "GET" || method === "HEAD")
    return [200, rows, { "content-range": `0-${rows.length - 1}/*` }];
  if (!returning) return [method === "POST" ? 201 : 204, null];
  return [method === "POST" ? 201 : 200, rows];
}

// --- RPC (database functions) -----------------------------------------------
async function handleRpc(fn, body, claims) {
  const args = Object.entries(body ?? {});
  const params = args.map(([, v]) => v);
  const list = args.map(([k], i) => `${ident(k)} => $${i + 1}`).join(", ");
  const meta = await db.query(
    `select p.proretset as set, t.typtype as kind, t.typname as type
       from pg_proc p join pg_namespace n on n.oid = p.pronamespace join pg_type t on t.oid = p.prorettype
      where n.nspname = 'public' and p.proname = $1 limit 1`,
    [fn],
  );
  const info = meta.rows[0];
  if (!info) throw new RestError(404, "PGRST202", `Could not find the function public.${fn}`);
  const sql =
    info.kind === "c" || info.set
      ? `select * from public.${ident(fn)}(${list})`
      : `select public.${ident(fn)}(${list}) as value`;
  const result = await db.transaction(async (tx) => {
    await tx.query(`select set_config('request.jwt.claim.sub', $1, true)`, [claims?.sub ?? ""]);
    await tx.exec(`set local role ${claims ? "authenticated" : "anon"}`);
    return tx.query(sql, params, { parsers });
  });
  if (info.set) return [200, result.rows];
  if (info.type === "void") return [204, null];
  if (info.kind === "c") return [200, result.rows[0] ?? null];
  return [200, result.rows[0]?.value ?? null];
}

// --- HTTP -------------------------------------------------------------------
async function readBody(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const text = Buffer.concat(chunks).toString("utf8");
  if (!text) return {};
  try {
    return JSON.parse(text);
  } catch {
    throw new RestError(400, "PGRST102", "Invalid JSON body");
  }
}

const CORS = {
  "access-control-allow-origin": "*",
  "access-control-allow-headers": "*",
  "access-control-allow-methods": "GET, POST, PATCH, DELETE, OPTIONS, HEAD",
  "access-control-expose-headers": "content-range",
};

function send(res, status, payload, extra = {}) {
  const headers = { ...CORS, ...extra };
  if (payload === null || status === 204) {
    res.writeHead(status === 200 ? 204 : status, headers);
    return res.end();
  }
  res.writeHead(status, { ...headers, "content-type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(payload));
}

const server = createServer(async (req, res) => {
  const url = new URL(req.url ?? "/", `http://127.0.0.1:${PORT}`);
  const method = req.method ?? "GET";
  if (method === "OPTIONS") return send(res, 204, null);
  const bearer = String(req.headers.authorization ?? "").replace(/^Bearer\s+/i, "");
  try {
    const body = method === "GET" || method === "HEAD" ? {} : await readBody(req);
    if (url.pathname.startsWith("/auth/v1/")) {
      const [status, payload] = await handleAuth(method, url.pathname.slice(8), url, body, bearer);
      return send(res, status, payload);
    }
    const rpc = url.pathname.match(/^\/rest\/v1\/rpc\/([a-z_][a-z0-9_]*)$/);
    if (rpc && method === "POST") {
      const [status, payload] = await handleRpc(rpc[1], body, verifyJwt(bearer));
      return send(res, status, payload);
    }
    const rest = url.pathname.match(/^\/rest\/v1\/([a-z_][a-z0-9_]*)$/);
    if (rest) {
      const claims = verifyJwt(bearer); // invalid or missing token → anon, like PostgREST with the publishable key
      const [status, payload, extra] = await handleRest(method, rest[1], url, body, req.headers, claims);
      return send(res, status, payload, extra);
    }
    if (TEST_CLOCK && url.pathname === "/__test/advance-clock" && method === "POST") {
      const minutes = Number(body?.minutes);
      if (!Number.isFinite(minutes) || minutes <= 0 || minutes > 600)
        throw new RestError(400, "FAKE001", "minutes must be a number between 0 and 600");
      // Optional: only the running session of this user (tests run in parallel on one server).
      const username = typeof body?.username === "string" ? body.username : null;
      // Superuser connection: the app's roles cannot change these columns, this endpoint can.
      const moved = await db.query(
        `update public.study_sessions set started_at = started_at - make_interval(mins => $1::int)
          where status = 'in_progress'
            and ($2::text is null or user_id = (select id from public.profiles where username = $2::text))`,
        [Math.round(minutes), username],
      );
      return send(res, 200, { shifted: moved.affectedRows ?? 0 });
    }
    if (url.pathname === "/health") return send(res, 200, { ok: true });
    return send(res, 404, { message: `Fake Supabase: ${method} ${url.pathname} not supported` });
  } catch (error) {
    const pgCode = error?.code;
    const status = error instanceof RestError ? error.status : (PG_STATUS[pgCode] ?? 400);
    if (!(error instanceof RestError))
      console.warn(`[fake-supabase] ${method} ${url.pathname}: ${error?.message}`);
    return send(res, status, {
      code: String(pgCode ?? "PGRST000"),
      message: error?.message ?? "Unknown error",
      details: error?.detail ?? null,
      hint: error?.hint ?? null,
    });
  }
});

const isNewData = DATA_DIR ? !existsSync(DATA_DIR) : true;
await migrate();
server.listen(PORT, "127.0.0.1", () => {
  console.log(
    `[fake-supabase] FAKE Supabase (local dev/tests only) on http://127.0.0.1:${PORT}` +
      (DATA_DIR ? ` — data in ${DATA_DIR}${isNewData ? " (new)" : ""}` : " — in-memory"),
  );
});
