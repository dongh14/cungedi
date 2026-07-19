import assert from "node:assert/strict";
import test from "node:test";
import {
  restaurantSelectWithLocation,
  selectRestaurantsWithLocation,
} from "./query-compat.ts";

test("all restaurant reads use the migrated location projection", async () => {
  const selected: string[] = [];
  const result = await selectRestaurantsWithLocation(async (select) => {
    selected.push(select);
    return {
      data: [{ id: 1, country: "Japan", city: "Osaka", district: "Kita" }],
      error: null,
    };
  });

  assert.deepEqual(selected, [restaurantSelectWithLocation]);
  assert.deepEqual(result.data, [{ id: 1, country: "Japan", city: "Osaka", district: "Kita" }]);
  assert.equal(result.error, null);
  assert.match(restaurantSelectWithLocation, /country/);
  assert.match(restaurantSelectWithLocation, /district/);
  assert.match(restaurantSelectWithLocation, /address/);
  assert.match(restaurantSelectWithLocation, /latitude/);
  assert.match(restaurantSelectWithLocation, /longitude/);
});

test("restaurant reads return a safe error when the migrated projection fails", async () => {
  const result = await selectRestaurantsWithLocation(
    async () => ({
      data: null,
      error: {
        code: "PGRST204",
        message: "column country does not exist",
        details: "legacy projection",
        hint: "apply the location migration",
      },
    }),
    "map places",
  );

  assert.equal(result.data, null);
  assert.deepEqual(result.error, {
    operation: "map places",
    name: "QueryError",
    code: "PGRST204",
    message: "column country does not exist",
    details: "legacy projection",
    hint: "apply the location migration",
  });
});

test("restaurant reads turn thrown query failures into safe errors", async () => {
  const result = await selectRestaurantsWithLocation(
    async () => {
      throw new Error("database unavailable");
    },
    "place details",
  );

  assert.equal(result.data, null);
  assert.equal(result.error?.operation, "place details");
  assert.equal(result.error?.message, "database unavailable");
});
