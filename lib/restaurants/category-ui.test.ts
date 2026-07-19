import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const root = process.cwd();
const read = (path: string) => readFileSync(`${root}/${path}`, "utf8");

test("forms use a compact category row and a dedicated selector route", () => {
  const form = read("components/restaurant-form-fields.tsx");
  const editForm = read("components/restaurant-edit-form-card.tsx");
  const row = read("components/compact-category-row.tsx");
  const selector = read("components/category-selector.tsx");

  assert.match(form, /CompactCategoryRow/u);
  assert.match(editForm, /CompactCategoryRow/u);
  assert.doesNotMatch(form, /CategoryField|CuisineField/u);
  assert.doesNotMatch(editForm, /CategoryField|CuisineField/u);
  assert.match(row, /min-height: 52px|compact-category-row/u);
  assert.match(row, /restaurants\/category/u);
  assert.match(selector, /选择分类/u);
  assert.match(selector, /getSubtypeFieldConfig|cuisineSuggestions/u);
});

test("save buttons use form-owned pending state and safe recoverable errors", () => {
  const saveButton = read("components/review-save-button.tsx");
  const action = read("app/restaurants/actions.ts");

  assert.match(saveButton, /useFormStatus/u);
  assert.doesNotMatch(saveButton, /useState/u);
  assert.match(action, /保存失败，请重试/u);
});
