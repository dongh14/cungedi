import assert from "node:assert/strict";
import test from "node:test";
import {
  canonicalPlaceCategories,
  categoryOptions,
  defaultRestaurantCategory,
  getSubtypeFieldConfig,
  normalizeAIPlaceUnderstanding,
  normalizePlaceCategory,
  getPlaceCategoryLabel,
  isRestaurantCategory,
  isSubtypeSuggestionCompatible,
} from "./constants.ts";

test("accepts general place categories and legacy restaurant values", () => {
  assert.equal(defaultRestaurantCategory, "美食");

  for (const option of categoryOptions) {
    assert.equal(isRestaurantCategory(option.value), true);
  }

  assert.equal(isRestaurantCategory("玩乐"), true);
  assert.equal(isRestaurantCategory("娱乐"), true);
});

test("canonical category order and legacy normalization are centralized", () => {
  assert.deepEqual(canonicalPlaceCategories, ["美食", "景点", "住宿", "购物", "娱乐", "其他"]);
  assert.deepEqual(categoryOptions.map((option) => option.value), [...canonicalPlaceCategories]);
  assert.equal(normalizePlaceCategory("玩乐"), "娱乐");
  assert.equal(getPlaceCategoryLabel("玩乐"), "娱乐");
  assert.equal(normalizePlaceCategory("not-a-category"), null);
});

test("rejects invalid restaurant categories", () => {
  assert.equal(isRestaurantCategory("餐厅"), false);
  assert.equal(isRestaurantCategory(""), false);
  assert.equal(isRestaurantCategory("museum"), false);
});

test("returns the correct subtype field labels and suggestions for each category", () => {
  assert.equal(getSubtypeFieldConfig("美食").label, "子分类");
  assert.equal(getSubtypeFieldConfig("购物").label, "子分类");
  assert.equal(getSubtypeFieldConfig("玩乐").label, "子分类");
  assert.equal(getSubtypeFieldConfig("娱乐").label, "子分类");
  assert.equal(getSubtypeFieldConfig("景点").label, "子分类");
  assert.equal(getSubtypeFieldConfig("住宿").label, "子分类");
  assert.equal(getSubtypeFieldConfig("其他").label, "子分类");

  assert.deepEqual(getSubtypeFieldConfig("美食").suggestions.slice(0, 4), [
    "川菜",
    "粤菜",
    "湘菜",
    "江浙菜",
  ]);
  assert.deepEqual(getSubtypeFieldConfig("购物").suggestions.slice(0, 4), [
    "商场",
    "买手店",
    "服装店",
    "超市",
  ]);
});

test("checks subtype compatibility against the selected category suggestions", () => {
  assert.equal(isSubtypeSuggestionCompatible("美食", "火锅"), true);
  assert.equal(isSubtypeSuggestionCompatible("购物", "书店"), true);
  assert.equal(isSubtypeSuggestionCompatible("景点", "火锅"), false);
  assert.equal(isSubtypeSuggestionCompatible("住宿", "民宿"), true);
  assert.equal(isSubtypeSuggestionCompatible("其他", "自定义"), false);
  assert.equal(isSubtypeSuggestionCompatible("其他", ""), true);
  assert.equal(getSubtypeFieldConfig("景点").suggestions.includes("Art Gallery"), true);
  assert.equal(getSubtypeFieldConfig("美食").suggestions.includes("Cafe"), true);
  assert.equal(getSubtypeFieldConfig("住宿").suggestions.includes("Hotel"), true);
});

test("normalizes general AI place understanding into category and subcategory", () => {
  assert.deepEqual(normalizeAIPlaceUnderstanding("Art Gallery", null, null), {
    category: "景点",
    cuisine: "Art Gallery",
  });
  assert.deepEqual(normalizeAIPlaceUnderstanding("Attraction", null, null), {
    category: "景点",
    cuisine: "Art Gallery",
  });
  assert.deepEqual(normalizeAIPlaceUnderstanding("Cafe", null, null), {
    category: "美食",
    cuisine: "Cafe",
  });
  assert.deepEqual(normalizeAIPlaceUnderstanding("Bakery", null, null), {
    category: "美食",
    cuisine: "Bakery",
  });
  assert.deepEqual(normalizeAIPlaceUnderstanding("Hotel", null, null), {
    category: "住宿",
    cuisine: "Hotel",
  });
  assert.deepEqual(normalizeAIPlaceUnderstanding("Store", null, null), {
    category: "购物",
    cuisine: "Store",
  });
  assert.deepEqual(normalizeAIPlaceUnderstanding("Cinema", null, null), {
    category: "娱乐",
    cuisine: "Cinema",
  });
  assert.deepEqual(normalizeAIPlaceUnderstanding("Unsupported type", null, null), {
    category: null,
    cuisine: null,
  });
});
