import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";

const migrationPath = path.join(
  process.cwd(),
  "supabase/migrations/20260714090000_add_collections.sql",
);

test("collections migration creates owner-scoped collections and join table without duplicating place data", () => {
  const sql = readFileSync(migrationPath, "utf8");

  assert.match(sql, /create table if not exists public\.collections/i);
  assert.match(sql, /user_id uuid not null references auth\.users \(id\) on delete cascade/i);
  assert.match(sql, /name text not null/i);
  assert.match(sql, /created_at timestamptz not null default timezone\('utc', now\(\)\)/i);
  assert.match(sql, /updated_at timestamptz not null default timezone\('utc', now\(\)\)/i);
  assert.match(sql, /create unique index if not exists collections_user_id_name_idx/i);
  assert.match(sql, /create table if not exists public\.restaurant_collections/i);
  assert.match(sql, /primary key \(restaurant_id, collection_id\)/i);
  assert.match(sql, /references public\.restaurants \(id\) on delete cascade/i);
  assert.match(sql, /references public\.collections \(id\) on delete cascade/i);
});

test("collections migration enables RLS and limits access to the owning authenticated user", () => {
  const sql = readFileSync(migrationPath, "utf8");

  assert.match(sql, /alter table public\.collections enable row level security/i);
  assert.match(sql, /alter table public\.restaurant_collections enable row level security/i);
  assert.match(sql, /grant select, insert, update, delete on table public\.collections to authenticated/i);
  assert.match(sql, /grant select, insert, delete on table public\.restaurant_collections to authenticated/i);
  assert.match(sql, /create policy "Authenticated users can view their own collections"/i);
  assert.match(sql, /create policy "Authenticated users can insert their own collections"/i);
  assert.match(sql, /create policy "Authenticated users can update their own collections"/i);
  assert.match(sql, /create policy "Authenticated users can delete their own collections"/i);
  assert.match(sql, /create policy "Authenticated users can view their own restaurant collections"/i);
  assert.match(sql, /create policy "Authenticated users can insert their own restaurant collections"/i);
  assert.match(sql, /create policy "Authenticated users can delete their own restaurant collections"/i);
});
