import assert from "node:assert/strict";
import test from "node:test";
import { categoryOptions } from "./constants.ts";
import {
  buildRestaurantInsertPayload,
  buildRestaurantUpdatePayload,
} from "./record-payloads.ts";

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
    assert.equal(payload.privacy, "private");
    assert.equal(payload.cuisine, "川菜");
  }
});

test("edit payload includes category changes and always remains private", () => {
  const payload = buildRestaurantUpdatePayload({
    id: 3,
    privacy: "public",
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

test("edit payload includes the full editable location fields", () => {
  const payload = buildRestaurantUpdatePayload({
    id: 8,
    name: "大阪城公園",
    city: "Osaka",
    country: "日本",
    district: "Chuo Ward",
    privacy: "private",
    category: "景点",
    address: "1-1 Osaka Castle",
    latitude: 34.6873,
    longitude: 135.5262,
    cuisine: null,
    note: "春天再去一次",
  });

  assert.deepEqual(payload, {
    name: "大阪城公園",
    city: "Osaka",
    country: "日本",
    district: "Chuo Ward",
    category: "景点",
    address: "1-1 Osaka Castle",
    latitude: 34.6873,
    longitude: 135.5262,
    cuisine: null,
    note: "春天再去一次",
    privacy: "private",
  });
});

test("new and edited payloads normalize legacy 玩乐 to 娱乐", () => {
  const insertPayload = buildRestaurantInsertPayload("user-1", {
    name: "旧娱乐地点",
    city: "上海",
    sourceUrl: "https://example.com/place",
    privacy: "private",
    category: "玩乐",
    address: null,
    cuisine: null,
    note: null,
  });
  const updatePayload = buildRestaurantUpdatePayload({
    id: 2,
    privacy: "private",
    category: "玩乐",
    cuisine: null,
    note: null,
  });

  assert.equal(insertPayload.category, "娱乐");
  assert.equal(updatePayload.category, "娱乐");
});

test("invalid categories are rejected instead of written", () => {
  assert.throws(() =>
    buildRestaurantInsertPayload("user-1", {
      name: "无效地点",
      city: "上海",
      sourceUrl: "https://example.com/place",
      privacy: "private",
      category: "Museum" as never,
      address: null,
      cuisine: null,
      note: null,
    }),
  );
});
