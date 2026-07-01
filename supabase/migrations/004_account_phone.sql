-- Phone number now belongs to the account, collected once at signup,
-- instead of being asked again on every chain post.

alter table public.accounts add column if not exists phone_country_code text;
alter table public.accounts add column if not exists phone_number text;

-- not enforced not-null at the DB level since existing accounts predate this
-- field — new signups require it at the application layer (see /api/auth/signup).
