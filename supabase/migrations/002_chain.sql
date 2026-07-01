-- Pay-it-forward kindness chain feature.
-- Separate table from `moments` on purpose: the Wall feed queries `moments`
-- directly with no filter, so chain posts must not live there.

create extension if not exists pgcrypto;

create table if not exists public.chain_acts (
  id uuid default gen_random_uuid() primary key,
  parent_id uuid references public.chain_acts(id) on delete set null,
  chain_id uuid not null,
  depth int not null default 1,
  share_token text unique not null,
  user_id uuid references public.accounts(id) on delete cascade not null,
  act_text text not null check (char_length(act_text) between 1 and 1500),
  feeling_text text not null check (char_length(feeling_text) between 1 and 750),
  location_text text,
  image_url text,
  phone_country_code text,
  phone_number text,
  created_at timestamptz default now()
);

alter table public.chain_acts
  add constraint chain_acts_chain_fk foreign key (chain_id) references public.chain_acts(id) on delete cascade
  deferrable initially deferred;

create index if not exists chain_acts_parent_idx on public.chain_acts (parent_id);
create index if not exists chain_acts_chain_idx on public.chain_acts (chain_id);
create index if not exists chain_acts_share_token_idx on public.chain_acts (share_token);
create index if not exists chain_acts_user_idx on public.chain_acts (user_id);

alter table public.chain_acts enable row level security;

-- matches the existing app's permissive pattern (auth is a custom `accounts`
-- table checked client-side, not supabase auth, so auth.uid() policies would
-- never pass here).
create policy "chain_acts_select_all" on public.chain_acts
  for select using (true);

create policy "chain_acts_insert_all" on public.chain_acts
  for insert with check (true);

-- tracks which milestone thresholds (5, 15, 25, 35...) have already been
-- emailed for a given entry's subtree, so we don't send duplicates.
create table if not exists public.chain_milestones_sent (
  entry_id uuid references public.chain_acts(id) on delete cascade not null,
  milestone int not null,
  sent_at timestamptz default now(),
  primary key (entry_id, milestone)
);

alter table public.chain_milestones_sent enable row level security;

create policy "chain_milestones_select_all" on public.chain_milestones_sent
  for select using (true);

create policy "chain_milestones_insert_all" on public.chain_milestones_sent
  for insert with check (true);

-- total descendants under a given entry (its whole subtree), used for
-- "you're the Nth person" style messaging and milestone checks.
create or replace function public.chain_subtree_count(p_entry_id uuid)
returns bigint as $$
  with recursive descendants as (
    select id from public.chain_acts where parent_id = p_entry_id
    union all
    select c.id from public.chain_acts c
    join descendants d on c.parent_id = d.id
  )
  select count(*) from descendants;
$$ language sql stable;

-- storage bucket for chain photos (public read, matches anonymous-post model)
insert into storage.buckets (id, name, public)
values ('chain-images', 'chain-images', true)
on conflict (id) do nothing;

create policy "chain_images_public_read" on storage.objects
  for select using (bucket_id = 'chain-images');

create policy "chain_images_public_upload" on storage.objects
  for insert with check (bucket_id = 'chain-images');
