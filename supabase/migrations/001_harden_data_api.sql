-- 001 · Harden the Data API BEFORE any table exists.
--
-- Supabase's default privileges grant ALL on new objects in `public` to the
-- anon and authenticated roles, which means every table is readable by anyone
-- holding the publishable key that ships in the browser bundle.
--
-- This app never uses the Data API at all: the only path to the database is the
-- pooled server connection in src/lib/db.ts, behind Server Components and
-- Server Actions. So the safe posture is deny-by-default, and nothing is ever
-- granted back.
--
-- `anon` and `authenticated` are Supabase's own roles and do not exist on a
-- plain Postgres, which is what a local database or a CI container is. Rather
-- than keep a second copy of the schema for that case, the whole file is
-- guarded on the roles existing and is simply a no-op where they do not.

do $$
declare
  has_anon bool := exists (select 1 from pg_roles where rolname = 'anon');
  has_auth bool := exists (select 1 from pg_roles where rolname = 'authenticated');
  roles    text;
begin
  if not has_anon and not has_auth then
    raise notice 'anon/authenticated not present - not a Supabase database, skipping';
    return;
  end if;

  roles := concat_ws(', ',
    case when has_anon then 'anon' end,
    case when has_auth then 'authenticated' end
  );

  -- Existing objects (none expected on a fresh project, but be certain).
  execute format('revoke all on all tables    in schema public from %s', roles);
  execute format('revoke all on all sequences in schema public from %s', roles);
  execute format('revoke all on all functions in schema public from %s', roles);

  -- Future objects, created by whichever role runs the migrations.
  execute format('alter default privileges in schema public revoke all on tables    from %s', roles);
  execute format('alter default privileges in schema public revoke all on sequences from %s', roles);
  execute format('alter default privileges in schema public revoke all on functions from %s', roles);

  if exists (select 1 from pg_roles where rolname = 'postgres') then
    execute format('alter default privileges for role postgres in schema public revoke all on tables    from %s', roles);
    execute format('alter default privileges for role postgres in schema public revoke all on sequences from %s', roles);
    execute format('alter default privileges for role postgres in schema public revoke all on functions from %s', roles);
  end if;

  -- The schema itself stays visible so anything explicitly granted later would
  -- resolve; nothing is readable without both a grant and an RLS policy, and
  -- this app never adds either.
  execute format('grant usage on schema public to %s', roles);
end
$$;
