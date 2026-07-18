import assert from "node:assert/strict";
import test from "node:test";
import {
  appendAIReviewDraftState,
  getAIReviewDraftState,
  parseAIReviewDraftState,
} from "./ai-review-state.ts";
import type { AIEnrichmentResult } from "./ai-enrichment.ts";

const result: AIEnrichmentResult = {
  status: "suggestions_available",
  message: "AI improvement available.",
  proposal: {
    factualSuggestions: { address: "静安区", phone: null, city: "上海", country: null },
    understandingSuggestions: {
      category: "美食",
      cuisine: "咖啡",
      tags: ["早午餐"],
      summary: "适合早餐",
      placeType: "咖啡馆",
    },
    confidence: "medium",
    reasoningSummary: "Supported by the submitted evidence.",
    proposedFields: [
      { field: "address", group: "factual", value: "静安区", confidence: "medium" },
      { field: "city", group: "factual", value: "上海", confidence: "medium" },
      { field: "category", group: "understanding", value: "美食", confidence: "medium" },
    ],
  },
};

test("AI suggestions can be stored in and restored from review draft state", () => {
  const state = getAIReviewDraftState(result, ["city"], ["understanding"]);
  assert.ok(state);

  const query = appendAIReviewDraftState(
    new URLSearchParams(
      "source_url=https%3A%2F%2Fexample.com%2Fplace&manual_evidence=Place%0AShanghai&category=%E6%99%AF%E7%82%B9&cuisine=Art+Gallery&note=Summary",
    ),
    state,
  );
  const restored = parseAIReviewDraftState({
    ai_snapshot: query.getAll("ai_snapshot"),
    ai_snapshot_confidence: query.get("ai_snapshot_confidence") ?? undefined,
    ai_snapshot_reason: query.get("ai_snapshot_reason") ?? undefined,
    ai_accepted: query.getAll("ai_accepted"),
    ai_reject_factual: query.get("ai_reject_factual") ?? undefined,
    ai_reject_understanding: query.get("ai_reject_understanding") ?? undefined,
  });

  assert.deepEqual(restored, state);
  assert.equal(query.get("source_url"), "https://example.com/place");
  assert.equal(query.get("manual_evidence"), "Place\nShanghai");
  assert.equal(query.get("category"), "景点");
  assert.equal(query.get("cuisine"), "Art Gallery");
  assert.equal(query.get("note"), "Summary");
});

test("accepted fields are deduplicated and preview-only fields stay unaccepted", () => {
  const state = getAIReviewDraftState(result, ["city", "city", "tags", "placeType"]);

  assert.deepEqual(state?.acceptedFields, ["city"]);
});

test("restores group-specific accepted fields from the review URL", () => {
  const state = parseAIReviewDraftState({
    ai_snapshot: [
      JSON.stringify({ field: "category", group: "understanding", value: "景点" }),
      JSON.stringify({ field: "cuisine", group: "understanding", value: "Art Gallery" }),
      JSON.stringify({ field: "tags", group: "understanding", value: "art" }),
    ],
    ai_accept_understanding: ["category", "cuisine", "tags"],
  });

  assert.deepEqual(state?.acceptedFields, ["category", "cuisine"]);
});

test("invalid stored AI fields are ignored without affecting the draft state", () => {
  const state = parseAIReviewDraftState({
    ai_snapshot: [
      JSON.stringify({ field: "address", group: "factual", value: "上海" }),
      JSON.stringify({ field: "notes", group: "understanding", value: "不支持" }),
      "not-json",
    ],
    ai_snapshot_confidence: "high",
  });

  assert.deepEqual(state?.snapshot, [
    { field: "address", group: "factual", value: "上海" },
  ]);
  assert.equal(state?.confidence, "high");
});
