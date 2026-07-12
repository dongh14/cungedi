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
      category: "美食",
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
    { key: "name", label: "地点名称", required: true },
    { key: "city", label: "城市", required: true },
    { key: "address", label: "地址", required: false },
    { key: "cuisine", label: "类型细分", required: false },
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

test("defaults extracted accommodation candidates to 住宿 unless the user already chose another category", () => {
  const result: RestaurantExtractionResult = {
    status: "success",
    sourceUrl: "https://example.com/hotel",
    sourceKind: "public-web",
    supportLevel: "official",
    pageType: "single_restaurant",
    fetchedUrl: "https://example.com/hotel",
    httpStatus: 200,
    contentType: "text/html",
    notes: ["lodging structured data accepted"],
    acceptanceReasons: ["single accommodation signals are strong enough"],
    candidate: {
      sourceUrl: "https://example.com/hotel",
      category: "住宿",
      fields: {
        name: {
          value: "Lakeview Hotel",
          confidence: "high",
          evidenceSource: "structured_data",
          accepted: true,
        },
        city: {
          value: "杭州",
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
          value: "酒店",
          confidence: "medium",
          evidenceSource: "structured_data",
          accepted: true,
        },
      },
    },
  };

  const defaultValues = getInitialDraftFormValues(result, {});
  const overriddenValues = getInitialDraftFormValues(result, {
    category: "美食",
  });

  assert.equal(defaultValues.category, "住宿");
  assert.equal(defaultValues.cuisine, "酒店");
  assert.equal(overriddenValues.category, "美食");
});

test("defaults extracted attraction candidates to 景点 unless the user already chose another category", () => {
  const result: RestaurantExtractionResult = {
    status: "success",
    sourceUrl: "https://example.com/museum",
    sourceKind: "public-web",
    supportLevel: "official",
    pageType: "single_restaurant",
    fetchedUrl: "https://example.com/museum",
    httpStatus: 200,
    contentType: "text/html",
    notes: ["attraction structured data accepted"],
    acceptanceReasons: ["single attraction signals are strong enough"],
    candidate: {
      sourceUrl: "https://example.com/museum",
      category: "景点",
      fields: {
        name: {
          value: "West Bund Museum",
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
          value: "博物馆",
          confidence: "high",
          evidenceSource: "structured_data",
          accepted: true,
        },
      },
    },
  };

  const defaultValues = getInitialDraftFormValues(result, {});
  const overriddenValues = getInitialDraftFormValues(result, {
    category: "美食",
  });

  assert.equal(defaultValues.category, "景点");
  assert.equal(defaultValues.cuisine, "博物馆");
  assert.equal(overriddenValues.category, "美食");
});

test("defaults extracted shopping candidates to 购物 unless the user already chose another category", () => {
  const result: RestaurantExtractionResult = {
    status: "success",
    sourceUrl: "https://example.com/bookstore",
    sourceKind: "public-web",
    supportLevel: "official",
    pageType: "single_restaurant",
    fetchedUrl: "https://example.com/bookstore",
    httpStatus: 200,
    contentType: "text/html",
    notes: ["shopping structured data accepted"],
    acceptanceReasons: ["single shopping signals are strong enough"],
    candidate: {
      sourceUrl: "https://example.com/bookstore",
      category: "购物",
      fields: {
        name: {
          value: "Page One",
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
          value: "书店",
          confidence: "high",
          evidenceSource: "structured_data",
          accepted: true,
        },
      },
    },
  };

  const defaultValues = getInitialDraftFormValues(result, {});
  const overriddenValues = getInitialDraftFormValues(result, {
    category: "住宿",
  });

  assert.equal(defaultValues.category, "购物");
  assert.equal(defaultValues.cuisine, "书店");
  assert.equal(overriddenValues.category, "住宿");
});

test("defaults extracted entertainment candidates to 玩乐 unless the user already chose another category", () => {
  const result: RestaurantExtractionResult = {
    status: "success",
    sourceUrl: "https://example.com/cinema",
    sourceKind: "public-web",
    supportLevel: "official",
    pageType: "single_restaurant",
    fetchedUrl: "https://example.com/cinema",
    httpStatus: 200,
    contentType: "text/html",
    notes: ["entertainment structured data accepted"],
    acceptanceReasons: ["single entertainment signals are strong enough"],
    candidate: {
      sourceUrl: "https://example.com/cinema",
      category: "玩乐",
      fields: {
        name: {
          value: "Skyline Cinema",
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
          value: "电影院",
          confidence: "high",
          evidenceSource: "structured_data",
          accepted: true,
        },
      },
    },
  };

  const defaultValues = getInitialDraftFormValues(result, {});
  const overriddenValues = getInitialDraftFormValues(result, {
    category: "景点",
  });

  assert.equal(defaultValues.category, "玩乐");
  assert.equal(defaultValues.cuisine, "电影院");
  assert.equal(overriddenValues.category, "景点");
});

test("defaults extracted generic place candidates to 其他 unless the user already chose another category", () => {
  const result: RestaurantExtractionResult = {
    status: "success",
    sourceUrl: "https://example.com/service-center",
    sourceKind: "public-web",
    supportLevel: "official",
    pageType: "single_restaurant",
    fetchedUrl: "https://example.com/service-center",
    httpStatus: 200,
    contentType: "text/html",
    notes: ["generic place structured data accepted"],
    acceptanceReasons: ["single generic place signals are strong enough"],
    candidate: {
      sourceUrl: "https://example.com/service-center",
      category: "其他",
      fields: {
        name: {
          value: "Harbor Service Center",
          confidence: "high",
          evidenceSource: "structured_data",
          accepted: true,
        },
        city: {
          value: "厦门",
          confidence: "high",
          evidenceSource: "structured_data",
          accepted: true,
        },
        address: {
          value: "海港路 10 号, 厦门",
          confidence: "high",
          evidenceSource: "structured_data",
          accepted: true,
        },
        cuisine: {
          value: null,
          confidence: "none",
          evidenceSource: null,
          accepted: false,
          rejectionReason: "empty",
        },
      },
    },
  };

  const defaultValues = getInitialDraftFormValues(result, {});
  const overriddenValues = getInitialDraftFormValues(result, {
    category: "景点",
  });

  assert.equal(defaultValues.category, "其他");
  assert.equal(defaultValues.cuisine, "");
  assert.equal(overriddenValues.category, "景点");
});
