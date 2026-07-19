import assert from "node:assert/strict";
import test from "node:test";
import {
  buildAIEnrichmentResultFromSnapshot,
  normalizeAIEnrichmentResult,
  placeholderAIEnrichmentProvider,
  runAIEnrichment,
  type AIEnrichmentResult,
} from "./ai-enrichment.ts";
import {
  applyAcceptedAIEnrichment,
  applyAutoAIEnrichment,
  getAutoAppliedAIFields,
} from "./ai-enrichment-merge.ts";
import type { MergedPlaceDraft } from "./place-draft-merge.ts";

function createDraft(): MergedPlaceDraft {
  return {
    name: "Google Place",
    category: null,
    cuisine: null,
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
      factualSuggestions: {
        address: "AI address",
        phone: "021-1234-5678",
        city: "上海",
        country: null,
        district: null,
      },
      understandingSuggestions: {
        category: "美食",
        cuisine: "面食",
        tags: ["招牌"],
        summary: "AI summary",
        placeType: "餐厅",
      },
      confidence: "medium",
      reasoningSummary: "Suggested from the supplied draft context.",
      proposedFields: [
        { field: "city", group: "factual", value: "上海", confidence: "medium" },
        { field: "address", group: "factual", value: "AI address", confidence: "low" },
        { field: "phone", group: "factual", value: "021-1234-5678", confidence: "medium" },
        { field: "category", group: "understanding", value: "美食", confidence: "medium" },
        { field: "cuisine", group: "understanding", value: "面食", confidence: "medium" },
        { field: "summary", group: "understanding", value: "AI summary", confidence: "low" },
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
  draft.category = "Manual Category";
  draft.fieldSources.category = "manual";

  const merged = applyAcceptedAIEnrichment(draft, createSuggestions(), ["category"]);

  assert.equal(merged.name, "Manual Place");
  assert.equal(merged.fieldSources.name, "manual");
  assert.equal(merged.category, "Manual Category");
  assert.equal(merged.fieldSources.category, "manual");
});

test("accepted suggestions update only selected fields and retain attribution", () => {
  const merged = applyAcceptedAIEnrichment(createDraft(), createSuggestions(), ["city", "cuisine"]);

  assert.equal(merged.city, "上海");
  assert.equal(merged.fieldSources.city, "ai_suggestion");
  assert.equal(merged.name, "Google Place");
  assert.equal(merged.address, "Google address");
  assert.equal(merged.fieldSources.address, "google_maps");
  assert.equal(merged.cuisine, "面食");
  assert.equal(merged.fieldSources.cuisine, "ai_suggestion");
});

test("validated AI suggestions auto-fill only empty fields", () => {
  const draft = createDraft();
  const result = createSuggestions();

  assert.deepEqual(getAutoAppliedAIFields(draft, result), ["city", "phone", "category", "cuisine"]);

  const merged = applyAutoAIEnrichment(draft, result);

  assert.equal(merged.city, "上海");
  assert.equal(merged.category, "美食");
  assert.equal(merged.cuisine, "面食");
  assert.equal(merged.phone, "021-1234-5678");
  assert.equal(merged.address, "Google address");
  assert.equal(merged.fieldSources.city, "ai_suggestion");
  assert.equal(merged.fieldSources.category, "ai_suggestion");
});

test("auto-fill leaves deterministic and low-confidence values unchanged", () => {
  const draft = createDraft();
  draft.city = "东京";
  draft.fieldSources.city = "website";
  draft.address = null;
  delete draft.fieldSources.address;
  const result = createSuggestions();

  assert.deepEqual(getAutoAppliedAIFields(draft, result), ["phone", "category", "cuisine"]);
  assert.equal(applyAutoAIEnrichment(draft, result).city, "东京");
  assert.equal(applyAutoAIEnrichment(draft, result).address, null);
});

test("rejected suggestions leave the draft unchanged", () => {
  const draft = createDraft();
  const merged = applyAcceptedAIEnrichment(draft, createSuggestions(), []);

  assert.deepEqual(merged, draft);
});

test("submitted grouped suggestions can be replayed after an acceptance action", () => {
  const result = buildAIEnrichmentResultFromSnapshot([
    { field: "city", group: "factual", value: "上海" },
    { field: "category", group: "understanding", value: "美食" },
    { field: "tags", group: "understanding", value: "招牌, 夜宵" },
  ], "high", "Supported by the submitted source evidence.");

  assert.equal(result.status, "suggestions_available");
  assert.equal(result.proposal?.factualSuggestions.city, "上海");
  assert.equal(result.proposal?.understandingSuggestions.category, "美食");
  assert.deepEqual(result.proposal?.understandingSuggestions.tags, ["招牌", "夜宵"]);
  assert.deepEqual(
    result.proposal?.proposedFields.map(({ field, group }) => ({ field, group })),
    [
      { field: "city", group: "factual" },
      { field: "category", group: "understanding" },
      { field: "tags", group: "understanding" },
    ],
  );
});

test("AI understanding suggestions normalize Art Gallery into a place category and subcategory", () => {
  const normalized = normalizeAIEnrichmentResult({
    status: "suggestions_available",
    message: "Suggestions are ready for review.",
    proposal: {
      factualSuggestions: { address: null, phone: null, city: null, country: null, district: null },
      understandingSuggestions: {
        category: "Art Gallery",
        cuisine: null,
        tags: ["art"],
        summary: "An immersive art experience.",
        placeType: "Attraction",
      },
      confidence: "medium",
      reasoningSummary: "Based on the place description.",
      proposedFields: [
        { field: "category", group: "understanding", value: "景点", confidence: "medium" },
        { field: "tags", group: "understanding", value: "art", confidence: "medium" },
        { field: "summary", group: "understanding", value: "An immersive art experience.", confidence: "medium" },
        { field: "placeType", group: "understanding", value: "Attraction", confidence: "medium" },
      ],
    },
  });

  assert.equal(normalized.proposal?.understandingSuggestions.category, "景点");
  assert.equal(normalized.proposal?.understandingSuggestions.cuisine, "美术馆");
  assert.deepEqual(
    normalized.proposal?.proposedFields
      .filter(({ field }) => field === "category" || field === "cuisine")
      .map(({ field, value }) => ({ field, value })),
    [
      { field: "category", value: "景点" },
      { field: "cuisine", value: "美术馆" },
    ],
  );
});

test("accepted normalized AI values populate the editable draft and notes", () => {
  const result = normalizeAIEnrichmentResult({
    status: "suggestions_available",
    message: "Suggestions are ready for review.",
    proposal: {
      factualSuggestions: { address: null, phone: null, city: null, country: null, district: null },
      understandingSuggestions: {
        category: "Art Gallery",
        cuisine: null,
        tags: [],
        summary: "An international art collective.",
        placeType: "Attraction",
      },
      confidence: "medium",
      reasoningSummary: "Based on the place description.",
      proposedFields: [
        { field: "category", group: "understanding", value: "Art Gallery", confidence: "medium" },
        { field: "summary", group: "understanding", value: "An international art collective.", confidence: "medium" },
      ],
    },
  });
  const merged = applyAcceptedAIEnrichment(createDraft(), result, ["category", "cuisine", "summary"]);

  assert.equal(merged.category, "景点");
  assert.equal(merged.cuisine, "美术馆");
  assert.equal(merged.notes, "An international art collective.");
  assert.equal(merged.fieldSources.category, "ai_suggestion");
  assert.equal(merged.fieldSources.cuisine, "ai_suggestion");
  assert.equal(merged.fieldSources.notes, "ai_suggestion");
});

test("preview-only tags and place type cannot be accepted into the draft", () => {
  const merged = applyAcceptedAIEnrichment(createDraft(), createSuggestions(), ["tags", "placeType"]);

  assert.equal(merged.notes, null);
  assert.equal(merged.fieldSources.notes, undefined);
  assert.equal(merged.category, null);
});
