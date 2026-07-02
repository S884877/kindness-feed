-- Run this in your Supabase SQL editor

-- Users table (mirrors auth.users with extra fields)
create table if not exists public.users (
  id uuid references auth.users on delete cascade primary key,
  name text,
  avatar_url text,
  created_at timestamptz default now()
);
alter table public.users enable row level security;
create policy "Users are viewable by everyone" on public.users for select using (true);
create policy "Users can update own profile" on public.users for update using (auth.uid() = id);

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
  kindness text not null check (char_length(kindness) <= 280),
  feeling text not null check (char_length(feeling) <= 280),
  created_at timestamptz default now()
);
alter table public.moments enable row level security;
create policy "Moments are viewable by everyone" on public.moments for select using (true);
create policy "Users can insert own moments" on public.moments for insert with check (auth.uid() = user_id);
create policy "Users can delete own moments" on public.moments for delete using (auth.uid() = user_id);

-- Reactions table
create table if not exists public.reactions (
  id uuid default gen_random_uuid() primary key,
  moment_id uuid references public.moments(id) on delete cascade not null,
  user_id uuid references public.users(id) on delete cascade not null,
  type text not null check (type in ('warmth', 'heart')),
  created_at timestamptz default now(),
  unique(moment_id, user_id, type)
);
alter table public.reactions enable row level security;
create policy "Reactions are viewable by everyone" on public.reactions for select using (true);
create policy "Users can manage own reactions" on public.reactions for all using (auth.uid() = user_id);

-- Seed data (insert into auth first via Supabase dashboard or use anon users trick)
-- These use a placeholder user_id — replace with a real user ID after signing up once
-- Or run after creating a test user via the Supabase Auth dashboard

-- Create a seed user (run this part manually after creating a user)
-- insert into public.moments (user_id, kindness, feeling) values
--   ('<your-user-id>', 'A stranger held the door open for me even though I was far away. They waited.', 'It made me feel like I wasn''t invisible. Like I mattered enough for 10 seconds of someone''s day.'),
--   ('<your-user-id>', 'My coworker noticed I looked tired and brought me a coffee without saying anything.', 'I almost cried. I didn''t know someone was paying that much attention.'),
--   ('<your-user-id>', 'The barista spelled my name right on the first try and gave me a little smile when I noticed.', 'Such a small thing but it set the tone for my whole morning.'),
--   ('<your-user-id>', 'My neighbor left fresh tomatoes from her garden on my doorstep with a little note.', 'I felt like I was part of something. Like community is still real.'),
--   ('<your-user-id>', 'A kid on the subway offered me their seat when they saw I was carrying heavy bags.', 'I was so surprised I forgot to say thank you properly. It stayed with me all day.');
