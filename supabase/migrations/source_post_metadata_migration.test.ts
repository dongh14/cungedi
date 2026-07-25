import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";

const migrationPath = path.join(process.cwd(), "supabase/migrations/20260725120000_add_source_post_metadata.sql");

test("source-post metadata migration is additive and compact", () => {
  const sql = readFileSync(migrationPath, "utf8");
  assert.match(sql, /alter table public\.saved_source_posts/i);
  assert.match(sql, /add column if not exists source_metadata jsonb not null default '\{\}'::jsonb/i);
  assert.match(sql, /add column if not exists metadata_status text not null default 'unavailable'/i);
  assert.match(sql, /add column if not exists metadata_fetched_at timestamptz/i);
  assert.match(sql, /jsonb_typeof\(source_metadata\) = 'object'/i);
  assert.match(sql, /metadata_status in \('success', 'partial', 'unavailable', 'blocked', 'timeout', 'invalid', 'failed'\)/i);
  assert.doesNotMatch(sql, /drop table|truncate table|raw_html|response_headers|cookies/i);
});

test("source-post metadata migration does not change existing RLS or public access", () => {
  const sql = readFileSync(migrationPath, "utf8");
  assert.doesNotMatch(sql, /enable row level security|create policy|grant .* to public|grant .* to anon/i);
});
