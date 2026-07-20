import assert from "node:assert/strict";
import test from "node:test";
import { appMenuNavigation, appNavigationUi } from "../../components/navigation.ts";
import { homepageCategories, homepageCategoryIcons } from "./home-discovery.ts";

test("top app menu keeps the navigation destinations without an add tab", () => {
  assert.deepEqual(appMenuNavigation.map((item) => item.shortLabel), ["首页", "地点", "待整理", "合集", "地图", "我的"]);
  assert.equal(appMenuNavigation.some((item) => item.href === "/restaurants/new"), false);
  assert.equal(appMenuNavigation.find((item) => item.shortLabel === "合集")?.href, "/collections");
  assert.equal(appMenuNavigation.find((item) => item.shortLabel === "我的")?.href, "/settings");
});

test("dashboard categories keep six shared icons for the discovery grid", () => {
  assert.deepEqual(homepageCategories.map((category) => homepageCategoryIcons[category]), [
    "food",
    "attraction",
    "lodging",
    "shopping",
    "entertainment",
    "other",
  ]);
});

test("top navigation preserves mobile touch and typography requirements", () => {
  assert.equal(appNavigationUi.minTouchTarget, 44);
  assert.equal(appNavigationUi.labelFontSize, 17);
  assert.equal(appNavigationUi.addHref, "/restaurants/new");
  assert.equal(appNavigationUi.menuHref, "/menu");
  assert.equal(appNavigationUi.menuRowMinHeight, 72);
  assert.equal(appNavigationUi.menuUsesOverlay, false);
});
