create table if not exists public.scout_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid null,
  session_id text null,
  conversation_id text null,
  event_type text not null,
  question text null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists scout_events_event_type_created_at_idx
  on public.scout_events (event_type, created_at desc);

create index if not exists scout_events_user_id_created_at_idx
  on public.scout_events (user_id, created_at desc);

create index if not exists scout_events_conversation_id_created_at_idx
  on public.scout_events (conversation_id, created_at desc);

alter table public.scout_events enable row level security;

drop policy if exists "Service role can manage scout events" on public.scout_events;
create policy "Service role can manage scout events"
  on public.scout_events
  for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');
