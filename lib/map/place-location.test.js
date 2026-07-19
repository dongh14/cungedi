import assert from "node:assert/strict";
import test from "node:test";
import {
  getInitialCityCenterDataset,
  normalizeCityForComparison,
  normalizeCityName,
  resolveApproximateCityCenter,
} from "./city-centers.ts";
import { resolvePlaceLocation } from "./place-location.ts";

test("initial city-center dataset stays intentionally small and includes expected cities", () => {
  const dataset = getInitialCityCenterDataset();
  const cityNames = dataset.map((record) => record.cityName);

  assert.deepEqual(cityNames, [
    "北京",
    "上海",
    "广州",
    "深圳",
    "成都",
    "重庆",
    "杭州",
    "南京",
    "武汉",
    "西安",
    "苏州",
    "天津",
    "青岛",
    "厦门",
    "长沙",
    "郑州",
    "昆明",
    "三亚",
    "香港",
    "澳门",
    "Tokyo",
    "Osaka",
    "Kyoto",
    "Seoul",
    "Bangkok",
    "Singapore",
    "Taipei",
    "London",
    "Paris",
    "New York",
    "Los Angeles",
    "San Francisco",
    "Sydney",
  ]);
});

test("exact stored coordinates take precedence over city fallback", () => {
  const result = resolvePlaceLocation({
    city: "上海市",
    latitude: 30.1234,
    longitude: 121.5678,
  });

  assert.deepEqual(result, {
    status: "resolved",
    location: {
      normalizedCityName: "上海",
      latitude: 30.1234,
      longitude: 121.5678,
      precision: "exact",
      approximate: false,
      source: "stored_coordinates",
    },
  });
});

test("known Chinese city resolves to approximate city center", () => {
  const result = resolvePlaceLocation({
    city: "成都",
  });

  assert.deepEqual(result, {
    status: "resolved",
    location: {
      normalizedCityName: "成都",
      latitude: 30.5728,
      longitude: 104.0668,
      precision: "city",
      approximate: true,
      source: "local_city_center",
    },
  });
});

test("known district resolves to an approximate area center before city fallback", () => {
  assert.deepEqual(resolvePlaceLocation({ city: "上海", district: "静安区" }), {
    status: "resolved",
    location: {
      normalizedDistrictName: "静安区",
      normalizedCityName: "上海",
      latitude: 31.228,
      longitude: 121.445,
      precision: "district",
      approximate: true,
      source: "local_district_center",
    },
  });
});

test("unknown districts do not place a record at an unrelated location", () => {
  assert.deepEqual(resolvePlaceLocation({ city: "Unknown City", district: "Unknown Area" }), {
    status: "unresolved",
    reason: "missing_location",
  });
});

test("city suffix normalization supports known conservative variants such as 上海市", () => {
  assert.equal(normalizeCityName("上海市"), "上海");
  assert.equal(normalizeCityName("北京市"), "北京");
  assert.equal(normalizeCityName("广州市"), "广州");
});

test("explicitly supported English aliases normalize conservatively", () => {
  assert.equal(normalizeCityName("Shanghai"), "上海");
  assert.equal(normalizeCityName("Shanghai City"), "上海");
  assert.equal(normalizeCityName("Beijing"), "北京");
  assert.equal(normalizeCityName("Hong Kong"), "香港");
  assert.equal(normalizeCityName("New York City"), "New York");
  assert.equal(normalizeCityName("Tokyo"), "Tokyo");
});

test("comparison normalization keeps unknown cities unchanged while known aliases collapse", () => {
  assert.equal(normalizeCityForComparison("上海市"), "上海");
  assert.equal(normalizeCityForComparison("Shanghai"), "上海");
  assert.equal(normalizeCityForComparison("Unknown City"), "Unknown City");
});

test("unknown or ambiguous city names stay unresolved", () => {
  assert.equal(normalizeCityName("York"), null);
  assert.equal(resolveApproximateCityCenter("不存在的城市"), null);
  assert.deepEqual(resolvePlaceLocation({ city: "Unknown City" }), {
    status: "unresolved",
    reason: "missing_location",
  });
});

test("partial coordinate pair is not treated as exact and can fall back to known city center", () => {
  const result = resolvePlaceLocation({
    city: "深圳",
    latitude: 22.5,
  });

  assert.deepEqual(result, {
    status: "resolved",
    location: {
      normalizedCityName: "深圳",
      latitude: 22.5431,
      longitude: 114.0579,
      precision: "city",
      approximate: true,
      source: "local_city_center",
    },
  });
});

test("invalid stored coordinates are rejected instead of treated as exact", () => {
  assert.deepEqual(
    resolvePlaceLocation({
      city: "北京",
      latitude: 95,
      longitude: 116.4,
    }),
    {
      status: "unresolved",
      reason: "invalid_coordinates",
    },
  );

  assert.deepEqual(
    resolvePlaceLocation({
      city: "北京",
      latitude: 39.9,
      longitude: 200,
    }),
    {
      status: "unresolved",
      reason: "invalid_coordinates",
    },
  );
});

test("approximate results are clearly marked as city-level fallback", () => {
  const result = resolveApproximateCityCenter("Hong Kong");

  assert.deepEqual(result, {
    normalizedCityName: "香港",
    latitude: 22.3193,
    longitude: 114.1694,
    precision: "city",
    approximate: true,
    source: "local_city_center",
  });
});

test("english aliases resolve through the same conservative location layer", () => {
  assert.deepEqual(resolveApproximateCityCenter("Shanghai City"), {
    normalizedCityName: "上海",
    latitude: 31.2304,
    longitude: 121.4737,
    precision: "city",
    approximate: true,
    source: "local_city_center",
  });
});

test("global city fallbacks require a compatible known country", () => {
  assert.deepEqual(resolveApproximateCityCenter("Tokyo", "Japan"), {
    normalizedCityName: "Tokyo",
    latitude: 35.6762,
    longitude: 139.6503,
    precision: "city",
    approximate: true,
    source: "local_city_center",
  });
  assert.equal(resolveApproximateCityCenter("Tokyo", "France"), null);
  assert.equal(resolveApproximateCityCenter("Kyoto", "Japan")?.normalizedCityName, "Kyoto");
});
