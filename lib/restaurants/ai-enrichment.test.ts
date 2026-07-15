import assert from "node:assert/strict";
import test from "node:test";
import {
  placeholderAIEnrichmentProvider,
  runAIEnrichment,
  type AIEnrichmentResult,
} from "./ai-enrichment.ts";
import { applyAcceptedAIEnrichment } from "./ai-enrichment-merge.ts";
import type { MergedPlaceDraft } from "./place-draft-merge.ts";

function createDraft(): MergedPlaceDraft {
  return {
    name: "Google Place",
    category: null,
    city: null,
    address: "Google address",
    latitude: 31.23,
    longitude: 121.47,
    description: "Official description",
    notes: null,
    phone: null,
    websiteUrl: null,
    imageUrl: null,
    sourceUrl: "https://maps.google.com/?q=Google+Place",
    sourceUrls: ["https://maps.google.com/?q=Google+Place"],
    fieldSources: {
      name: "google_maps",
      address: "google_maps",
      latitude: "google_maps",
      longitude: "google_maps",
      description: "website",
    },
  };
}

function createSuggestions(): AIEnrichmentResult {
  return {
    status: "suggestions_available",
    message: "Suggestions are ready for review.",
    proposal: {
      normalizedName: "AI Place Name",
      city: "上海",
      category: "美食",
      address: "AI address",
      notesSummary: "AI summary",
      confidence: "medium",
      reasoningSummary: "Suggested from the supplied draft context.",
      proposedFields: [
        { field: "normalizedName", value: "AI Place Name", confidence: "medium" },
        { field: "city", value: "上海", confidence: "medium" },
        { field: "address", value: "AI address", confidence: "low" },
        { field: "notesSummary", value: "AI summary", confidence: "low" },
      ],
    },
  };
}

test("placeholder provider returns unavailable without a proposal", async () => {
  const result = await placeholderAIEnrichmentProvider.enrich({
    mergedPlaceDraft: createDraft(),
    extractedSourceData: [],
    sourceUrls: [],
    missingFields: ["city", "category"],
  });

  assert.equal(result.status, "unavailable");
  assert.equal(result.proposal, null);
  assert.match(result.message, /not configured/i);
});

test("AI suggestions do not overwrite the deterministic draft automatically", async () => {
  const draft = createDraft();
  const result = createSuggestions();
  const unchanged = await runAIEnrichment(
    {
      mergedPlaceDraft: draft,
      extractedSourceData: [],
      sourceUrls: draft.sourceUrls,
      missingFields: ["city", "category"],
    },
    { id: "test", enrich: async () => result },
  );

  assert.equal(unchanged.status, "suggestions_available");
  assert.equal(draft.name, "Google Place");
  assert.equal(draft.city, null);
  assert.equal(draft.fieldSources.name, "google_maps");
});

test("manual values take precedence over accepted AI suggestions", () => {
  const draft = createDraft();
  draft.name = "Manual Place";
  draft.fieldSources.name = "manual";

  const merged = applyAcceptedAIEnrichment(draft, createSuggestions(), ["normalizedName"]);

  assert.equal(merged.name, "Manual Place");
  assert.equal(merged.fieldSources.name, "manual");
});

test("accepted suggestions update only selected fields and retain attribution", () => {
  const merged = applyAcceptedAIEnrichment(createDraft(), createSuggestions(), ["city"]);

  assert.equal(merged.city, "上海");
  assert.equal(merged.fieldSources.city, "ai_suggestion");
  assert.equal(merged.name, "Google Place");
  assert.equal(merged.address, "Google address");
  assert.equal(merged.fieldSources.address, "google_maps");
});

test("rejected suggestions leave the draft unchanged", () => {
  const draft = createDraft();
  const merged = applyAcceptedAIEnrichment(draft, createSuggestions(), []);

  assert.deepEqual(merged, draft);
});
