import assert from "node:assert/strict";
import test from "node:test";
import type { AIEnrichmentRequest } from "./ai-enrichment.ts";
import {
  buildCompactAIContext,
  maxDeepSeekPromptCharacters,
} from "./ai-prompt.ts";
import type { MergedPlaceDraft } from "./place-draft-merge.ts";
import type { NormalizedExtractionResult } from "./extraction-architecture.ts";

function createDraft(): MergedPlaceDraft {
  return {
    name: "Blue Bottle Coffee",
    category: null,
    cuisine: null,
    city: null,
    address: null,
    latitude: null,
    longitude: null,
    description: null,
    notes: null,
    phone: null,
    websiteUrl: null,
    imageUrl: null,
    sourceUrl: "https://maps.google.com/?q=Blue+Bottle+Coffee",
    sourceUrls: ["https://maps.google.com/?q=Blue+Bottle+Coffee"],
    fieldSources: { name: "google_maps" },
  };
}

function createResult(
  overrides: Partial<NormalizedExtractionResult> = {},
): NormalizedExtractionResult {
  return {
    name: "Blue Bottle Coffee",
    description: "A short official description.",
    category: null,
    city: null,
    address: null,
    phone: null,
    latitude: null,
    longitude: null,
    websiteUrl: null,
    imageUrl: null,
    sourceUrl: "https://maps.google.com/?q=Blue+Bottle+Coffee",
    notes: null,
    confidence: "medium",
    extractionStatus: "partial",
    extractedFields: ["name", "description"],
    fieldOrigins: { name: "url", description: "metadata" },
    sourceType: "google_maps",
    message: "Partially extracted.",
    ...overrides,
  };
}

test("compact AI context includes only relevant fields and attribution", () => {
  const request: AIEnrichmentRequest = {
    mergedPlaceDraft: createDraft(),
    extractedSourceData: [createResult()],
    sourceUrls: ["https://maps.google.com/?q=Blue+Bottle+Coffee"],
    missingFields: ["city", "category", "address"],
  };

  const context = buildCompactAIContext(request);
  const parsed = JSON.parse(context) as {
    currentDraft: Record<string, unknown>;
    missingFields: string[];
    extractedSources: Array<{ fields: Record<string, { origin: string }> }>;
  };

  assert.ok(context.length <= maxDeepSeekPromptCharacters);
  assert.equal(parsed.currentDraft.name, "Blue Bottle Coffee");
  assert.deepEqual(parsed.missingFields, ["city", "category", "address"]);
  assert.equal(parsed.extractedSources[0].fields.name.origin, "url");
  assert.equal(parsed.extractedSources[0].fields.description.origin, "metadata");
  assert.ok(!context.includes("<html"));
});

test("compact AI context packages parsed source evidence and missing-field priorities", () => {
  const request: AIEnrichmentRequest = {
    mergedPlaceDraft: createDraft(),
    extractedSourceData: [createResult({
      sourceUrl: "https://example.com/alimentari",
      description: "Official restaurant description.",
      address: "88 Yongjia Road, Shanghai",
      phone: "+86 21 5555 6666",
      extractedFields: ["name", "description", "address", "phone"],
      fieldOrigins: {
        name: "structured",
        description: "metadata",
        address: "structured",
        phone: "structured",
      },
      evidence: {
        metadata: {
          title: "Alimentari",
          description: "Official restaurant description.",
          ogTitle: "Alimentari Shanghai",
          ogDescription: "A neighborhood restaurant.",
          ogImage: null,
        },
        structuredData: [{
          types: ["restaurant"],
          name: "Alimentari",
          description: "Official restaurant description.",
          category: "Restaurant",
          address: "88 Yongjia Road, Shanghai",
          phone: "+86 21 5555 6666",
          websiteUrl: "https://example.com/alimentari",
          imageUrl: null,
        }],
      },
    })],
    sourceUrls: ["https://example.com/alimentari"],
    missingFields: ["city", "category", "address", "phone", "notes"],
  };

  const parsed = JSON.parse(buildCompactAIContext(request)) as {
    evidencePolicy: string[];
    priorityMissingFields: string[];
    extractedSources: Array<{
      sourceUrl: string;
      extractedFields: string[];
      evidence: {
        metadata: Record<string, string>;
        structuredData: Array<{ address: string; phone: string }>;
        relevantSnippets: string[];
      };
    }>;
  };
  const source = parsed.extractedSources[0];

  assert.equal(source.sourceUrl, "https://example.com/alimentari");
  assert.deepEqual(source.extractedFields, ["name", "description", "address", "phone"]);
  assert.equal(source.evidence.metadata.ogTitle, "Alimentari Shanghai");
  assert.equal(source.evidence.structuredData[0].address, "88 Yongjia Road, Shanghai");
  assert.equal(source.evidence.structuredData[0].phone, "+86 21 5555 6666");
  assert.deepEqual(parsed.priorityMissingFields, ["category", "city", "address", "phone", "notes"]);
  assert.ok(parsed.evidencePolicy.some((rule) => /only the provided evidence/i.test(rule)));
  assert.ok(parsed.evidencePolicy.some((rule) => /leave fields empty/i.test(rule)));
  assert.ok(!buildCompactAIContext(request).includes("<html"));
});

test("compact AI context includes bounded manual page evidence without HTML", () => {
  const request: AIEnrichmentRequest = {
    mergedPlaceDraft: createDraft(),
    extractedSourceData: [createResult({
      sourceType: "website",
      sourceUrl: "https://blocked.example/place",
      evidence: {
        manualText: "City Art Gallery\nShanghai\nAddress: 88 Yongjia Road",
      },
      fieldOrigins: { name: "manual_evidence" },
    })],
    sourceUrls: ["https://blocked.example/place"],
    missingFields: ["city", "category", "address"],
  };

  const context = buildCompactAIContext(request);

  assert.match(context, /City Art Gallery/);
  assert.match(context, /Shanghai/);
  assert.ok(!context.includes("<html"));
  assert.ok(context.length <= maxDeepSeekPromptCharacters);
});

test("absent evidence remains empty instead of receiving invented values", () => {
  const request: AIEnrichmentRequest = {
    mergedPlaceDraft: createDraft(),
    extractedSourceData: [createResult()],
    sourceUrls: ["https://example.com/place"],
    missingFields: ["city", "category", "address", "phone", "notes"],
  };

  const parsed = JSON.parse(buildCompactAIContext(request)) as {
    extractedSources: Array<{
      fields: Record<string, unknown>;
      evidence: { metadata: Record<string, unknown>; structuredData: unknown[] };
    }>;
  };
  const source = parsed.extractedSources[0];

  assert.equal(source.fields.city, undefined);
  assert.equal(source.fields.category, undefined);
  assert.equal(source.fields.address, undefined);
  assert.deepEqual(source.evidence.metadata, {});
  assert.deepEqual(source.evidence.structuredData, []);
});

test("compact AI context stays bounded for large source snippets", () => {
  const largeText = "x".repeat(10000);
  const request: AIEnrichmentRequest = {
    mergedPlaceDraft: { ...createDraft(), notes: largeText },
    extractedSourceData: Array.from({ length: 8 }, (_, index) => createResult({
      sourceUrl: `https://example.com/${index}`,
      description: largeText,
      notes: largeText,
    })),
    sourceUrls: Array.from({ length: 8 }, (_, index) => `https://example.com/${index}`),
    missingFields: ["city", "category", "address"],
  };

  assert.ok(buildCompactAIContext(request).length <= maxDeepSeekPromptCharacters);
});
