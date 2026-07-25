begin;

alter table public.saved_source_posts
  add column if not exists source_metadata jsonb not null default '{}'::jsonb,
  add column if not exists metadata_status text not null default 'unavailable',
  add column if not exists metadata_fetched_at timestamptz;

alter table public.saved_source_posts
  drop constraint if exists saved_source_posts_source_metadata_object,
  add constraint saved_source_posts_source_metadata_object
    check (jsonb_typeof(source_metadata) = 'object'),
  drop constraint if exists saved_source_posts_metadata_status_check,
  add constraint saved_source_posts_metadata_status_check
    check (metadata_status in ('success', 'partial', 'unavailable', 'blocked', 'timeout', 'invalid', 'failed'));

commit;
