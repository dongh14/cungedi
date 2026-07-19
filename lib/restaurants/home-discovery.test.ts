import assert from "node:assert/strict";
import test from "node:test";
import {
  getHomepageCategoryCounts,
  getHomepageCategoryHref,
  getHomepageCollectionSummary,
  getHomepageMapHref,
  getHomepageRecentPlaces,
  homepageCategories,
  homepageMapHeight,
  homepageQuickLinks,
  homepageSections,
  homepageCategoryGrid,
  homepageEmptyPlacesDescription,
  homepageEmptyPlacesTitle,
  homepagePrimaryActionHref,
} from "./home-discovery.ts";

test("homepage primary action and empty-place state use the intended copy", () => {
  assert.equal(homepagePrimaryActionHref, "/restaurants/new");
  assert.equal(homepageEmptyPlacesTitle, "还没有收藏地点");
  assert.equal(homepageEmptyPlacesDescription, "添加第一个想去的地方吧。");
});

test("homepage recent places are newest first and limited", () => {
  const places = [
    { id: 1, created_at: "2026-07-01T00:00:00.000Z" },
    { id: 2, created_at: "2026-07-03T00:00:00.000Z" },
    { id: 3, created_at: "2026-07-02T00:00:00.000Z" },
  ];

  assert.deepEqual(
    getHomepageRecentPlaces(places, 2).map((place) => place.id),
    [2, 3],
  );
});

test("homepage category counts group legacy 玩乐 under 娱乐", () => {
  assert.deepEqual(
    getHomepageCategoryCounts([
      { category: "美食", created_at: "2026-07-01T00:00:00.000Z" },
      { category: "玩乐", created_at: "2026-07-02T00:00:00.000Z" },
      { category: "娱乐", created_at: "2026-07-03T00:00:00.000Z" },
      { category: "景点", created_at: "2026-07-04T00:00:00.000Z" },
    ]),
    {
      美食: 1,
      景点: 1,
      住宿: 0,
      购物: 0,
      娱乐: 2,
      其他: 0,
    },
  );
});

test("homepage shortcuts reuse the saved-list and map routes", () => {
  assert.equal(getHomepageCategoryHref("景点"), "/restaurants?category=%E6%99%AF%E7%82%B9");
  assert.equal(getHomepageMapHref(), "/map");
});

test("homepage keeps only map, categories, and quick navigation sections", () => {
  assert.deepEqual(homepageSections, ["map", "categories", "shortcuts"]);
  assert.equal(homepageMapHeight, 280);
  assert.deepEqual(
    homepageQuickLinks.map(({ href, label, description }) => ({ href, label, description })),
    [
      { href: "/restaurants", label: "地点", description: "查看全部保存地点" },
      { href: "/collections", label: "收藏", description: "查看收藏集" },
    ],
  );
});

test("homepage collection summaries link to the existing collection page", () => {
  assert.deepEqual(
    getHomepageCollectionSummary({ id: 8, name: "Tokyo Trip", place_count: 3 }),
    {
      href: "/collections#collection-8",
      name: "Tokyo Trip",
      placeCount: 3,
    },
  );
});

test("homepage category shortcuts use generalized labels only", () => {
  assert.deepEqual(homepageCategories, ["美食", "景点", "住宿", "购物", "娱乐", "其他"]);
  assert.equal(homepageCategories.includes("餐厅" as never), false);
});

test("homepage category shortcuts use a two-row touch-friendly grid and direct routes", () => {
  assert.deepEqual(homepageCategoryGrid, {
    columns: 3,
    rows: 2,
    minHeight: 76,
    touchTarget: 44,
    labelFontSize: 17,
  });
  assert.deepEqual(
    homepageCategories.map(getHomepageCategoryHref),
    homepageCategories.map((category) => `/restaurants?category=${encodeURIComponent(category)}`),
  );
});
