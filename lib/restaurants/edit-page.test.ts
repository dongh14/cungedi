import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const root = process.cwd();
const read = (path: string) => readFileSync(`${root}/${path}`, "utf8");

test("edit page uses the compact mobile form and removes the old developer-stage copy", () => {
  const form = read("components/restaurant-edit-form-card.tsx");
  const page = read("app/restaurants/[id]/edit/page.tsx");

  assert.doesNotMatch(form, /STEP 9 编辑记录|编辑已保存的地点信息|自动识别|需要时修正/u);
  assert.match(page, /title="编辑地点"/u);
  for (const field of ["name", "city", "district", "country", "address", "latitude", "longitude", "note"]) {
    assert.match(form, new RegExp(`name=\"${field}\"`, "u"), field);
  }
  assert.match(form, /CompactCategoryRow/u);
  assert.doesNotMatch(form, /CuisineField/u);
  assert.match(form, /name="cuisine"/u);
  assert.match(form, /MapLibreFoundation/u);
  assert.match(form, /保存更改/u);
  assert.match(form, /sourceHost/u);
});

test("edit page keeps deletion behind an explicit confirmation", () => {
  const button = read("components/delete-restaurant-button.tsx");

  assert.match(button, /删除这个地点？/u);
  assert.match(button, /deleteRestaurantAction/u);
  assert.match(button, /取消/u);
});

test("edit updates return to the read-only place details route", () => {
  const actions = read("app/restaurants/actions.ts");

  assert.match(actions, /buildRedirect\(`\/restaurants\/\$\{restaurant\.id\}`/u);
  assert.match(actions, /\.delete\(\)/u);
});
