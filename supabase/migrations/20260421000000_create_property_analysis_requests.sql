create table if not exists property_analysis_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  input_type text not null,
  street_address text,
  city text,
  county text not null,
  state text not null,
  zip_code text,
  apn text,
  verified boolean default false,
  status text default 'pending',
  report_url text,
  submitted_at timestamptz default now(),
  completed_at timestamptz,
  user_email text,
  user_name text
);

alter table property_analysis_requests enable row level security;

create policy "Users can view own requests"
  on property_analysis_requests for select
  using (auth.uid() = user_id);

create policy "Users can insert own requests"
  on property_analysis_requests for insert
  with check (auth.uid() = user_id);
