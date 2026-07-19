import assert from "node:assert/strict";
import test from "node:test";
import {
  filterRecordsByLocation,
  formatHierarchyLocationLabel,
  getLocationHierarchy,
  parseLocationFilterState,
  serializeLocationFilterState,
} from "../location-hierarchy.ts";

const places = [
  { id: 1, name: "Osaka place", country: "Japan", city: "Osaka" },
  { id: 2, name: "Shanghai place", country: "China", city: "Shanghai" },
  { id: 3, name: "Shanghai legacy alias", country: "中国", city: "上海市" },
  { id: 4, name: "Country only", country: "Japan", city: "" },
  { id: 5, name: "Legacy place", country: null, city: "上海" },
];

test("builds a country to city hierarchy without merging same-named cities", () => {
  const hierarchy = getLocationHierarchy(places);
  const japan = hierarchy.find((country) => country.label === "Japan");
  const china = hierarchy.find((country) => country.label === "China");

  assert.deepEqual(japan?.cities, [{ value: "osaka", label: "Osaka", placeCount: 1 }]);
  assert.deepEqual(china?.cities, [{ value: "上海", label: "上海", placeCount: 2 }]);
});

test("filters city values inside the selected country", () => {
  assert.deepEqual(
    filterRecordsByLocation(places, { selectedCountry: "Japan", selectedCity: "osaka" }).map((place) => place.id),
    [1],
  );
  assert.deepEqual(
    filterRecordsByLocation(places, { selectedCountry: "China", selectedCity: "上海" }).map((place) => place.id),
    [2, 3],
  );
});

test("country-only records remain visible and expose no city option", () => {
  const japan = getLocationHierarchy(places).find((country) => country.label === "Japan");

  assert.equal(japan?.placeCount, 2);
  assert.deepEqual(japan?.cities, [{ value: "osaka", label: "Osaka", placeCount: 1 }]);
  assert.deepEqual(
    filterRecordsByLocation(places, { selectedCountry: "Japan", selectedCity: "" }).map((place) => place.id),
    [1, 4],
  );
});

test("legacy records without country stay in an unassigned group", () => {
  const unassigned = getLocationHierarchy(places).find((country) => country.label === "未标注国家");

  assert.deepEqual(unassigned?.cities, [{ value: "上海", label: "上海", placeCount: 1 }]);
  assert.deepEqual(
    filterRecordsByLocation(places, { selectedCountry: "__unassigned_country__", selectedCity: "上海" }).map((place) => place.id),
    [5],
  );
});

test("location filter state survives URL serialization and parsing", () => {
  const serialized = serializeLocationFilterState({ selectedCountry: "Japan", selectedCity: "osaka" });

  assert.deepEqual(parseLocationFilterState(serialized), {
    selectedCountry: "日本",
    selectedCity: "osaka",
  });
  assert.deepEqual(parseLocationFilterState(""), { selectedCountry: "", selectedCity: "" });
});

test("location labels stay compact across country, city, and district", () => {
  assert.equal(formatHierarchyLocationLabel("中国", "上海", "静安区"), "中国 · 上海 · 静安区");
  assert.equal(formatHierarchyLocationLabel("Japan", "Tokyo", "Shinjuku"), "Japan · Tokyo · Shinjuku");
  assert.equal(formatHierarchyLocationLabel(null, "上海", null), "上海");
  assert.equal(formatHierarchyLocationLabel("Japan", "Tokyo", "Tokyo"), "Japan · Tokyo");
});
