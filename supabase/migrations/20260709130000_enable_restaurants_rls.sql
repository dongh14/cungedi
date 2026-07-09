begin;

alter table public.restaurants enable row level security;

revoke all on table public.restaurants from public, anon;
grant select, insert, update, delete on table public.restaurants to authenticated;

revoke all on sequence public.restaurants_id_seq from public, anon;
grant usage, select on sequence public.restaurants_id_seq to authenticated;

drop policy if exists "Authenticated users can view their own restaurants"
  on public.restaurants;

create policy "Authenticated users can view their own restaurants"
on public.restaurants
for select
to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "Authenticated users can insert their own restaurants"
  on public.restaurants;

create policy "Authenticated users can insert their own restaurants"
on public.restaurants
for insert
to authenticated
with check ((select auth.uid()) = user_id);

drop policy if exists "Authenticated users can update their own restaurants"
  on public.restaurants;

create policy "Authenticated users can update their own restaurants"
on public.restaurants
for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

drop policy if exists "Authenticated users can delete their own restaurants"
  on public.restaurants;

create policy "Authenticated users can delete their own restaurants"
on public.restaurants
for delete
to authenticated
using ((select auth.uid()) = user_id);

commit;
