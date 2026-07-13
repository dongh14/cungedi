import assert from "node:assert/strict";
import test from "node:test";
import { createPlaceMarkerData } from "./place-markers.ts";

test("exact stored coordinates create an exact marker", () => {
  const markers = createPlaceMarkerData([
    {
      id: 1,
      name: "示例餐厅",
      city: "上海市",
      category: "美食",
      address: "静安区示例路 1 号",
      latitude: 31.225,
      longitude: 121.48,
    },
  ]);

  assert.deepEqual(markers, [
    {
      id: 1,
      name: "示例餐厅",
      city: "上海市",
      category: "美食",
      address: "静安区示例路 1 号",
      latitude: 31.225,
      longitude: 121.48,
      precision: "exact",
      approximate: false,
    },
  ]);
});

test("a known city fallback creates an approximate marker", () => {
  const markers = createPlaceMarkerData([
    {
      id: 2,
      name: "城市级地点",
      city: "深圳市",
      category: "购物",
      address: null,
      latitude: null,
      longitude: null,
    },
  ]);

  assert.deepEqual(markers, [
    {
      id: 2,
      name: "城市级地点",
      city: "深圳市",
      category: "购物",
      address: null,
      latitude: 22.5431,
      longitude: 114.0579,
      precision: "city",
      approximate: true,
    },
  ]);
});

test("unresolved places are skipped instead of creating markers", () => {
  const markers = createPlaceMarkerData([
    {
      id: 3,
      name: "没有可用位置的地点",
      city: "不存在的城市",
      category: "其他",
      address: "未知地址",
      latitude: null,
      longitude: null,
    },
  ]);

  assert.deepEqual(markers, []);
});
