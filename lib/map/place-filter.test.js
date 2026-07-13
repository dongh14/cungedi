import assert from "node:assert/strict";
import test from "node:test";
import {
  allCitiesFilterValue,
  createFilteredMapDisplay,
  emptyPlaceSearchQuery,
  filterPlacesByCity,
  filterPlacesBySearch,
  filterPlacesForMap,
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
  {
    id: 4,
    name: "外滩散步",
    city: "Shanghai City",
    category: "景点",
    latitude: null,
    longitude: null,
  },
];

test("city filter returns matching places only", () => {
  assert.deepEqual(
    filterPlacesByCity(places, "北京市").map((place) => place.id),
    [2],
  );
  assert.deepEqual(
    filterPlacesByCity(places, "Shanghai").map((place) => place.id),
    [1, 4],
  );
  assert.deepEqual(getMapCityOptions(places), ["北京市", "上海", "未知城市", "Shanghai City"]);
});

test("empty city filter keeps every loaded place", () => {
  assert.equal(filterPlacesByCity(places, allCitiesFilterValue), places);
});

test("empty search query keeps every loaded place", () => {
  assert.equal(filterPlacesBySearch(places, emptyPlaceSearchQuery), places);
});

test("local search matches name, city, and category without remote lookups", () => {
  assert.deepEqual(
    filterPlacesBySearch(places, "精确").map((place) => place.id),
    [1],
  );
  assert.deepEqual(
    filterPlacesBySearch(places, "北京").map((place) => place.id),
    [2],
  );
  assert.deepEqual(
    filterPlacesBySearch(places, "其他").map((place) => place.id),
    [3],
  );
  assert.deepEqual(
    filterPlacesBySearch(places, "Shanghai").map((place) => place.id),
    [1, 4],
  );
  assert.deepEqual(
    filterPlacesBySearch(places, "上海").map((place) => place.id),
    [1, 4],
  );
});

test("local map filtering composes search before city selection", () => {
  assert.deepEqual(
    filterPlacesForMap({
      places,
      searchQuery: "北京",
      selectedCity: "北京市",
    }).map((place) => place.id),
    [2],
  );

  assert.deepEqual(
    filterPlacesForMap({
      places,
      searchQuery: "Shanghai City",
      selectedCity: "上海",
    }).map((place) => place.id),
    [1, 4],
  );

  assert.deepEqual(
    filterPlacesForMap({
      places,
      searchQuery: "景点",
      selectedCity: "上海",
    }).map((place) => place.id),
    [4],
  );
});

test("unresolved places are counted but do not create markers", () => {
  const display = createFilteredMapDisplay({
    places,
    searchQuery: emptyPlaceSearchQuery,
    selectedCity: allCitiesFilterValue,
  });

  assert.deepEqual(display.markers.map((marker) => marker.id), [1, 2, 4]);
  assert.deepEqual(display.unresolved, {
    total: 1,
    missingLocation: 1,
    invalidCoordinates: 0,
  });
});

test("exact and approximate markers remain distinct after filtering", () => {
  const allCitiesDisplay = createFilteredMapDisplay({
    places,
    searchQuery: emptyPlaceSearchQuery,
    selectedCity: allCitiesFilterValue,
  });
  const exactMarker = allCitiesDisplay.markers.find((marker) => marker.id === 1);
  const approximateMarker = allCitiesDisplay.markers.find((marker) => marker.id === 2);
  const englishAliasApproximateMarker = allCitiesDisplay.markers.find((marker) => marker.id === 4);

  assert.equal(exactMarker?.approximate, false);
  assert.equal(exactMarker?.precision, "exact");
  assert.equal(approximateMarker?.approximate, true);
  assert.equal(approximateMarker?.precision, "city");
  assert.equal(englishAliasApproximateMarker?.approximate, true);
  assert.equal(englishAliasApproximateMarker?.precision, "city");
});

test("marker rendering only resolves the filtered subset", () => {
  const display = createFilteredMapDisplay({
    places,
    searchQuery: "上海",
    selectedCity: allCitiesFilterValue,
  });

  assert.deepEqual(display.markers.map((marker) => marker.id), [1, 4]);
  assert.deepEqual(display.unresolved, {
    total: 0,
    missingLocation: 0,
    invalidCoordinates: 0,
  });
});
