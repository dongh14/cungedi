begin;

alter table public.restaurants
  add column if not exists country text;

create index if not exists restaurants_country_idx
  on public.restaurants (country);

commit;
