import assert from "node:assert/strict";
import test from "node:test";
import {
  allCitiesFilterValue,
  createFilteredMapDisplay,
  filterPlacesByCity,
  getMapCityOptions,
} from "./place-filter.ts";

const places = [
  {
    id: 1,
    name: "上海精确地点",
    city: "上海",
    category: "美食",
    latitude: 31.225,
    longitude: 121.48,
  },
  {
    id: 2,
    name: "北京近似地点",
    city: "北京市",
    category: "景点",
    latitude: null,
    longitude: null,
  },
  {
    id: 3,
    name: "无法定位的地点",
    city: "未知城市",
    category: "其他",
    latitude: null,
    longitude: null,
  },
];

test("city filter returns matching places only", () => {
  assert.deepEqual(
    filterPlacesByCity(places, "北京市").map((place) => place.id),
    [2],
  );
  assert.deepEqual(getMapCityOptions(places), ["北京市", "上海", "未知城市"]);
});

test("empty city filter keeps every loaded place", () => {
  assert.equal(filterPlacesByCity(places, allCitiesFilterValue), places);
});

test("unresolved places are counted but do not create markers", () => {
  const display = createFilteredMapDisplay(places, allCitiesFilterValue);

  assert.deepEqual(display.markers.map((marker) => marker.id), [1, 2]);
  assert.deepEqual(display.unresolved, {
    total: 1,
    missingLocation: 1,
    invalidCoordinates: 0,
  });
});

test("exact and approximate markers remain distinct after filtering", () => {
  const allCitiesDisplay = createFilteredMapDisplay(places, allCitiesFilterValue);
  const exactMarker = allCitiesDisplay.markers.find((marker) => marker.id === 1);
  const approximateMarker = allCitiesDisplay.markers.find((marker) => marker.id === 2);

  assert.equal(exactMarker?.approximate, false);
  assert.equal(exactMarker?.precision, "exact");
  assert.equal(approximateMarker?.approximate, true);
  assert.equal(approximateMarker?.precision, "city");
});
