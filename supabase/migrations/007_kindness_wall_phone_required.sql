-- phone is now mandatory for the notify-me signup (country code + number,
-- both required in the UI and API) — was optional in 006.

alter table public.kindness_wall_leads alter column phone set not null;
