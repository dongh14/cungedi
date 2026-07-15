import assert from "node:assert/strict";
import test from "node:test";
import {
  resolveGoogleMapsUrl,
} from "./google-maps-url-resolver.ts";
import { runExtractionPipelineWithWebsiteFetch } from "./extraction-architecture.ts";

test("resolves a Google Maps short URL through bounded redirects", async () => {
  const requestedUrls: string[] = [];
  const finalUrl = "https://www.google.com/maps/place/Blue%20Bottle/@35.6938,139.7034,17z";

  const result = await resolveGoogleMapsUrl("https://maps.app.goo.gl/blue-bottle", {
    fetchImpl: async (input) => {
      requestedUrls.push(String(input));

      return requestedUrls.length === 1
        ? new Response(null, {
            status: 302,
            headers: { location: finalUrl },
          })
        : new Response("<html></html>", { status: 200 });
    },
  });

  assert.equal(result.status, "resolved");
  assert.equal(result.resolvedUrl, finalUrl);
  assert.deepEqual(requestedUrls, [
    "https://maps.app.goo.gl/blue-bottle",
    finalUrl,
  ]);
});

test("resolves a shortened google.com/maps URL when it redirects", async () => {
  const finalUrl = "https://maps.google.com/?q=Blue%20Bottle";
  let attempts = 0;
  const result = await resolveGoogleMapsUrl("https://www.google.com/maps?short=1", {
    fetchImpl: async () => {
      attempts += 1;

      return attempts === 1
        ? new Response(null, {
            status: 302,
            headers: { location: finalUrl },
          })
        : new Response("<html></html>", { status: 200 });
    },
  });

  assert.equal(result.status, "resolved");
  assert.equal(result.resolvedUrl, finalUrl);
  assert.equal(attempts, 2);
});

test("reports redirect failures without throwing", async () => {
  const result = await resolveGoogleMapsUrl("https://maps.app.goo.gl/missing", {
    fetchImpl: async () => new Response(null, { status: 302 }),
  });

  assert.equal(result.status, "redirect_failed");
  assert.equal(result.resolvedUrl, null);
});

test("rejects invalid and unsupported resolver inputs", async () => {
  const invalid = await resolveGoogleMapsUrl("not a URL");
  const unsupportedProtocol = await resolveGoogleMapsUrl("ftp://maps.app.goo.gl/example");
  const unsupportedDomain = await resolveGoogleMapsUrl("https://example.com/maps/place/cafe");

  assert.equal(invalid.status, "invalid_url");
  assert.equal(unsupportedProtocol.status, "invalid_url");
  assert.equal(unsupportedDomain.status, "unsupported");
});

test("passes the resolved URL to the existing Google Maps extractor", async () => {
  const shortUrl = "https://maps.app.goo.gl/blue-bottle";
  const resolvedUrl = "https://www.google.com/maps/place/Blue%20Bottle/@35.6938,139.7034,17z";

  const pipeline = await runExtractionPipelineWithWebsiteFetch(shortUrl, {
    fetchImpl: async (input) =>
      String(input) === shortUrl
        ? new Response(null, {
            status: 302,
            headers: { location: resolvedUrl },
          })
        : new Response("<html></html>", { status: 200 }),
  });

  assert.equal(pipeline.googleMapsResolution?.status, "resolved");
  assert.equal(pipeline.googleMapsResolution?.resolvedUrl, resolvedUrl);
  assert.equal(pipeline.fetchResult, null);
  assert.equal(pipeline.result.name, "Blue Bottle");
  assert.equal(pipeline.result.latitude, 35.6938);
  assert.equal(pipeline.result.longitude, 139.7034);
  assert.equal(pipeline.result.sourceUrl, shortUrl);
});

test("keeps the manual review message when short-link resolution fails", async () => {
  const pipeline = await runExtractionPipelineWithWebsiteFetch("https://maps.app.goo.gl/missing", {
    fetchImpl: async () => new Response(null, { status: 302 }),
  });

  assert.equal(pipeline.googleMapsResolution?.status, "redirect_failed");
  assert.equal(pipeline.result.message, "Unable to resolve Google Maps link. Please review manually.");
  assert.equal(pipeline.result.extractionStatus, "unavailable");
});

test("keeps the existing Google Maps extractor result when no redirect is needed", async () => {
  const sourceUrl = "https://www.google.com/maps/place/Cafe/@31.2304,121.4737,17z";
  const pipeline = await runExtractionPipelineWithWebsiteFetch(sourceUrl, {
    fetchImpl: async () => {
      throw new Error("direct Google Maps URLs should not be fetched");
    },
  });

  assert.equal(pipeline.googleMapsResolution?.status, "resolved");
  assert.equal(pipeline.result.name, "Cafe");
  assert.equal(pipeline.result.latitude, 31.2304);
  assert.equal(pipeline.result.longitude, 121.4737);
});
