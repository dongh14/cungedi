import assert from "node:assert/strict";
import test from "node:test";
import {
  diffRestaurantCollectionMemberships,
  normalizeSelectedCollectionIds,
} from "./collection-memberships.ts";

test("users can select collections with stable deduped ids", () => {
  assert.deepEqual(
    normalizeSelectedCollectionIds(["3", "1", "3", "bad", "0", "-2"]),
    [1, 3],
  );
});

test("places can be assigned to collections through join-table diffs", () => {
  assert.deepEqual(
    diffRestaurantCollectionMemberships({
      currentCollectionIds: [1],
      nextCollectionIds: [1, 2, 4],
    }),
    {
      toAdd: [2, 4],
      toRemove: [],
    },
  );
});

test("removing a place from a collection only removes the join membership", () => {
  assert.deepEqual(
    diffRestaurantCollectionMemberships({
      currentCollectionIds: [1, 2, 3],
      nextCollectionIds: [2],
    }),
    {
      toAdd: [],
      toRemove: [1, 3],
    },
  );
});
