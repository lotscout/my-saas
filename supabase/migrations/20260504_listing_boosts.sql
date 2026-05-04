-- listing_boosts table
create table if not exists listing_boosts (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid references listings(id) on delete cascade not null,
  user_id uuid references auth.users not null,
  tier text not null,
  budget_cents integer not null,
  weeks integer not null,
  weekly_rate_cents integer not null,
  stripe_session_id text,
  stripe_payment_intent_id text,
  status text default 'pending', -- pending | active | expired | cancelled
  boost_starts_at timestamptz,
  boost_expires_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table listing_boosts enable row level security;

create policy "Users can view own boosts"
  on listing_boosts for select
  using (auth.uid() = user_id);

create policy "Users can insert own boosts"
  on listing_boosts for insert
  with check (auth.uid() = user_id);

-- Add promoted columns to listings if they don't exist
alter table listings add column if not exists promoted boolean default false;
alter table listings add column if not exists boost_expires_at timestamptz;
