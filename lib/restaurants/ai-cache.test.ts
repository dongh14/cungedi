import assert from "node:assert/strict";
import test from "node:test";
import {
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
