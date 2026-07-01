-- "how did it feel" was removed from the chain post form — feeling_text is
-- no longer collected, so it can no longer be required at the DB level.

alter table public.chain_acts drop constraint if exists chain_acts_feeling_text_check;
alter table public.chain_acts alter column feeling_text drop not null;
