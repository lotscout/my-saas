-- Land Matcher MVP tables: buyer criteria, ATTOM parcel cache, matches, and outreach queue.

create table if not exists public.land_matcher_buyers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  company text not null,
  contact_name text,
  email text,
  phone text,
  market text,
  neighborhoods text[] not null default '{}',
  zoning text[] not null default '{}',
  min_lot_sqft integer,
  max_lot_sqft integer,
  max_price numeric,
  build_type text,
  notes text,
  status text not null default 'active' check (status in ('active', 'warm', 'paused', 'dead')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.land_matcher_parcels (
  id uuid primary key default gen_random_uuid(),
  attom_id text unique,
  apn text,
  address text not null,
  neighborhood text,
  city text,
  state text,
  zip text,
  owner_name text,
  owner_mailing_address text,
  owner_type text,
  absentee_owner boolean not null default false,
  out_of_state_owner boolean not null default false,
  lot_sqft integer,
  zoning text,
  land_use text,
  assessed_value numeric,
  last_sale_price numeric,
  last_sale_year integer,
  years_owned integer,
  tax_delinquent boolean not null default false,
  lat double precision,
  lng double precision,
  flags text[] not null default '{}',
  raw_attom jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.land_matcher_matches (
  id uuid primary key default gen_random_uuid(),
  buyer_id uuid not null references public.land_matcher_buyers(id) on delete cascade,
  parcel_id uuid not null references public.land_matcher_parcels(id) on delete cascade,
  buyer_fit_score integer not null default 0,
  seller_motivation_score integer not null default 0,
  opportunity_score integer not null default 0,
  reasons text[] not null default '{}',
  red_flags text[] not null default '{}',
  outreach_angle text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (buyer_id, parcel_id)
);

create table if not exists public.land_matcher_outreach (
  id uuid primary key default gen_random_uuid(),
  match_id uuid not null references public.land_matcher_matches(id) on delete cascade,
  status text not null default 'new' check (status in ('new', 'call', 'mail', 'emailed', 'follow-up', 'not-interested', 'seller-interested', 'under-contract', 'closed', 'dead')),
  last_contacted_at timestamptz,
  next_follow_up_at timestamptz,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists land_matcher_buyers_user_id_idx on public.land_matcher_buyers(user_id);
create index if not exists land_matcher_parcels_zip_idx on public.land_matcher_parcels(zip);
create index if not exists land_matcher_parcels_neighborhood_idx on public.land_matcher_parcels(neighborhood);
create index if not exists land_matcher_matches_score_idx on public.land_matcher_matches(opportunity_score desc);
create index if not exists land_matcher_outreach_status_idx on public.land_matcher_outreach(status);

alter table public.land_matcher_buyers enable row level security;
alter table public.land_matcher_parcels enable row level security;
alter table public.land_matcher_matches enable row level security;
alter table public.land_matcher_outreach enable row level security;

-- Keep MVP admin-friendly. Service role can write imports; signed-in users can read the internal dashboard data.
do $$ begin
  create policy "land_matcher_buyers_read" on public.land_matcher_buyers for select to authenticated using (true);
exception when duplicate_object then null;
end $$;

do $$ begin
  create policy "land_matcher_parcels_read" on public.land_matcher_parcels for select to authenticated using (true);
exception when duplicate_object then null;
end $$;

do $$ begin
  create policy "land_matcher_matches_read" on public.land_matcher_matches for select to authenticated using (true);
exception when duplicate_object then null;
end $$;

do $$ begin
  create policy "land_matcher_outreach_read" on public.land_matcher_outreach for select to authenticated using (true);
exception when duplicate_object then null;
end $$;
