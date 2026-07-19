import assert from "node:assert/strict";
import test from "node:test";
import { searchLocalLocationCandidates } from "./location-search.ts";

test("local location search returns conservative city and area candidates", () => {
  const candidates = searchLocalLocationCandidates("静安区");

  assert.equal(candidates[0]?.district, "静安区");
  assert.equal(candidates[0]?.city, "上海");
  assert.equal(candidates[0]?.country, "中国");
  assert.equal(candidates[0]?.approximate, true);
});

test("local location search handles city text inside a place query", () => {
  const candidates = searchLocalLocationCandidates("大阪城");

  assert.ok(candidates.some((candidate) => candidate.city === "Osaka"));
});

test("current place data is searchable without inventing coordinates", () => {
  const candidates = searchLocalLocationCandidates("Blue Bottle", {
    id: "12",
    name: "Blue Bottle Coffee",
    city: "Tokyo",
    country: "日本",
    latitude: 35.6,
    longitude: 139.7,
  });

  assert.deepEqual(candidates[0], {
    id: "place-12",
    label: "Blue Bottle Coffee",
    subtitle: "Tokyo · 日本",
    city: "Tokyo",
    country: "日本",
    district: null,
    address: null,
    latitude: 35.6,
    longitude: 139.7,
    approximate: false,
  });
});
