import assert from "node:assert/strict";
import test from "node:test";
import type { NormalizedExtractionResult } from "./extraction-architecture.ts";
import {
  evaluateAIEnrichmentEligibility,
} from "./ai-eligibility.ts";
import type { MergedPlaceDraft } from "./place-draft-merge.ts";

function createDraft(overrides: Partial<MergedPlaceDraft> = {}): MergedPlaceDraft {
  return {
    name: "Place",
    category: "Restaurant",
    cuisine: null,
    city: "Shanghai",
    address: "1 Example Road",
    latitude: null,
    longitude: null,
    description: null,
    notes: "Notes",
    phone: "123456",
    websiteUrl: null,
    imageUrl: null,
    sourceUrl: "https://example.com/place",
    sourceUrls: ["https://example.com/place"],
    fieldSources: {},
    ...overrides,
  };
}

function createResult(
  overrides: Partial<NormalizedExtractionResult> = {},
): NormalizedExtractionResult {
  return {
    name: "Place",
    description: null,
    category: "Restaurant",
    city: "Shanghai",
    address: "1 Example Road",
    phone: "123456",
    latitude: null,
    longitude: null,
    websiteUrl: "https://example.com/place",
    imageUrl: null,
    sourceUrl: "https://example.com/place",
    notes: null,
    confidence: "high",
    extractionStatus: "success",
    extractedFields: ["name", "category", "city", "address", "phone"],
    fieldOrigins: {},
    sourceType: "website",
    message: "Extracted successfully.",
    ...overrides,
  };
}

test("eligibility avoids unnecessary AI calls for complete high-confidence drafts", () => {
  const eligibility = evaluateAIEnrichmentEligibility({
    draft: createDraft(),
    extractedSourceData: [createResult()],
    missingFields: [],
  });

  assert.equal(eligibility.shouldRun, false);
  assert.deepEqual(eligibility.reasons, []);
});

test("eligibility allows AI when meaningful fields are missing", () => {
  const eligibility = evaluateAIEnrichmentEligibility({
    draft: createDraft({ city: null, category: null }),
    extractedSourceData: [createResult({ category: null, city: null })],
    missingFields: ["city", "category"],
  });

  assert.equal(eligibility.shouldRun, true);
  assert.deepEqual(eligibility.missingFields, ["city", "category"]);
  assert.ok(eligibility.reasons.includes("meaningful_fields_missing"));
});

test("eligibility allows AI for source conflicts and low confidence", () => {
  const eligibility = evaluateAIEnrichmentEligibility({
    draft: createDraft(),
    extractedSourceData: [
      createResult({ name: "Place A", confidence: "medium" }),
      createResult({ name: "Place B", confidence: "low" }),
    ],
    missingFields: [],
  });

  assert.equal(eligibility.shouldRun, true);
  assert.deepEqual(eligibility.conflictFields, ["name"]);
  assert.ok(eligibility.reasons.includes("source_conflict"));
  assert.ok(eligibility.reasons.includes("low_confidence"));
});
