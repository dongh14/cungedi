import assert from "node:assert/strict";
import test from "node:test";
import {
  detectSource,
  douyinExtractor,
  googleMapsExtractor,
  runExtractionPipeline,
  selectExtractor,
  websiteExtractor,
  xiaohongshuExtractor,
} from "./extraction-architecture.ts";

test("detects supported source domains", () => {
  assert.equal(detectSource("https://maps.google.com/?cid=123").sourceType, "google_maps");
  assert.equal(detectSource("https://maps.app.goo.gl/example").sourceType, "google_maps");
  assert.equal(
    detectSource("https://www.google.com/maps/place/example").sourceType,
    "google_maps",
  );
  assert.equal(detectSource("https://www.xiaohongshu.com/explore/abc").sourceType, "xiaohongshu");
  assert.equal(detectSource("https://v.douyin.com/abc").sourceType, "douyin");
  assert.equal(detectSource("https://www.instagram.com/p/abc").sourceType, "instagram");
  assert.equal(detectSource("https://www.tiktok.com/@example/video/1").sourceType, "tiktok");
});

test("treats ordinary valid URLs as websites and invalid URLs as unknown", () => {
  assert.equal(
    detectSource("https://restaurant.example.com/menu").sourceType,
    "website",
  );
  assert.equal(detectSource("not a URL").sourceType, "unknown");
  assert.equal(detectSource("ftp://example.com/place").sourceType, "unknown");
});

test("selects the Google Maps extractor and placeholders for future source types", () => {
  assert.equal(selectExtractor("google_maps"), googleMapsExtractor);
  assert.equal(selectExtractor("website"), websiteExtractor);
  assert.equal(selectExtractor("xiaohongshu"), xiaohongshuExtractor);
  assert.equal(selectExtractor("douyin"), douyinExtractor);
  assert.equal(selectExtractor("instagram"), null);
  assert.equal(selectExtractor("unknown"), null);
});

test("Google Maps extractor parses a search query and preserves the normalized result shape", () => {
  const sourceUrl = "https://maps.google.com/?q=Restaurant+Name";
  const result = googleMapsExtractor.extract(sourceUrl);

  assert.deepEqual(
    {
      sourceType: result.sourceType,
      sourceUrl: result.sourceUrl,
      extractionStatus: result.extractionStatus,
      extractedFields: result.extractedFields,
      confidence: result.confidence,
      name: result.name,
      category: result.category,
      city: result.city,
      address: result.address,
      latitude: result.latitude,
      longitude: result.longitude,
      imageUrl: result.imageUrl,
      notes: result.notes,
    },
    {
      sourceType: "google_maps",
      sourceUrl,
      extractionStatus: "partial",
      extractedFields: ["name"],
      confidence: "medium",
      name: "Restaurant Name",
      category: null,
      city: null,
      address: null,
      latitude: null,
      longitude: null,
      imageUrl: null,
      notes: null,
    },
  );
  assert.equal(result.sourceType, "google_maps");
});

test("Google Maps extractor handles URL encoding in search paths and query parameters", () => {
  assert.equal(
    googleMapsExtractor.extract("https://www.google.com/maps/search/Caf%C3%A9%2BMaison").name,
    "Café+Maison",
  );
  assert.equal(
    googleMapsExtractor.extract("https://www.google.com/maps/search/?api=1&query=Blue%20Bottle").name,
    "Blue Bottle",
  );
});

test("Google Maps extractor reports high-confidence partial results with explicit coordinates", () => {
  const result = googleMapsExtractor.extract(
    "https://www.google.com/maps/place/Restaurant/@31.2304,121.4737,17z",
  );

  assert.equal(result.name, "Restaurant");
  assert.equal(result.latitude, 31.2304);
  assert.equal(result.longitude, 121.4737);
  assert.equal(result.extractionStatus, "partial");
  assert.equal(result.confidence, "high");
  assert.deepEqual(result.extractedFields, ["name", "latitude", "longitude"]);
});

test("Google Maps extractor accepts an explicitly encoded address without guessing other fields", () => {
  const result = googleMapsExtractor.extract(
    "https://maps.google.com/?q=Restaurant&address=Shanghai%20Road%2088",
  );

  assert.equal(result.name, "Restaurant");
  assert.equal(result.address, "Shanghai Road 88");
  assert.equal(result.category, null);
  assert.equal(result.city, null);
  assert.deepEqual(result.extractedFields, ["name", "address"]);
});

test("malformed or out-of-range Google Maps coordinates are ignored", () => {
  const malformed = googleMapsExtractor.extract(
    "https://www.google.com/maps/place/Restaurant/@31.2304,not-a-coordinate,17z",
  );
  const outOfRange = googleMapsExtractor.extract(
    "https://www.google.com/maps/place/Restaurant/@91,181,17z",
  );

  assert.equal(malformed.latitude, null);
  assert.equal(malformed.longitude, null);
  assert.equal(malformed.name, "Restaurant");
  assert.deepEqual(malformed.extractedFields, ["name"]);
  assert.equal(outOfRange.latitude, null);
  assert.equal(outOfRange.longitude, null);
  assert.equal(outOfRange.name, "Restaurant");
});

test("unsupported Google Maps URL shapes return empty fields safely", () => {
  const result = googleMapsExtractor.extract("https://maps.app.goo.gl/example");

  assert.equal(result.extractionStatus, "unavailable");
  assert.equal(result.confidence, "low");
  assert.deepEqual(result.extractedFields, []);
  assert.equal(result.name, null);
  assert.equal(result.address, null);
  assert.equal(result.latitude, null);
  assert.equal(result.longitude, null);
});

test("non-Google URLs do not select the Google Maps extractor", () => {
  assert.equal(detectSource("https://example.com/maps/search/Restaurant").sourceType, "website");
  assert.equal(selectExtractor("website"), websiteExtractor);
  assert.notEqual(selectExtractor("website"), googleMapsExtractor);
});

test("the pipeline reports unavailable extraction without inventing fields", () => {
  const result = runExtractionPipeline("https://www.instagram.com/p/abc");

  assert.equal(result.detection.sourceType, "instagram");
  assert.equal(result.extractor, null);
  assert.equal(result.result.extractionStatus, "unavailable");
  assert.equal(result.result.confidence, "low");
  assert.deepEqual(result.result.extractedFields, []);
  assert.equal(result.result.sourceType, "instagram");
  assert.equal(result.result.name, null);
  assert.match(result.result.message, /available/i);
});
