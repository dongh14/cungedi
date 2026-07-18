import assert from "node:assert/strict";
import test from "node:test";
import {
  createMapPlacePopupViewModel,
  getMapPlaceDetailHref,
  getMapPlaceLocationLabel,
} from "./place-popup.ts";

test("popup data contains the expected place preview fields", () => {
  assert.deepEqual(
    createMapPlacePopupViewModel({
      id: 12,
      name: "示例地点",
      city: "上海",
      category: "美食",
      address: "静安区南京西路 1 号",
      latitude: 31.23,
      longitude: 121.47,
      precision: "exact",
      approximate: false,
    }),
    {
      name: "示例地点",
      city: "上海",
      category: "美食",
      address: "静安区南京西路 1 号",
      locationLabel: "精确位置",
      locationDescription: "使用已保存的精确坐标显示。",
      detailHref: "/restaurants/12",
    },
  );
});

test("exact and approximate location labels remain correct", () => {
  assert.equal(getMapPlaceLocationLabel({ approximate: false }), "精确位置");
  assert.equal(getMapPlaceLocationLabel({ approximate: true }), "近似位置");
});

test("navigation target points to the read-only place details route", () => {
  assert.equal(getMapPlaceDetailHref(42), "/restaurants/42");
});
