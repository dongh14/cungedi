import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";

const migrationPath = path.join(
  process.cwd(),
  "supabase/migrations/20260720120000_create_saved_source_posts.sql",
);

test("saved source-post migration creates additive tables and indexes", () => {
  const sql = readFileSync(migrationPath, "utf8");

  assert.match(sql, /create table if not exists public\.saved_source_posts/i);
  assert.match(sql, /id uuid primary key default gen_random_uuid\(\)/i);
  assert.match(sql, /original_url text/i);
  assert.match(sql, /resolved_url text/i);
  assert.match(sql, /original_text text/i);
  assert.match(sql, /detected_candidates jsonb not null default '\[\]'::jsonb/i);
  assert.match(sql, /jsonb_typeof\(detected_candidates\) = 'array'/i);
  assert.match(sql, /saved_source_posts_user_status_idx/i);
  assert.match(sql, /saved_source_posts_user_created_at_idx/i);
  assert.match(sql, /create table if not exists public\.saved_source_post_places/i);
  assert.match(sql, /restaurant_id bigint not null references public\.restaurants/i);
  assert.match(sql, /primary key \(source_post_id, restaurant_id\)/i);
});

test("saved source-post migration protects both sides of the join with RLS", () => {
  const sql = readFileSync(migrationPath, "utf8");

  assert.match(sql, /alter table public\.saved_source_posts enable row level security/i);
  assert.match(sql, /alter table public\.saved_source_post_places enable row level security/i);
  assert.match(sql, /grant select, insert, update, delete on table public\.saved_source_posts to authenticated/i);
  assert.match(sql, /grant select, insert, update, delete on table public\.saved_source_post_places to authenticated/i);
  assert.match(sql, /saved_source_posts\.user_id = \(select auth\.uid\(\)\)/i);
  assert.match(sql, /restaurants\.user_id = \(select auth\.uid\(\)\)/i);
  assert.match(sql, /create policy "Authenticated users can select|create policy "Authenticated users can view/i);
  assert.match(sql, /create or replace function public\.set_saved_source_posts_updated_at/i);
  assert.match(sql, /create trigger set_saved_source_posts_updated_at/i);
});
