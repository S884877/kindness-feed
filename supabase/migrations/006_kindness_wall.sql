-- Kindness Wall: standalone landing/post/feed micro-site. Fully anonymous —
-- no login, no accounts FK — separate from `moments`/`chain_acts` on purpose.

create table if not exists public.kindness_wall_posts (
  id uuid default gen_random_uuid() primary key,
  act_text text not null check (char_length(act_text) between 1 and 1500),
  image_url text,
  created_at timestamptz default now()
);

create index if not exists kindness_wall_posts_created_at_idx
  on public.kindness_wall_posts (created_at desc);

alter table public.kindness_wall_posts enable row level security;

-- anonymous, unmoderated: anyone can read, anyone can write (auth.uid()
-- policies would never pass here — this flow doesn't even have an accounts
-- row, matching the permissive pattern in 002_chain.sql).
create policy "kindness_wall_posts_select_all" on public.kindness_wall_posts
  for select using (true);

create policy "kindness_wall_posts_insert_all" on public.kindness_wall_posts
  for insert with check (true);

-- early-access lead capture (email + phone), decoupled from a specific post
-- so a notify-me signup isn't blocked on which post triggered it.
create table if not exists public.kindness_wall_leads (
  id uuid default gen_random_uuid() primary key,
  post_id uuid references public.kindness_wall_posts(id) on delete set null,
  email text not null,
  phone text,
  created_at timestamptz default now()
);

create index if not exists kindness_wall_leads_post_idx
  on public.kindness_wall_leads (post_id);

alter table public.kindness_wall_leads enable row level security;

-- insert-only, no select policy: this table holds PII (email/phone) and
-- nothing in the UI reads it back — tighter than the rest of this schema on
-- purpose, matching how public.accounts was locked down in 003_secure_accounts.sql.
create policy "kindness_wall_leads_insert_all" on public.kindness_wall_leads
  for insert with check (true);

-- storage bucket for wall post photos (public read, matches chain-images model)
insert into storage.buckets (id, name, public)
values ('kindness-wall-images', 'kindness-wall-images', true)
on conflict (id) do nothing;

create policy "kindness_wall_images_public_read" on storage.objects
  for select using (bucket_id = 'kindness-wall-images');

create policy "kindness_wall_images_public_upload" on storage.objects
  for insert with check (bucket_id = 'kindness-wall-images');
