import { createHash } from "node:crypto";
import type { NormalizedExtractionResult } from "./extraction-architecture.ts";

function hash(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

function getExtractionContent(results: NormalizedExtractionResult[]) {
  return results.map((result) => ({
    sourceType: result.sourceType,
    sourceUrl: result.sourceUrl,
    name: result.name,
    category: result.category,
    city: result.city,
    address: result.address,
    phone: result.phone,
    description: result.description,
    notes: result.notes,
    confidence: result.confidence,
    extractionStatus: result.extractionStatus,
    fieldOrigins: result.fieldOrigins,
    evidence: result.evidence,
  }));
}

export function hashAIExtractionContent(results: NormalizedExtractionResult[]) {
  return hash(JSON.stringify(getExtractionContent(results)));
}

export function buildAIEnrichmentCacheKey(
  sourceUrls: string[],
  results: NormalizedExtractionResult[],
) {
  const normalizedSourceUrls = Array.from(new Set(sourceUrls)).sort().join("|");

  return `ai-enrichment:v1:${hash(normalizedSourceUrls)}:${hashAIExtractionContent(results)}`;
}
