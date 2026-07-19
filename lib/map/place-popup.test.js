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
      location: "上海",
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
      location: "上海",
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
  assert.equal(getMapPlaceLocationLabel({ approximate: true }), "大概位置");
  assert.equal(getMapPlaceLocationLabel({ approximate: true, precision: "district" }), "区域位置");
});

test("popup displays legacy 玩乐 as 娱乐", () => {
  assert.equal(
    createMapPlacePopupViewModel({
      id: 13,
      name: "旧娱乐地点",
      city: "上海",
      category: "玩乐",
      address: null,
      latitude: 31.23,
      longitude: 121.47,
      precision: "exact",
      approximate: false,
    }).category,
    "娱乐",
  );
});

test("popup displays legacy English subcategories in Chinese", () => {
  assert.equal(
    createMapPlacePopupViewModel({
      id: 14,
      name: "Bar Example",
      city: "上海",
      category: "美食",
      cuisine: "cocktail bar",
      address: null,
      latitude: 31.23,
      longitude: 121.47,
      precision: "exact",
      approximate: false,
    }).category,
    "美食 · 酒吧",
  );
});

test("navigation target points to the read-only place details route", () => {
  assert.equal(getMapPlaceDetailHref(42), "/restaurants/42");
});
