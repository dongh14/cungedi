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

test("selects the placeholder extractor for currently supported source types", () => {
  assert.equal(selectExtractor("google_maps"), googleMapsExtractor);
  assert.equal(selectExtractor("website"), websiteExtractor);
  assert.equal(selectExtractor("xiaohongshu"), xiaohongshuExtractor);
  assert.equal(selectExtractor("douyin"), douyinExtractor);
  assert.equal(selectExtractor("instagram"), null);
  assert.equal(selectExtractor("unknown"), null);
});

test("placeholder extractors return an explicit not-implemented result", () => {
  const sourceUrl = "https://maps.google.com/?cid=123";
  const result = googleMapsExtractor.extract(sourceUrl);

  assert.deepEqual(
    {
      sourceType: result.sourceType,
      sourceUrl: result.sourceUrl,
      extractionStatus: result.extractionStatus,
      confidence: result.confidence,
      name: result.name,
      latitude: result.latitude,
      longitude: result.longitude,
    },
    {
      sourceType: "google_maps",
      sourceUrl,
      extractionStatus: "not_implemented",
      confidence: "none",
      name: null,
      latitude: null,
      longitude: null,
    },
  );
  assert.match(result.message, /not implemented/i);
});

test("the pipeline reports unavailable extraction without inventing fields", () => {
  const result = runExtractionPipeline("https://www.instagram.com/p/abc");

  assert.equal(result.detection.sourceType, "instagram");
  assert.equal(result.extractor, null);
  assert.equal(result.result.extractionStatus, "unavailable");
  assert.equal(result.result.sourceType, "instagram");
  assert.equal(result.result.name, null);
  assert.match(result.result.message, /available/i);
});
