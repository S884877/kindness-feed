-- Users table (mirrors auth.users)
create table if not exists public.users (
  id uuid references auth.users on delete cascade primary key,
  name text,
  avatar_url text,
  created_at timestamptz default now()
);

alter table public.users enable row level security;

create policy "users_select_all" on public.users
  for select using (true);

create policy "users_update_own" on public.users
  for update using (auth.uid() = id);

-- Auto-create user row on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.users (id, name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Moments table
create table if not exists public.moments (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.users(id) on delete cascade not null,
  kindness text not null check (char_length(kindness) between 1 and 1500),
  feeling text not null check (char_length(feeling) between 1 and 750),
  created_at timestamptz default now()
);

alter table public.moments enable row level security;

create policy "moments_select_all" on public.moments
  for select using (true);

create policy "moments_insert_own" on public.moments
  for insert with check (auth.uid() = user_id);

create policy "moments_delete_own" on public.moments
  for delete using (auth.uid() = user_id);

create index moments_created_at_idx on public.moments (created_at desc);

-- Reactions table
create table if not exists public.reactions (
  id uuid default gen_random_uuid() primary key,
  moment_id uuid references public.moments(id) on delete cascade not null,
  user_id uuid references public.users(id) on delete cascade not null,
  type text not null check (type in ('warmth', 'heart')),
  created_at timestamptz default now(),
  unique (moment_id, user_id, type)
);

alter table public.reactions enable row level security;

create policy "reactions_select_all" on public.reactions
  for select using (true);

create policy "reactions_all_own" on public.reactions
  for all using (auth.uid() = user_id);

-- Seed data (5 example moments using a seed user)
do $$
declare
  seed_user_id uuid := '00000000-0000-0000-0000-000000000001';
begin
  -- Insert a placeholder user (bypasses auth for seed purposes)
  insert into public.users (id, name, avatar_url)
  values (seed_user_id, 'seeds', null)
  on conflict (id) do nothing;

  -- Insert 5 seed moments
  insert into public.moments (user_id, kindness, feeling) values
    (seed_user_id,
     'A stranger held the door open for me even though I was far away. They waited.',
     'It made me feel like I wasn''t invisible. Like I mattered enough for 10 seconds of someone''s day.'),
    (seed_user_id,
     'My coworker noticed I looked tired and brought me a coffee without saying anything.',
     'I almost cried. I didn''t know someone was paying that much attention.'),
    (seed_user_id,
     'The barista spelled my name right on the first try and gave me a little smile when I noticed.',
     'Such a small thing but it set the tone for my whole morning.'),
    (seed_user_id,
     'My neighbor left fresh tomatoes from her garden on my doorstep with a little note.',
     'I felt like I was part of something. Like community is still real.'),
    (seed_user_id,
     'A kid on the subway offered me their seat when they saw I was carrying heavy bags.',
     'I was so surprised I forgot to say thank you properly. It stayed with me all day.')
  on conflict do nothing;
end $$;
