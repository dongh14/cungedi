begin;

create table if not exists public.ai_enrichment_cache (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  cache_key text not null,
  provider text not null,
  model text not null,
  prompt_version text not null,
  source_type text,
  source_url text,
  evidence_hash text not null,
  response_json jsonb not null,
  created_at timestamptz not null default timezone('utc', now()),
  expires_at timestamptz not null,
  constraint ai_enrichment_cache_user_cache_key_key unique (user_id, cache_key)
);

create index if not exists ai_enrichment_cache_user_id_idx
  on public.ai_enrichment_cache (user_id);

create index if not exists ai_enrichment_cache_expires_at_idx
  on public.ai_enrichment_cache (expires_at);

create index if not exists ai_enrichment_cache_evidence_hash_idx
  on public.ai_enrichment_cache (evidence_hash);

alter table public.ai_enrichment_cache enable row level security;

revoke all on table public.ai_enrichment_cache from public, anon;
grant select, insert, update, delete on table public.ai_enrichment_cache to authenticated;

drop policy if exists "Authenticated users can view their own AI enrichment cache"
  on public.ai_enrichment_cache;

create policy "Authenticated users can view their own AI enrichment cache"
on public.ai_enrichment_cache
for select
to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "Authenticated users can insert their own AI enrichment cache"
  on public.ai_enrichment_cache;

create policy "Authenticated users can insert their own AI enrichment cache"
on public.ai_enrichment_cache
for insert
to authenticated
with check ((select auth.uid()) = user_id);

drop policy if exists "Authenticated users can update their own AI enrichment cache"
  on public.ai_enrichment_cache;

create policy "Authenticated users can update their own AI enrichment cache"
on public.ai_enrichment_cache
for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

drop policy if exists "Authenticated users can delete their own AI enrichment cache"
  on public.ai_enrichment_cache;

create policy "Authenticated users can delete their own AI enrichment cache"
on public.ai_enrichment_cache
for delete
to authenticated
using ((select auth.uid()) = user_id);

commit;

-- Rollback: drop table if exists public.ai_enrichment_cache;
