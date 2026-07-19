import assert from "node:assert/strict";
import test from "node:test";
import {
  getInitialCountryDataset,
  isCountryLevelLocation,
  normalizeCountryName,
} from "./country-locations.ts";

test("initial country dataset stays intentionally small and expandable", () => {
  assert.deepEqual(
    getInitialCountryDataset().map((record) => record.canonicalName),
    ["日本", "中国", "美国", "韩国", "泰国", "新加坡", "英国", "法国", "澳大利亚", "中国香港", "中国台湾"],
  );
});

test("known country names and aliases are detected conservatively", () => {
  assert.equal(normalizeCountryName("Japan"), "日本");
  assert.equal(normalizeCountryName("日本"), "日本");
  assert.equal(normalizeCountryName("China"), "中国");
  assert.equal(normalizeCountryName("美国"), "美国");
  assert.equal(normalizeCountryName("USA"), "美国");
  assert.equal(normalizeCountryName("South Korea"), "韩国");
  assert.equal(isCountryLevelLocation("韩国"), true);
});

test("unknown locations remain unchanged and are not treated as countries", () => {
  assert.equal(normalizeCountryName("Shanghai"), null);
  assert.equal(normalizeCountryName("未知城市"), null);
  assert.equal(isCountryLevelLocation("Unknown City"), false);
});
