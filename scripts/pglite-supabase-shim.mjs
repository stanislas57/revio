// Minimal shim of Supabase's auth schema and roles for PGlite (Postgres in WASM).
// Shared by scripts/test-rls.mjs and scripts/fake-supabase.mjs.
// Not the real Supabase stack: always validate on a real project too.
export const SUPABASE_SHIM_SQL = `
create role anon nologin; create role authenticated nologin; create role service_role nologin bypassrls;
create schema auth;
create table auth.users (
  id uuid primary key,
  email text unique,
  encrypted_password text,
  raw_user_meta_data jsonb default '{}',
  created_at timestamptz not null default now()
);
create function auth.uid() returns uuid language sql stable as $$
  select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
grant usage on schema public, auth to anon, authenticated, service_role;
grant execute on function auth.uid() to anon, authenticated;
alter default privileges in schema public grant all on tables to anon, authenticated, service_role;
alter default privileges in schema public grant all on functions to anon, authenticated, service_role;
`;
