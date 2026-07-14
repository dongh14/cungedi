import assert from "node:assert/strict";
import test from "node:test";
import {
  buildRestaurantDraftInput,
  getInitialDraftFormValues,
  getMissingDraftFields,
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
  assert.equal(values.privacy, "public");
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
    privacy: "public",
    category: "美食",
    address: "静安区示例路 8 号",
    cuisine: "咖啡",
    note: "早上去",
    returnTo: "review",
    reviewSourceUrl: "https://example.com/blue-bottle",
  });
});
