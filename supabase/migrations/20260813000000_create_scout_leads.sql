create table if not exists public.scout_leads (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  source text not null default 'scout_limit',
  guest_questions integer not null default 3,
  status text not null default 'captured',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists scout_leads_created_at_idx on public.scout_leads (created_at desc);
create index if not exists scout_leads_status_idx on public.scout_leads (status);
