-- Standalone LotScout Search subscription access.
-- Full paid LotScout plans include Search automatically via subscription_tier.
alter table public.profiles
  add column if not exists has_search_pro boolean not null default false;

create index if not exists profiles_has_search_pro_idx
  on public.profiles (has_search_pro)
  where has_search_pro = true;
