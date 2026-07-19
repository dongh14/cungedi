import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const migration = readFileSync(
  new URL("./20260719090000_add_restaurant_country.sql", import.meta.url),
  "utf8",
);

test("country migration is additive and does not assume a default country", () => {
  assert.match(migration, /alter table public\.restaurants/i);
  assert.match(migration, /add column if not exists country text/i);
  assert.match(migration, /restaurants_country_idx/i);
  assert.doesNotMatch(migration, /default\s+'中国'/i);
  assert.doesNotMatch(migration, /update\s+public\.restaurants/i);
  assert.doesNotMatch(migration, /drop\s+table|truncate|delete\s+from/i);
});
