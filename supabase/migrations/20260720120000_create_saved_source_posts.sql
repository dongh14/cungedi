begin;

create table if not exists public.saved_source_posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  platform text not null,
  original_url text,
  resolved_url text,
  original_text text,
  source_image_path text,
  processing_status text not null default 'captured',
  detected_candidates jsonb not null default '[]'::jsonb,
  user_note text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint saved_source_posts_platform_check
    check (platform in ('xiaohongshu', 'douyin', 'web', 'unknown')),
  constraint saved_source_posts_processing_status_check
    check (processing_status in ('captured', 'processing', 'needs_review', 'saved', 'failed')),
  constraint saved_source_posts_original_url_not_blank
    check (original_url is null or btrim(original_url) <> ''),
  constraint saved_source_posts_resolved_url_not_blank
    check (resolved_url is null or btrim(resolved_url) <> ''),
  constraint saved_source_posts_source_image_path_not_blank
    check (source_image_path is null or btrim(source_image_path) <> ''),
  constraint saved_source_posts_user_note_not_blank
    check (user_note is null or btrim(user_note) <> ''),
  constraint saved_source_posts_detected_candidates_array
    check (jsonb_typeof(detected_candidates) = 'array')
);

create index if not exists saved_source_posts_user_id_idx
  on public.saved_source_posts (user_id);

create index if not exists saved_source_posts_user_status_idx
  on public.saved_source_posts (user_id, processing_status);

create index if not exists saved_source_posts_user_created_at_idx
  on public.saved_source_posts (user_id, created_at desc);

create or replace function public.set_saved_source_posts_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

drop trigger if exists set_saved_source_posts_updated_at on public.saved_source_posts;

create trigger set_saved_source_posts_updated_at
before update on public.saved_source_posts
for each row
execute function public.set_saved_source_posts_updated_at();

create table if not exists public.saved_source_post_places (
  source_post_id uuid not null references public.saved_source_posts (id) on delete cascade,
  restaurant_id bigint not null references public.restaurants (id) on delete cascade,
  created_at timestamptz not null default timezone('utc', now()),
  primary key (source_post_id, restaurant_id)
);

create index if not exists saved_source_post_places_source_post_id_idx
  on public.saved_source_post_places (source_post_id);

create index if not exists saved_source_post_places_restaurant_id_idx
  on public.saved_source_post_places (restaurant_id);

alter table public.saved_source_posts enable row level security;
alter table public.saved_source_post_places enable row level security;

revoke all on table public.saved_source_posts from public, anon;
grant select, insert, update, delete on table public.saved_source_posts to authenticated;

revoke all on table public.saved_source_post_places from public, anon;
grant select, insert, update, delete on table public.saved_source_post_places to authenticated;

drop policy if exists "Authenticated users can view their own saved source posts"
  on public.saved_source_posts;

create policy "Authenticated users can view their own saved source posts"
on public.saved_source_posts
for select
to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "Authenticated users can insert their own saved source posts"
  on public.saved_source_posts;

create policy "Authenticated users can insert their own saved source posts"
on public.saved_source_posts
for insert
to authenticated
with check ((select auth.uid()) = user_id);

drop policy if exists "Authenticated users can update their own saved source posts"
  on public.saved_source_posts;

create policy "Authenticated users can update their own saved source posts"
on public.saved_source_posts
for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

drop policy if exists "Authenticated users can delete their own saved source posts"
  on public.saved_source_posts;

create policy "Authenticated users can delete their own saved source posts"
on public.saved_source_posts
for delete
to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "Authenticated users can view their own saved source post places"
  on public.saved_source_post_places;

create policy "Authenticated users can view their own saved source post places"
on public.saved_source_post_places
for select
to authenticated
using (
  exists (
    select 1
    from public.saved_source_posts
    where saved_source_posts.id = saved_source_post_places.source_post_id
      and saved_source_posts.user_id = (select auth.uid())
  )
  and exists (
    select 1
    from public.restaurants
    where restaurants.id = saved_source_post_places.restaurant_id
      and restaurants.user_id = (select auth.uid())
  )
);

drop policy if exists "Authenticated users can insert their own saved source post places"
  on public.saved_source_post_places;

create policy "Authenticated users can insert their own saved source post places"
on public.saved_source_post_places
for insert
to authenticated
with check (
  exists (
    select 1
    from public.saved_source_posts
    where saved_source_posts.id = saved_source_post_places.source_post_id
      and saved_source_posts.user_id = (select auth.uid())
  )
  and exists (
    select 1
    from public.restaurants
    where restaurants.id = saved_source_post_places.restaurant_id
      and restaurants.user_id = (select auth.uid())
  )
);

drop policy if exists "Authenticated users can update their own saved source post places"
  on public.saved_source_post_places;

create policy "Authenticated users can update their own saved source post places"
on public.saved_source_post_places
for update
to authenticated
using (
  exists (
    select 1
    from public.saved_source_posts
    where saved_source_posts.id = saved_source_post_places.source_post_id
      and saved_source_posts.user_id = (select auth.uid())
  )
  and exists (
    select 1
    from public.restaurants
    where restaurants.id = saved_source_post_places.restaurant_id
      and restaurants.user_id = (select auth.uid())
  )
)
with check (
  exists (
    select 1
    from public.saved_source_posts
    where saved_source_posts.id = saved_source_post_places.source_post_id
      and saved_source_posts.user_id = (select auth.uid())
  )
  and exists (
    select 1
    from public.restaurants
    where restaurants.id = saved_source_post_places.restaurant_id
      and restaurants.user_id = (select auth.uid())
  )
);

drop policy if exists "Authenticated users can delete their own saved source post places"
  on public.saved_source_post_places;

create policy "Authenticated users can delete their own saved source post places"
on public.saved_source_post_places
for delete
to authenticated
using (
  exists (
    select 1
    from public.saved_source_posts
    where saved_source_posts.id = saved_source_post_places.source_post_id
      and saved_source_posts.user_id = (select auth.uid())
  )
  and exists (
    select 1
    from public.restaurants
    where restaurants.id = saved_source_post_places.restaurant_id
      and restaurants.user_id = (select auth.uid())
  )
);

commit;
