import assert from "node:assert/strict";
import test from "node:test";
import { filterPlacesForMap } from "../map/place-filter.ts";
import {
  allCitiesFilterValue,
  allCountriesFilterValue,
  getLocationCityGroups,
  getLocationHierarchy,
  type LocationHierarchyState,
} from "../location-hierarchy.ts";

const places = [
  { id: 1, name: "Osaka cafe", country: "Japan", city: "Osaka", category: "美食", latitude: 34.69, longitude: 135.5 },
  { id: 2, name: "Tokyo museum", country: "日本", city: "东京", category: "景点", latitude: 35.68, longitude: 139.69 },
  { id: 3, name: "Shanghai cafe", country: "中国", city: "上海市", category: "美食", latitude: 31.23, longitude: 121.47 },
  { id: 4, name: "Legacy Shanghai place", country: null, city: "上海", category: "其他", latitude: 31.23, longitude: 121.47 },
];

const allLocationState: LocationHierarchyState = {
  selectedCountry: allCountriesFilterValue,
  selectedCity: allCitiesFilterValue,
};

function filter(state: LocationHierarchyState) {
  return filterPlacesForMap({ places, searchQuery: "", ...state });
}

test("dashboard location defaults to every saved place", () => {
  assert.deepEqual(filter(allLocationState).map((place) => place.id), [1, 2, 3, 4]);
});

test("country and city filters combine with AND logic", () => {
  assert.deepEqual(filter({ selectedCountry: "日本", selectedCity: "东京" }).map((place) => place.id), [2]);
  assert.deepEqual(filter({ selectedCountry: "中国", selectedCity: "上海" }).map((place) => place.id), [3]);
});

test("city-only filtering keeps matching legacy records without a country", () => {
  assert.deepEqual(filter({ selectedCountry: allCountriesFilterValue, selectedCity: "上海" }).map((place) => place.id), [3, 4]);
});

test("location options contain only saved countries and cities", () => {
  assert.deepEqual(getLocationHierarchy(places).map((country) => country.label), ["未标注国家", "中国", "Japan"]);
  assert.deepEqual(
    getLocationCityGroups(places).map((country) => ({ label: country.label, cities: country.cities.map((city) => city.label) })),
    [
      { label: "未标注国家", cities: ["上海"] },
      { label: "中国", cities: ["上海"] },
      { label: "Japan", cities: ["Osaka", "Tokyo"] },
    ],
  );
});

test("changing country can reset an invalid city selection", () => {
  const current = { selectedCountry: "Japan", selectedCity: "osaka" };
  const nextCountryCities = getLocationHierarchy(places).find((country) => country.value === "中国")?.cities ?? [];
  const next = nextCountryCities.some((city) => city.value === current.selectedCity)
    ? current.selectedCity
    : allCitiesFilterValue;

  assert.equal(next, allCitiesFilterValue);
});

test("a filter with no matching places returns an empty map dataset", () => {
  assert.deepEqual(filter({ selectedCountry: "日本", selectedCity: "osaka" }).map((place) => place.id), [1]);
  assert.deepEqual(filter({ selectedCountry: "日本", selectedCity: "京都" }).map((place) => place.id), []);
});
