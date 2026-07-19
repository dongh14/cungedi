import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const migration = readFileSync(
  new URL("./20260719100000_add_restaurant_district.sql", import.meta.url),
  "utf8",
);

test("district migration is additive and leaves existing place data unchanged", () => {
  assert.match(migration, /alter table public\.restaurants/i);
  assert.match(migration, /add column if not exists district text/i);
  assert.match(migration, /restaurants_district_idx/i);
  assert.doesNotMatch(migration, /update\s+public\.restaurants/i);
  assert.doesNotMatch(migration, /drop\s+table|truncate|delete\s+from/i);
});
