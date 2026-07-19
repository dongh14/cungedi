begin;

alter table public.restaurants
  add column if not exists district text;

create index if not exists restaurants_district_idx
  on public.restaurants (district);

commit;
