import { createHash } from "node:crypto";
import type { NormalizedExtractionResult } from "./extraction-architecture.ts";

export const defaultAIEnrichmentModel = "deepseek-v4-flash";
export const defaultAIEnrichmentPromptVersion = "place-enrichment-v2";
export const defaultAIEnrichmentThinkingMode = false;
export const defaultAIEnrichmentCacheTtlMs = 30 * 24 * 60 * 60 * 1000;

export type AIEnrichmentCacheKeyInput = {
  provider: string;
  model: string;
  promptVersion: string;
  sourceType: string;
  sourceUrl: string;
  evidenceHash: string;
  missingFields: string[];
  thinkingMode: boolean;
};

export type AIEnrichmentCacheDescriptor = AIEnrichmentCacheKeyInput & {
  cacheKey: string;
};

export type AIEnrichmentCacheEntry = {
  responseJson: unknown;
  expiresAt: string;
};

export type AIEnrichmentCacheStore = {
  get: (cacheKey: string) => Promise<AIEnrichmentCacheEntry | null>;
  set: (input: {
    descriptor: AIEnrichmentCacheDescriptor;
    userId: string;
    responseJson: unknown;
    expiresAt: string;
  }) => Promise<void>;
  delete?: (cacheKey: string) => Promise<void>;
};

function normalizeText(value: string) {
  return value
    .replace(/\r\n?/gu, "\n")
    .split("\n")
    .map((line) => line.replace(/[ \t]+/gu, " ").trim())
    .filter(Boolean)
    .join("\n");
}

function normalizeForHash(value: unknown): unknown {
  if (typeof value === "string") {
    return normalizeText(value);
  }

  if (Array.isArray(value)) {
    return value
      .map(normalizeForHash)
      .sort((left, right) => JSON.stringify(left).localeCompare(JSON.stringify(right)));
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, nestedValue]) => [key, normalizeForHash(nestedValue)]),
    );
  }

  return value;
}

function stableSerialize(value: unknown) {
  return JSON.stringify(normalizeForHash(value));
}

function hash(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

function getExtractionContent(results: NormalizedExtractionResult[]) {
  return results
    .map((result) => ({
      sourceType: result.sourceType,
      sourceUrl: result.sourceUrl,
      name: result.name,
      category: result.category,
      city: result.city,
      country: result.country,
      address: result.address,
      phone: result.phone,
      description: result.description,
      notes: result.notes,
      confidence: result.confidence,
      extractionStatus: result.extractionStatus,
      extractedFields: result.extractedFields,
      fieldOrigins: result.fieldOrigins,
      evidence: result.evidence,
    }))
    .sort((left, right) =>
      `${left.sourceType}:${left.sourceUrl}`.localeCompare(`${right.sourceType}:${right.sourceUrl}`),
    );
}

export function hashAIExtractionContent(results: NormalizedExtractionResult[]) {
  return hash(stableSerialize(getExtractionContent(results)));
}

export function buildAIEnrichmentCacheDescriptor(input: AIEnrichmentCacheKeyInput) {
  const normalizedInput: AIEnrichmentCacheKeyInput = {
    provider: input.provider.trim().toLowerCase(),
    model: input.model.trim(),
    promptVersion: input.promptVersion.trim(),
    sourceType: input.sourceType.trim().toLowerCase(),
    sourceUrl: normalizeText(input.sourceUrl),
    evidenceHash: input.evidenceHash.trim().toLowerCase(),
    missingFields: Array.from(new Set(input.missingFields.map((field) => field.trim()))).sort(),
    thinkingMode: Boolean(input.thinkingMode),
  };

  return {
    ...normalizedInput,
    cacheKey: `ai-enrichment:${hash(stableSerialize(normalizedInput))}`,
  };
}

export function buildAIEnrichmentCacheKey(
  input: AIEnrichmentCacheKeyInput,
): string;
export function buildAIEnrichmentCacheKey(
  sourceUrls: string[],
  results: NormalizedExtractionResult[],
  options?: Partial<Omit<AIEnrichmentCacheKeyInput, "sourceType" | "sourceUrl" | "evidenceHash">>,
): string;
export function buildAIEnrichmentCacheKey(
  inputOrSourceUrls: AIEnrichmentCacheKeyInput | string[],
  results: NormalizedExtractionResult[] = [],
  options: Partial<Omit<AIEnrichmentCacheKeyInput, "sourceType" | "sourceUrl" | "evidenceHash">> = {},
) {
  if (!Array.isArray(inputOrSourceUrls)) {
    return buildAIEnrichmentCacheDescriptor(inputOrSourceUrls).cacheKey;
  }

  const sourceUrls = Array.from(new Set(inputOrSourceUrls.map(normalizeText))).sort();
  const sourceTypes = Array.from(new Set(results.map((result) => result.sourceType))).sort();

  return buildAIEnrichmentCacheDescriptor({
    provider: options.provider ?? "deepseek",
    model: options.model ?? defaultAIEnrichmentModel,
    promptVersion: options.promptVersion ?? defaultAIEnrichmentPromptVersion,
    sourceType: sourceTypes.join(","),
    sourceUrl: sourceUrls.join("|"),
    evidenceHash: hashAIExtractionContent(results),
    missingFields: options.missingFields ?? [],
    thinkingMode: options.thinkingMode ?? defaultAIEnrichmentThinkingMode,
  }).cacheKey;
}
