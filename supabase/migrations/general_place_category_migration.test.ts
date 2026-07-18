import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const migration = readFileSync(
  new URL("./20260716100000_add_general_place_entertainment_category.sql", import.meta.url),
  "utf8",
);

test("general place category migration is additive and keeps legacy values valid", () => {
  assert.match(migration, /begin;/i);
  assert.match(migration, /commit;/i);
  assert.match(migration, /'娱乐'/i);
  assert.match(migration, /'玩乐'/i);
  assert.match(migration, /drop constraint if exists restaurants_category_check/i);
});
