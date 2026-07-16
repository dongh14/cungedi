import assert from "node:assert/strict";
import test from "node:test";
import { mergePlaceDraftSources } from "./place-draft-merge.ts";
import type { NormalizedExtractionResult } from "./extraction-architecture.ts";

function makeResult(
  sourceType: "google_maps" | "website",
  values: Partial<NormalizedExtractionResult>,
): NormalizedExtractionResult {
  return {
    name: null,
    description: null,
    category: null,
    city: null,
    address: null,
    phone: null,
    latitude: null,
    longitude: null,
    websiteUrl: null,
    imageUrl: null,
    sourceUrl: `https://${sourceType}.example/place`,
    notes: null,
    confidence: "medium",
    extractionStatus: "partial",
    extractedFields: [],
    fieldOrigins: {},
    sourceType,
    message: "test result",
    ...values,
  };
}

test("merges Google Maps and Website results using field priority", () => {
  const google = makeResult("google_maps", {
    name: "Google Place Name",
    address: "Google address",
    latitude: 31.23,
    longitude: 121.47,
  });
  const website = makeResult("website", {
    name: "Structured Place Name",
    category: "Restaurant",
    address: "Structured address",
    description: "Official description",
    phone: "021-5555-6666",
    fieldOrigins: {
      name: "structured",
      category: "structured",
      address: "structured",
      phone: "structured",
      description: "metadata",
    },
  });

  const merged = mergePlaceDraftSources([google, website]);

  assert.equal(merged.name, "Structured Place Name");
  assert.equal(merged.address, "Structured address");
  assert.equal(merged.category, "Restaurant");
  assert.equal(merged.description, "Official description");
  assert.equal(merged.phone, "021-5555-6666");
  assert.equal(merged.latitude, 31.23);
  assert.equal(merged.longitude, 121.47);
  assert.deepEqual(merged.fieldSources, {
    name: "website",
    category: "website",
    address: "website",
    description: "website",
    phone: "website",
    latitude: "google_maps",
    longitude: "google_maps",
  });
});

test("explicit manual edits override automatic fields while Google coordinates remain primary", () => {
  const google = makeResult("google_maps", {
    name: "Google Place Name",
    address: "Google address",
    latitude: 31.23,
    longitude: 121.47,
  });
  const website = makeResult("website", {
    name: "Website Place Name",
    category: "Restaurant",
    description: "Official description",
    fieldOrigins: { name: "metadata", category: "structured" },
  });

  const merged = mergePlaceDraftSources([google, website], {
    name: "Manual Place Name",
    address: "Manual address",
    category: "美食",
    notes: "Manual note",
    latitude: 35.68,
    longitude: 139.76,
  });

  assert.equal(merged.name, "Manual Place Name");
  assert.equal(merged.address, "Manual address");
  assert.equal(merged.category, "美食");
  assert.equal(merged.description, "Manual note");
  assert.equal(merged.notes, "Manual note");
  assert.equal(merged.latitude, 31.23);
  assert.equal(merged.longitude, 121.47);
  assert.equal(merged.fieldSources.name, "manual");
  assert.equal(merged.fieldSources.address, "manual");
  assert.equal(merged.fieldSources.category, "manual");
  assert.equal(merged.fieldSources.description, "manual");
  assert.equal(merged.fieldSources.notes, "manual");
});

test("keeps missing fields empty and does not invent values", () => {
  const merged = mergePlaceDraftSources([
    makeResult("google_maps", { name: "Known Place" }),
    makeResult("website", { description: "Known description" }),
  ]);

  assert.equal(merged.name, "Known Place");
  assert.equal(merged.description, "Known description");
  assert.equal(merged.city, null);
  assert.equal(merged.address, null);
  assert.equal(merged.category, null);
  assert.equal(merged.latitude, null);
  assert.equal(merged.longitude, null);
  assert.equal(merged.fieldSources.city, undefined);
});

test("merges structured, Open Graph, and manual image values conservatively", () => {
  const structuredImage = makeResult("website", {
    imageUrl: "https://example.com/structured.jpg",
    fieldOrigins: { imageUrl: "structured" },
  });
  const openGraphImage = makeResult("website", {
    imageUrl: "https://example.com/og.jpg",
    fieldOrigins: { imageUrl: "metadata" },
  });

  const structuredMerged = mergePlaceDraftSources([openGraphImage, structuredImage]);
  assert.equal(structuredMerged.imageUrl, "https://example.com/structured.jpg");
  assert.equal(structuredMerged.fieldSources.imageUrl, "website");

  const manualMerged = mergePlaceDraftSources([structuredImage], {
    imageUrl: "https://example.com/manual.jpg",
  });
  assert.equal(manualMerged.imageUrl, "https://example.com/manual.jpg");
  assert.equal(manualMerged.fieldSources.imageUrl, "manual");
});

test("keeps a missing image empty", () => {
  const merged = mergePlaceDraftSources([makeResult("website", {})]);

  assert.equal(merged.imageUrl, null);
  assert.equal(merged.fieldSources.imageUrl, undefined);
});

test("explicit empty review fields remain manual instead of being repopulated", () => {
  const merged = mergePlaceDraftSources(
    [makeResult("website", { category: "景点", cuisine: "Art Gallery" })],
    { category: "娱乐", cuisine: "" },
  );

  assert.equal(merged.category, "娱乐");
  assert.equal(merged.cuisine, null);
  assert.equal(merged.fieldSources.category, "manual");
  assert.equal(merged.fieldSources.cuisine, "manual");
});
