import assert from "node:assert/strict";
import test from "node:test";
import type { RestaurantExtractionResult } from "./extraction-types";
import {
  getInitialDraftFormValues,
  getMissingCandidateFields,
} from "./review-form";

function createSuccessResult(): RestaurantExtractionResult {
  return {
    status: "success",
    sourceUrl: "https://example.com/restaurant",
    sourceKind: "public-web",
    supportLevel: "official",
    pageType: "single_restaurant",
    fetchedUrl: "https://example.com/restaurant",
    httpStatus: 200,
    contentType: "text/html",
    notes: ["structured data accepted"],
    acceptanceReasons: ["single restaurant signals are strong enough"],
    candidate: {
      sourceUrl: "https://example.com/restaurant",
      fields: {
        name: {
          value: "Alimentari Bistro",
          confidence: "high",
          evidenceSource: "structured_data",
          accepted: true,
        },
        city: {
          value: "上海",
          confidence: "high",
          evidenceSource: "structured_data",
          accepted: true,
        },
        address: {
          value: null,
          confidence: "none",
          evidenceSource: null,
          accepted: false,
          rejectionReason: "missing",
        },
        cuisine: {
          value: "Cafe",
          confidence: "medium",
          evidenceSource: "structured_data",
          accepted: true,
        },
      },
    },
  };
}

test("prefills review values from accepted extracted fields", () => {
  const result = createSuccessResult();
  const values = getInitialDraftFormValues(result, {});

  assert.deepEqual(values, {
    name: "Alimentari Bistro",
    city: "上海",
    source_input: "https://example.com/restaurant",
    privacy: "private",
    category: "美食",
    address: "",
    cuisine: "Cafe",
    note: "",
  });
});

test("prefers user-entered overrides after a review validation error", () => {
  const result = createSuccessResult();
  const values = getInitialDraftFormValues(result, {
    city: "苏州",
    cuisine: "意大利菜",
    note: "晚餐候选",
    privacy: "public",
    category: "景点",
  });

  assert.equal(values.city, "苏州");
  assert.equal(values.cuisine, "意大利菜");
  assert.equal(values.note, "晚餐候选");
  assert.equal(values.privacy, "public");
  assert.equal(values.category, "景点");
});

test("reports missing required and optional fields for partial candidates", () => {
  const result = createSuccessResult();
  const missingFields = getMissingCandidateFields(result);

  assert.deepEqual(missingFields, [
    {
      key: "address",
      label: "地址",
      required: false,
    },
  ]);
});

test("marks all editable restaurant fields as missing for fallback mode", () => {
  const fallbackResult: RestaurantExtractionResult = {
    status: "fallback",
    sourceUrl: "https://example.com/fallback",
    sourceKind: "public-web",
    supportLevel: "official",
    pageType: "generic_page",
    fetchedUrl: "https://example.com/fallback",
    httpStatus: 200,
    contentType: "text/html",
    reason: "signals too weak",
    notes: ["manual completion needed"],
  };

  assert.deepEqual(getMissingCandidateFields(fallbackResult), [
    { key: "name", label: "餐厅名称", required: true },
    { key: "city", label: "城市", required: true },
    { key: "address", label: "地址", required: false },
    { key: "cuisine", label: "菜系或类型", required: false },
  ]);
});

test("defaults fallback review category to 美食", () => {
  const fallbackResult: RestaurantExtractionResult = {
    status: "fallback",
    sourceUrl: "https://example.com/fallback",
    sourceKind: "public-web",
    supportLevel: "official",
    pageType: "generic_page",
    fetchedUrl: "https://example.com/fallback",
    httpStatus: 200,
    contentType: "text/html",
    reason: "signals too weak",
    notes: ["manual completion needed"],
  };

  const values = getInitialDraftFormValues(fallbackResult, {});

  assert.equal(values.category, "美食");
});
