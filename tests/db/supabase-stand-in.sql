-- A thin stand-in for the parts of Supabase the migrations rely on, so the SAME migration and policy SQL runs in
-- PGlite (embedded Postgres) inside Vitest. It copies Supabase's own definitions where they matter:
--   * roles anon, authenticated (subject to row-level security) and service_role (BYPASSRLS), like Supabase;
--   * auth.uid() reads the JWT subject from the request settings exactly as Supabase's function does;
--   * default privileges grant everything on new public tables and functions to the three roles, as Supabase
--     does, so the migrations' own REVOKE/GRANT lines are what is being tested.
-- NOT copied: GoTrue (sign-up, email confirmation, passwords), PostgREST, storage, the real auth.users columns.
create role anon nologin noinherit;
create role authenticated nologin noinherit;
create role service_role nologin noinherit bypassrls;

create schema auth;
grant usage on schema auth to anon, authenticated, service_role;

create table auth.users (
  id uuid primary key default gen_random_uuid(),
  email text unique,
  raw_user_meta_data jsonb not null default '{}'::jsonb,
  email_confirmed_at timestamptz,
  created_at timestamptz not null default now()
);

create function auth.uid() returns uuid language sql stable as $$
  select coalesce(
    nullif(current_setting('request.jwt.claim.sub', true), ''),
    (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'sub')
  )::uuid
$$;
grant execute on function auth.uid() to anon, authenticated, service_role;

-- Supabase's auth.jwt(): the request's JWT claims.
create function auth.jwt() returns jsonb language sql stable as $$
  select coalesce(
    nullif(current_setting('request.jwt.claim', true), ''),
    nullif(current_setting('request.jwt.claims', true), '')
  )::jsonb
$$;
grant execute on function auth.jwt() to anon, authenticated, service_role;

grant usage on schema public to anon, authenticated, service_role;
alter default privileges in schema public grant all on tables to anon, authenticated, service_role;
alter default privileges in schema public grant all on functions to anon, authenticated, service_role;
alter default privileges in schema public grant all on sequences to anon, authenticated, service_role;
