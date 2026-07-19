import assert from "node:assert/strict";
import test from "node:test";
import {
  formatLocationLabel,
  resolvePlaceArea,
  normalizeCityForComparison,
  normalizeCityName,
} from "../location.ts";
import {
  buildRestaurantInsertPayload,
  buildRestaurantUpdatePayload,
} from "./record-payloads.ts";

test("unknown international cities remain valid without being forced into the known registry", () => {
  assert.equal(normalizeCityName("Reykjavik"), null);
  assert.equal(normalizeCityForComparison("Reykjavik"), "Reykjavik");
});

test("city and country stay separate in saved payloads and blank country becomes null", () => {
  const insertPayload = buildRestaurantInsertPayload("user-1", {
    name: "Kyoto Place",
    city: "Kyoto",
    country: "",
    sourceUrl: "https://example.com/kyoto",
    privacy: "private",
    category: "景点",
    address: null,
    cuisine: null,
    note: null,
  });

  assert.equal(insertPayload.city, "Kyoto");
  assert.equal(insertPayload.country, "日本");
  assert.equal(insertPayload.district, null);

  const updatePayload = buildRestaurantUpdatePayload({
    id: 7,
    country: "France",
    privacy: "private",
    category: "景点",
    cuisine: null,
    note: null,
  });

  assert.equal(updatePayload.country, "法国");
});

test("global city and country labels are formatted without changing saved values", () => {
  assert.equal(formatLocationLabel("Tokyo", "Japan"), "Tokyo · Japan");
  assert.equal(formatLocationLabel("Paris", "France"), "Paris · France");
  assert.equal(formatLocationLabel("Hong Kong", "Hong Kong"), "Hong Kong");
  assert.equal(formatLocationLabel("Kyoto", null), "Kyoto");
  assert.equal(formatLocationLabel("", "Japan"), "Japan");
});

test("known cities resolve a conservative country without rewriting the city", () => {
  assert.deepEqual(resolvePlaceArea({ city: "Osaka" }), {
    city: "Osaka",
    country: "日本",
    district: null,
  });
  assert.deepEqual(resolvePlaceArea({ city: "Shanghai" }), {
    city: "Shanghai",
    country: "中国",
    district: null,
  });
  assert.deepEqual(resolvePlaceArea({ city: "Paris" }), {
    city: "Paris",
    country: "法国",
    district: null,
  });
});

test("unknown cities remain unchanged and unresolved while explicit country is preserved", () => {
  assert.deepEqual(resolvePlaceArea({ city: "Reykjavik" }), {
    city: "Reykjavik",
    country: null,
    district: null,
  });
  assert.deepEqual(resolvePlaceArea({ city: "Osaka", country: "Canada" }), {
    city: "Osaka",
    country: "Canada",
    district: null,
  });
});

test("known district text resolves an area without requiring an address rewrite", () => {
  assert.deepEqual(resolvePlaceArea({ city: "上海", address: "上海市静安区南京西路" }), {
    city: "上海",
    country: "中国",
    district: "静安区",
  });
  assert.deepEqual(resolvePlaceArea({ city: "Tokyo", district: "Shinjuku City" }), {
    city: "Tokyo",
    country: "日本",
    district: "Shinjuku",
  });
});
