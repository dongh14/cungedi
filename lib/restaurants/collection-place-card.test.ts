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

test("collection place cards display legacy 玩乐 as 娱乐", () => {
  const card = getCollectionPlaceCardDisplayData({
    id: 25,
    name: "旧娱乐记录",
    city: "上海",
    category: "玩乐",
  });

  assert.equal(card.metadata, "上海 · 娱乐");
});
