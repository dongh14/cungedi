import assert from "node:assert/strict";
import test from "node:test";
import {
  emptyPlaceLibraryFilterState,
  filterPlacesForLibrary,
  getPlaceLibraryCityGroups,
  getPlaceLibraryFilterHref,
  getPlaceLibraryFilterState,
  hasPlaceLibraryFilters,
  placeLibraryCategoryOptions,
} from "./place-library-filter.ts";
import type { RestaurantListItem } from "./types.ts";

const places: RestaurantListItem[] = [
  { id: 1, name: "Shanghai Coffee", country: "China", city: "上海", category: "美食", source_url: "https://a.test", privacy: "private" as const, address: null, cuisine: "咖啡", note: null, created_at: "2026-01-01" },
  { id: 2, name: "Shanghai Museum", country: "中国", city: "上海市", category: "景点", source_url: "https://b.test", privacy: "private" as const, address: null, cuisine: null, note: null, created_at: "2026-01-02" },
  { id: 3, name: "Osaka Cafe", country: "Japan", city: "Osaka", category: "美食", source_url: "https://c.test", privacy: "private" as const, address: null, cuisine: "Cafe", note: null, created_at: "2026-01-03" },
  { id: 4, name: "Old Leisure", country: "Japan", city: "Tokyo", category: "玩乐", source_url: "https://d.test", privacy: "private" as const, address: null, cuisine: null, note: null, created_at: "2026-01-04" },
];

test("no filters return every saved place", () => {
  assert.deepEqual(filterPlacesForLibrary(places, emptyPlaceLibraryFilterState).map((place) => place.id), [1, 2, 3, 4]);
});

test("country and city filter together without merging same-named cities", () => {
  assert.deepEqual(filterPlacesForLibrary(places, { ...emptyPlaceLibraryFilterState, selectedCountry: "中国", selectedCity: "上海" }).map((place) => place.id), [1, 2]);
  assert.deepEqual(filterPlacesForLibrary(places, { ...emptyPlaceLibraryFilterState, selectedCountry: "日本", selectedCity: "osaka" }).map((place) => place.id), [3]);
});

test("category filter canonicalizes legacy entertainment values", () => {
  assert.deepEqual(filterPlacesForLibrary(places, { ...emptyPlaceLibraryFilterState, selectedCategory: "娱乐" }).map((place) => place.id), [4]);
  assert.deepEqual(filterPlacesForLibrary(places, { ...emptyPlaceLibraryFilterState, selectedCategory: "美食" }).map((place) => place.id), [1, 3]);
});

test("search combines with city and category using AND", () => {
  assert.deepEqual(filterPlacesForLibrary(places, { ...emptyPlaceLibraryFilterState, searchQuery: "coffee", selectedCountry: "中国", selectedCity: "上海", selectedCategory: "美食" }).map((place) => place.id), [1]);
  assert.deepEqual(filterPlacesForLibrary(places, { ...emptyPlaceLibraryFilterState, searchQuery: "coffee", selectedCountry: "日本", selectedCity: "osaka", selectedCategory: "景点" }), []);
});

test("city options only include saved cities and stay grouped by country", () => {
  assert.deepEqual(getPlaceLibraryCityGroups(places).map((group) => ({ label: group.label, cities: group.cities.map((city) => city.label) })), [
    { label: "China", cities: ["上海"] },
    { label: "Japan", cities: ["Osaka", "Tokyo"] },
  ]);
});

test("canonical category labels include entertainment and URL state round-trips", () => {
  assert.deepEqual(placeLibraryCategoryOptions.map((option) => option.label), ["美食", "景点", "住宿", "购物", "娱乐", "其他"]);
  const state = getPlaceLibraryFilterState({ q: "coffee", country: "Japan", city: "Osaka", category: "玩乐" });
  assert.equal(getPlaceLibraryFilterHref(state), "/restaurants?q=coffee&country=%E6%97%A5%E6%9C%AC&city=osaka&category=%E5%A8%B1%E4%B9%90");
});

test("clear state restores the default library URL", () => {
  assert.equal(getPlaceLibraryFilterHref(emptyPlaceLibraryFilterState), "/restaurants");
  assert.equal(hasPlaceLibraryFilters(emptyPlaceLibraryFilterState), false);
  assert.equal(hasPlaceLibraryFilters({ ...emptyPlaceLibraryFilterState, selectedCategory: "美食" }), true);
});
