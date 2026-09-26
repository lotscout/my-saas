alter table public.land_matcher_buyers add constraint land_matcher_buyers_company_key unique (company);

alter table public.land_matcher_parcels alter column attom_id type text using attom_id::text;

create index if not exists land_matcher_parcels_city_state_idx on public.land_matcher_parcels(city, state);
create index if not exists land_matcher_parcels_attom_id_idx on public.land_matcher_parcels(attom_id);
