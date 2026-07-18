import assert from "node:assert/strict";
import test from "node:test";
import { getPlaceDetailsDisplayData } from "./place-details.ts";

const basePlace = {
  id: 12,
  name: "teamLab Borderless",
  city: "上海",
  source_url: "https://example.com/places/teamlab?private=1",
  privacy: "private" as const,
  category: "景点" as const,
  address: "浦东新区示例路 1 号",
  cuisine: "Art Gallery",
  note: "夜间更适合参观",
  latitude: 31.23,
  longitude: 121.47,
  created_at: "2026-07-18T08:00:00.000Z",
};

test("details projection includes saved fields and safe source presentation", () => {
  const details = getPlaceDetailsDisplayData({
    ...basePlace,
    collections: [
      { id: 3, name: "Tokyo Trip" },
      { id: 3, name: "Tokyo Trip" },
    ],
  });

  assert.equal(details.detailHref, "/restaurants/12");
  assert.equal(details.editHref, "/restaurants/12/edit");
  assert.equal(details.category, "景点");
  assert.equal(details.subcategory, "Art Gallery");
  assert.equal(details.address, "浦东新区示例路 1 号");
  assert.equal(details.notes, "夜间更适合参观");
  assert.equal(details.sourceLabel, "example.com");
  assert.equal(details.sourceHref, basePlace.source_url);
  assert.deepEqual(details.collections, [{ id: 3, name: "Tokyo Trip" }]);
  assert.deepEqual(details.location, {
    status: "resolved",
    latitude: 31.23,
    longitude: 121.47,
    approximate: false,
    label: "精确位置",
    description: "使用已保存的精确坐标显示。",
  });
});

test("legacy 玩乐 values display as 娱乐 without changing saved data", () => {
  const details = getPlaceDetailsDisplayData({
    ...basePlace,
    category: "玩乐",
    address: null,
    cuisine: null,
    note: null,
    source_url: "invalid-source",
    latitude: null,
    longitude: null,
    city: "Unknown City",
  });

  assert.equal(details.category, "娱乐");
  assert.equal(details.subcategory, null);
  assert.equal(details.address, null);
  assert.equal(details.notes, null);
  assert.equal(details.sourceLabel, "原始来源");
  assert.equal(details.sourceHref, null);
  assert.deepEqual(details.location, {
    status: "unresolved",
    label: "暂时没有可显示的位置",
    description: "这条地点记录还没有可用的精确坐标或已知城市位置。",
  });
});

test("known city values retain the existing approximate location behavior", () => {
  const details = getPlaceDetailsDisplayData({
    ...basePlace,
    city: "Shanghai City",
    latitude: null,
    longitude: null,
  });

  assert.equal(details.location.status, "resolved");
  if (details.location.status === "resolved") {
    assert.equal(details.location.approximate, true);
    assert.equal(details.location.label, "近似位置");
  }
});

test("empty optional fields are omitted from the details projection", () => {
  const details = getPlaceDetailsDisplayData({
    ...basePlace,
    city: " ",
    address: "",
    cuisine: "  ",
    note: null,
  });

  assert.equal(details.city, null);
  assert.equal(details.address, null);
  assert.equal(details.subcategory, null);
  assert.equal(details.notes, null);
});
