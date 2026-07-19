import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import test from "node:test";

const pageSource = readFileSync(resolve(process.cwd(), "app/restaurants/page.tsx"), "utf8");

test("all places page keeps one title and removes repetitive header copy", () => {
  assert.equal((pageSource.match(/全部地点/g) ?? []).length, 1);
  assert.doesNotMatch(pageSource, /eyebrow="地点"/);
  assert.doesNotMatch(pageSource, /这是你的个人地点库，筛选只是缩小范围/);
  assert.doesNotMatch(pageSource, /只显示当前账号的私有记录/);
});

test("all places page keeps filters and the existing place list branches", () => {
  assert.match(pageSource, /<PlaceLibraryFilters/);
  assert.match(pageSource, /<RestaurantList/);
  assert.match(pageSource, /没有符合条件的地点/);
});
