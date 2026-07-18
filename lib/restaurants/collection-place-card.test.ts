import assert from "node:assert/strict";
import test from "node:test";
import { getCollectionPlaceCardDisplayData } from "./collection-place-card.ts";

test("collection place cards target the read-only details route", () => {
  assert.deepEqual(
    getCollectionPlaceCardDisplayData({
      id: 24,
      name: "示例地点",
      city: "上海",
      category: "景点",
    }),
    {
      detailHref: "/restaurants/24",
      name: "示例地点",
      metadata: "上海 · 景点",
    },
  );
});
