import assert from "node:assert/strict";
import test from "node:test";
import {
  buildAIEnrichmentCacheDescriptor,
  buildAIEnrichmentCacheKey,
  hashAIExtractionContent,
} from "./ai-cache.ts";
import type { NormalizedExtractionResult } from "./extraction-architecture.ts";

function createResult(name: string): NormalizedExtractionResult {
  return {
    name,
    description: null,
    category: null,
    city: null,
    address: null,
    phone: null,
    latitude: null,
    longitude: null,
    websiteUrl: null,
    imageUrl: null,
    sourceUrl: "https://example.com/place",
    notes: null,
    confidence: "medium",
    extractionStatus: "partial",
    extractedFields: ["name"],
    fieldOrigins: { name: "metadata" },
    sourceType: "website",
    message: "Partially extracted.",
  };
}

test("AI cache key changes with source URL or extraction content", () => {
  const first = [createResult("Place A")];
  const firstKey = buildAIEnrichmentCacheKey(["https://example.com/a"], first);

  assert.notEqual(
    firstKey,
    buildAIEnrichmentCacheKey(["https://example.com/b"], first),
  );
  assert.notEqual(
    hashAIExtractionContent(first),
    hashAIExtractionContent([createResult("Place B")]),
  );
});

test("AI cache preparation changes when compact manual evidence changes", () => {
  const first = createResult("Place A");
  const withEvidence = {
    ...first,
    evidence: { manualText: "Place A, Shanghai" },
  };
  const withDifferentEvidence = {
    ...first,
    evidence: { manualText: "Place A, Tokyo" },
  };

  assert.notEqual(
    hashAIExtractionContent([withEvidence]),
    hashAIExtractionContent([withDifferentEvidence]),
  );
});

test("cache keys are stable across whitespace and source ordering", () => {
  const first = createResult("Place A");
  const second = {
    ...createResult("Place A"),
    sourceUrl: "https://example.com/other",
    evidence: { manualText: "Place A\nShanghai" },
  };
  const sameEvidence = {
    ...second,
    evidence: { manualText: "  Place A\r\n Shanghai  " },
  };
  const input = {
    provider: "DeepSeek",
    model: "deepseek-v4-flash",
    promptVersion: "place-enrichment-v2",
    sourceType: "website",
    sourceUrl: "https://example.com/place",
    evidenceHash: hashAIExtractionContent([second]),
    missingFields: ["notes", "category"],
    thinkingMode: false,
  };

  assert.equal(
    hashAIExtractionContent([second]),
    hashAIExtractionContent([sameEvidence]),
  );
  assert.equal(
    buildAIEnrichmentCacheKey({ ...input, evidenceHash: hashAIExtractionContent([second]) }),
    buildAIEnrichmentCacheKey({ ...input, evidenceHash: hashAIExtractionContent([sameEvidence]) }),
  );
  assert.equal(
    buildAIEnrichmentCacheDescriptor({ ...input, missingFields: ["category", "notes"] }).cacheKey,
    buildAIEnrichmentCacheDescriptor({ ...input, missingFields: ["notes", "category"] }).cacheKey,
  );
});

test("model, prompt version, and missing fields change the cache key", () => {
  const input = {
    provider: "deepseek",
    model: "deepseek-v4-flash",
    promptVersion: "place-enrichment-v2",
    sourceType: "website",
    sourceUrl: "https://example.com/place",
    evidenceHash: "evidence",
    missingFields: ["category"],
    thinkingMode: false,
  };
  const base = buildAIEnrichmentCacheKey(input);

  assert.notEqual(base, buildAIEnrichmentCacheKey({ ...input, model: "deepseek-v4-reasoner" }));
  assert.notEqual(base, buildAIEnrichmentCacheKey({ ...input, promptVersion: "place-enrichment-v3" }));
  assert.notEqual(base, buildAIEnrichmentCacheKey({ ...input, missingFields: ["category", "notes"] }));
});
