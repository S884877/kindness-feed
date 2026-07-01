-- Lock down public.accounts. It currently has RLS disabled, meaning anyone
-- with the public anon key can read every row — including plaintext
-- passwords. Fix: hash existing passwords in place, then enable RLS with
-- zero policies for anon/authenticated. Only the service role (used
-- server-side in API routes) can read or write this table from now on.

create extension if not exists pgcrypto;

-- hash any password that isn't already a bcrypt hash (bcrypt hashes start
-- with $2a$, $2b$, or $2y$ and are 60 chars — plaintext won't match that).
update public.accounts
set password = crypt(password, gen_salt('bf'))
where password !~ '^\$2[aby]\$';

-- make sure email can't collide (login/signup already assumed this worked)
do $$
begin
  alter table public.accounts add constraint accounts_email_unique unique (email);
exception
  when duplicate_table then null;
  when duplicate_object then null;
end $$;

alter table public.accounts enable row level security;

-- no policies added on purpose: with RLS on and no policies, anon and
-- authenticated roles get zero access. service role bypasses RLS entirely,
-- which is how /api/auth/login and /api/auth/signup reach this table now.
