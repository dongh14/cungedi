import assert from "node:assert/strict";
import test from "node:test";
import {
  createMapSearchSelectablePlaces,
  getActiveMapPlace,
  syncActiveMapPlaceId,
} from "./place-selection.ts";

const markers = [
  {
    id: 1,
    name: "上海精确地点",
    city: "上海",
    category: "美食",
    latitude: 31.225,
    longitude: 121.48,
    precision: "exact",
    approximate: false,
  },
  {
    id: 2,
    name: "Shanghai City 散步",
    city: "Shanghai City",
    category: "景点",
    latitude: 31.2304,
    longitude: 121.4737,
    precision: "city",
    approximate: true,
  },
];

test("search-selectable places preserve the original saved city text", () => {
  assert.deepEqual(createMapSearchSelectablePlaces(markers), [
    {
      id: 1,
      name: "上海精确地点",
      city: "上海",
      category: "美食",
      approximate: false,
    },
    {
      id: 2,
      name: "Shanghai City 散步",
      city: "Shanghai City",
      category: "景点",
      approximate: true,
    },
  ]);
});

test("active map place resolves from the current rendered marker set only", () => {
  assert.equal(getActiveMapPlace(markers, 2)?.name, "Shanghai City 散步");
  assert.equal(getActiveMapPlace(markers, 999), null);
});

test("active map place id clears itself when the selected result is no longer rendered", () => {
  assert.equal(syncActiveMapPlaceId(markers, 2), 2);
  assert.equal(syncActiveMapPlaceId(markers.slice(0, 1), 2), null);
});
