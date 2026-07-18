import assert from "node:assert/strict";
import test from "node:test";
import {
  buildRestaurantDraftInput,
  getInitialDraftFormValues,
  getMissingDraftFields,
  getReviewCollectionIds,
} from "./review-form.ts";

test("builds a review draft from a source-only intake", () => {
  const values = getInitialDraftFormValues(
    {
      source_url: "https://example.com/restaurant",
    },
    "https://example.com/restaurant",
  );

  assert.deepEqual(values, {
    name: "",
    city: "",
    source_input: "https://example.com/restaurant",
    privacy: "private",
    category: "美食",
    address: "",
    cuisine: "",
    note: "",
  });
});

test("prefers manual review overrides", () => {
  const values = getInitialDraftFormValues(
    {
      source_url: "https://example.com/tokyo-trip",
      name: "Tokyo Station Hotel",
      city: "苏州",
      cuisine: "意大利菜",
      note: "晚餐候选",
      privacy: "public",
      category: "景点",
    },
    "https://example.com/tokyo-trip",
  );

  assert.equal(values.name, "Tokyo Station Hotel");
  assert.equal(values.city, "苏州");
  assert.equal(values.cuisine, "意大利菜");
  assert.equal(values.note, "晚餐候选");
  assert.equal(values.privacy, "private");
  assert.equal(values.category, "景点");
});

test("uses an extracted name as the review default while keeping manual compatibility", () => {
  const extractedValues = getInitialDraftFormValues(
    {
      source_url: "https://maps.google.com/?q=Restaurant",
    },
    "https://maps.google.com/?q=Restaurant",
    { name: "Restaurant" },
  );

  assert.equal(extractedValues.name, "Restaurant");

  const manualValues = getInitialDraftFormValues(
    {
      source_url: "https://maps.google.com/?q=Restaurant",
      name: "My Manual Name",
    },
    "https://maps.google.com/?q=Restaurant",
    { name: "Restaurant" },
  );

  assert.equal(manualValues.name, "My Manual Name");
});

test("uses merged source fields as editable review defaults", () => {
  const values = getInitialDraftFormValues(
    { source_url: "https://maps.google.com/?q=Restaurant" },
    "https://maps.google.com/?q=Restaurant",
    {
      name: "Restaurant",
      city: "上海",
      address: "上海市黄浦区示例路 8 号",
      category: "美食",
      notes: "官网介绍：适合午餐",
      description: null,
    },
  );

  assert.equal(values.name, "Restaurant");
  assert.equal(values.city, "上海");
  assert.equal(values.address, "上海市黄浦区示例路 8 号");
  assert.equal(values.category, "美食");
  assert.equal(values.note, "官网介绍：适合午餐");
});

test("reports missing required and optional review fields", () => {
  const missingFields = getMissingDraftFields({
    name: "",
    city: "上海",
    source_input: "https://example.com/place",
    privacy: "private",
    category: "美食",
    address: "",
    cuisine: "咖啡",
    note: "",
  });

  assert.deepEqual(missingFields, [
    {
      key: "name",
      label: "地点名称",
      required: true,
    },
    {
      key: "address",
      label: "地址",
      required: false,
    },
  ]);
});

test("manual review data converts into a saved-place input", () => {
  const draftInput = buildRestaurantDraftInput(
    {
      name: "Blue Bottle",
      city: "上海",
      source_input: "https://example.com/blue-bottle",
      privacy: "public",
      category: "美食",
      address: "静安区示例路 8 号",
      cuisine: "咖啡",
      note: "早上去",
    },
    "https://example.com/blue-bottle",
  );

  assert.deepEqual(draftInput, {
    name: "Blue Bottle",
    city: "上海",
    sourceUrl: "https://example.com/blue-bottle",
    privacy: "private",
    category: "美食",
    address: "静安区示例路 8 号",
    cuisine: "咖啡",
    note: "早上去",
    returnTo: "review",
    reviewSourceUrl: "https://example.com/blue-bottle",
  });
});

test("preserves selected review collection ids through query-shaped values", () => {
  assert.deepEqual(getReviewCollectionIds(["3,1", "3", "bad"]), [1, 3]);
  assert.deepEqual(getReviewCollectionIds(undefined), []);
});

test("review draft can save with missing optional fields", () => {
  const draftInput = buildRestaurantDraftInput(
    {
      name: "Known Place",
      city: "上海",
      source_input: "https://example.com/place",
      privacy: "private",
      category: "美食",
      address: "",
      cuisine: "",
      note: "",
    },
    "https://example.com/place",
  );

  assert.equal(draftInput.name, "Known Place");
  assert.equal(draftInput.city, "上海");
  assert.equal(draftInput.address, null);
  assert.equal(draftInput.cuisine, null);
  assert.equal(draftInput.note, null);
});

test("accepted AI values are the normal editable review defaults", () => {
  const values = getInitialDraftFormValues(
    {
      source_url: "https://www.teamlab.art/",
      category: "景点",
      cuisine: "Art Gallery",
      note: "An international art collective.",
    },
    "https://www.teamlab.art/",
  );

  assert.equal(values.category, "景点");
  assert.equal(values.cuisine, "Art Gallery");
  assert.equal(values.note, "An international art collective.");
});
