import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";

const migrationPath = path.join(
  process.cwd(),
  "supabase/migrations/20260711110000_add_restaurant_category.sql",
);

test("category migration defaults existing rows to 美食 and restricts allowed values", () => {
  const sql = readFileSync(migrationPath, "utf8");

  assert.match(
    sql,
    /update public\.restaurants\s+set category = '美食'\s+where category is null/i,
  );
  assert.match(sql, /alter column category set default '美食'/i);
  assert.match(sql, /alter column category set not null/i);
  assert.match(sql, /drop constraint if exists restaurants_category_check/i);
  assert.match(
    sql,
    /check\s*\(\s*category in \('美食', '购物', '玩乐', '景点', '住宿', '其他'\)\s*\)/i,
  );
});
