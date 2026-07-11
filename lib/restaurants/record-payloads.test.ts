import assert from "node:assert/strict";
import test from "node:test";
import { categoryOptions } from "./constants";
import {
  buildRestaurantInsertPayload,
  buildRestaurantUpdatePayload,
} from "./record-payloads";

test("manual save payload supports every allowed category", () => {
  for (const option of categoryOptions) {
    const payload = buildRestaurantInsertPayload("user-1", {
      name: "示例地点",
      city: "上海",
      sourceUrl: "https://example.com/place",
      privacy: "public",
      category: option.value,
      address: "示例路 1 号",
      cuisine: "川菜",
      note: "周末想去",
    });

    assert.equal(payload.category, option.value);
    assert.equal(payload.privacy, "public");
    assert.equal(payload.cuisine, "川菜");
  }
});

test("edit payload includes category changes without altering cuisine or privacy behavior", () => {
  const payload = buildRestaurantUpdatePayload({
    id: 3,
    privacy: "private",
    category: "住宿",
    cuisine: "咖啡馆",
    note: "改成住宿分类后仍保留原备注",
  });

  assert.deepEqual(payload, {
    category: "住宿",
    cuisine: "咖啡馆",
    note: "改成住宿分类后仍保留原备注",
    privacy: "private",
  });
});
