import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";

const migrationPath = path.join(
  process.cwd(),
  "supabase/migrations/20260716120000_create_ai_enrichment_cache.sql",
);

test("AI enrichment cache migration creates an owner-scoped durable cache", () => {
  const sql = readFileSync(migrationPath, "utf8");

  assert.match(sql, /create table if not exists public\.ai_enrichment_cache/i);
  assert.match(sql, /id uuid primary key default gen_random_uuid\(\)/i);
  assert.match(sql, /user_id uuid not null references auth\.users \(id\) on delete cascade/i);
  assert.match(sql, /response_json jsonb not null/i);
  assert.match(sql, /expires_at timestamptz not null/i);
  assert.match(sql, /unique \(user_id, cache_key\)/i);
  assert.match(sql, /ai_enrichment_cache_user_id_idx/i);
  assert.match(sql, /ai_enrichment_cache_expires_at_idx/i);
  assert.match(sql, /ai_enrichment_cache_evidence_hash_idx/i);
});

test("AI enrichment cache migration enables owner-only RLS", () => {
  const sql = readFileSync(migrationPath, "utf8");

  assert.match(sql, /alter table public\.ai_enrichment_cache enable row level security/i);
  assert.match(sql, /grant select, insert, update, delete on table public\.ai_enrichment_cache to authenticated/i);
  assert.match(sql, /create policy "Authenticated users can view their own AI enrichment cache"/i);
  assert.match(sql, /create policy "Authenticated users can insert their own AI enrichment cache"/i);
  assert.match(sql, /create policy "Authenticated users can update their own AI enrichment cache"/i);
  assert.match(sql, /create policy "Authenticated users can delete their own AI enrichment cache"/i);
  assert.match(sql, /select auth\.uid\(\)\s*\) = user_id/i);
  assert.match(sql, /rollback: drop table if exists public\.ai_enrichment_cache/i);
});
