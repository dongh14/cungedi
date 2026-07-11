import assert from "node:assert/strict";
import test from "node:test";
import {
  categoryOptions,
  defaultRestaurantCategory,
  getSubtypeFieldConfig,
  isRestaurantCategory,
  isSubtypeSuggestionCompatible,
} from "./constants";

test("accepts all allowed restaurant categories", () => {
  assert.equal(defaultRestaurantCategory, "美食");

  for (const option of categoryOptions) {
    assert.equal(isRestaurantCategory(option.value), true);
  }
});

test("rejects invalid restaurant categories", () => {
  assert.equal(isRestaurantCategory("餐厅"), false);
  assert.equal(isRestaurantCategory(""), false);
  assert.equal(isRestaurantCategory("museum"), false);
});

test("returns the correct subtype field labels and suggestions for each category", () => {
  assert.equal(getSubtypeFieldConfig("美食").label, "菜系或类型");
  assert.equal(getSubtypeFieldConfig("购物").label, "购物类型");
  assert.equal(getSubtypeFieldConfig("玩乐").label, "玩乐类型");
  assert.equal(getSubtypeFieldConfig("景点").label, "景点类型");
  assert.equal(getSubtypeFieldConfig("住宿").label, "住宿类型");
  assert.equal(getSubtypeFieldConfig("其他").label, "类型");

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
});
