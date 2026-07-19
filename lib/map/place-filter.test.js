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
  {
    id: 5,
    name: "夜游黄浦江",
    city: "shanghai",
    category: "景点",
    latitude: null,
    longitude: null,
  },
  {
    id: 6,
    name: "陆家嘴散步",
    city: "上海市",
    category: "景点",
    latitude: null,
    longitude: null,
  },
  {
    id: 7,
    name: "Unknown City 散步",
    city: "Unknown City",
    category: "其他",
    latitude: null,
    longitude: null,
  },
  {
    id: 8,
    name: "东京旅行清单",
    city: "Japan",
    category: "其他",
    latitude: null,
    longitude: null,
  },
];

test("city filter collapses known aliases into one canonical option and still matches them", () => {
  assert.deepEqual(
    filterPlacesByCity(places, "北京市").map((place) => place.id),
    [2],
  );
  assert.deepEqual(
    filterPlacesByCity(places, "Shanghai").map((place) => place.id),
    [1, 4, 5, 6],
  );
  assert.deepEqual(getMapCityOptions(places), ["北京", "上海", "未知城市", "Unknown City"]);
});

test("unknown cities remain separate city filter options", () => {
  const unknownOnlyPlaces = [
    {
      id: 10,
      name: "未知地点 A",
      city: "Unknown City",
      category: "其他",
      latitude: null,
      longitude: null,
    },
    {
      id: 11,
      name: "未知地点 B",
      city: "未知城市",
      category: "其他",
      latitude: null,
      longitude: null,
    },
  ];

  assert.deepEqual(getMapCityOptions(unknownOnlyPlaces), ["未知城市", "Unknown City"]);
});

test("country-level values are excluded from city selector options", () => {
  assert.deepEqual(
    getMapCityOptions([
      ...places,
      {
        id: 12,
        name: "首尔旅行",
        city: "South Korea",
        category: "其他",
        latitude: null,
        longitude: null,
      },
      {
        id: 13,
        name: "加州旅行",
        city: "United States",
        category: "其他",
        latitude: null,
        longitude: null,
      },
    ]),
    ["北京", "上海", "未知城市", "Unknown City"],
  );
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
    [3, 7, 8],
  );
  assert.deepEqual(
    filterPlacesBySearch(places, "Shanghai").map((place) => place.id),
    [1, 4, 5, 6],
  );
  assert.deepEqual(
    filterPlacesBySearch(places, "上海").map((place) => place.id),
    [1, 4, 5, 6],
  );
});

test("local search also matches a saved country without making it a city option", () => {
  const internationalPlaces = [
    {
      id: 20,
      name: "Tokyo Museum",
      city: "Tokyo",
      country: "Japan",
      category: "景点",
      latitude: null,
      longitude: null,
    },
  ];

  assert.deepEqual(filterPlacesBySearch(internationalPlaces, "Japan").map((place) => place.id), [20]);
  assert.deepEqual(getMapCityOptions(internationalPlaces), ["Tokyo"]);
});

test("local search matches country, city, and country plus city together", () => {
  const internationalPlaces = [
    {
      id: 21,
      name: "Osaka Museum",
      city: "Osaka",
      country: "Japan",
      category: "景点",
      latitude: 34.6937,
      longitude: 135.5023,
    },
    {
      id: 22,
      name: "Shanghai Museum",
      city: "上海",
      country: "中国",
      category: "景点",
      latitude: 31.2304,
      longitude: 121.4737,
    },
  ];

  assert.deepEqual(filterPlacesBySearch(internationalPlaces, "Japan").map((place) => place.id), [21]);
  assert.deepEqual(filterPlacesBySearch(internationalPlaces, "Osaka").map((place) => place.id), [21]);
  assert.deepEqual(filterPlacesBySearch(internationalPlaces, "Japan Osaka").map((place) => place.id), [21]);
  assert.deepEqual(filterPlacesBySearch(internationalPlaces, "中国 上海").map((place) => place.id), [22]);
});

test("local search matches canonical category, legacy category, and subcategory", () => {
  const places = [
    {
      id: 8,
      name: "旧娱乐地点",
      city: "上海",
      category: "玩乐",
      cuisine: "Cinema",
      address: "人民路 1 号",
      note: "晚上去",
    },
  ];

  assert.equal(filterPlacesBySearch(places, "娱乐").length, 1);
  assert.equal(filterPlacesBySearch(places, "Cinema").length, 1);
  assert.equal(filterPlacesBySearch(places, "晚上去").length, 1);
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
    [1, 4, 5, 6],
  );

  assert.deepEqual(
    filterPlacesForMap({
      places,
      searchQuery: "景点",
      selectedCity: "上海",
    }).map((place) => place.id),
    [4, 5, 6],
  );
});

test("unresolved places are counted but do not create markers", () => {
  const display = createFilteredMapDisplay({
    places,
    searchQuery: emptyPlaceSearchQuery,
    selectedCity: allCitiesFilterValue,
  });

  assert.deepEqual(display.markers.map((marker) => marker.id), [1, 2, 4, 5, 6]);
  assert.deepEqual(display.unresolved, {
    total: 3,
    missingLocation: 3,
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
  const lowercaseAliasApproximateMarker = allCitiesDisplay.markers.find((marker) => marker.id === 5);
  const chineseAliasApproximateMarker = allCitiesDisplay.markers.find((marker) => marker.id === 6);

  assert.equal(exactMarker?.approximate, false);
  assert.equal(exactMarker?.precision, "exact");
  assert.equal(approximateMarker?.approximate, true);
  assert.equal(approximateMarker?.precision, "city");
  assert.equal(englishAliasApproximateMarker?.approximate, true);
  assert.equal(englishAliasApproximateMarker?.precision, "city");
  assert.equal(lowercaseAliasApproximateMarker?.approximate, true);
  assert.equal(lowercaseAliasApproximateMarker?.precision, "city");
  assert.equal(chineseAliasApproximateMarker?.approximate, true);
  assert.equal(chineseAliasApproximateMarker?.precision, "city");
});

test("marker rendering only resolves the filtered subset", () => {
  const display = createFilteredMapDisplay({
    places,
    searchQuery: "上海",
    selectedCity: allCitiesFilterValue,
  });

  assert.deepEqual(display.markers.map((marker) => marker.id), [1, 4, 5, 6]);
  assert.deepEqual(display.unresolved, {
    total: 0,
    missingLocation: 0,
    invalidCoordinates: 0,
  });
});
