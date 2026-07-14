import assert from "node:assert/strict";
import test from "node:test";
import {
  fetchWebsiteHtml,
  type WebsiteFetchOptions,
} from "./website-fetcher.ts";
import { googleMapsExtractor, runExtractionPipelineWithWebsiteFetch } from "./extraction-architecture.ts";

function responseFromHtml(html: string, headers?: HeadersInit) {
  return new Response(html, {
    status: 200,
    headers: {
      "content-type": "text/html; charset=utf-8",
      ...headers,
    },
  });
}

test("fetches one valid HTML URL within the response limit", async () => {
  let requestedUrl = "";
  const options: WebsiteFetchOptions = {
    fetchImpl: async (input) => {
      requestedUrl = String(input);
      return responseFromHtml("<html><title>Harbor Market</title></html>");
    },
  };

  const result = await fetchWebsiteHtml("https://example.com/place", options);

  assert.equal(result.ok, true);
  assert.equal(requestedUrl, "https://example.com/place");
  assert.equal(result.ok && result.html.includes("Harbor Market"), true);
});

test("rejects invalid and unsupported website URLs before fetching", async () => {
  let fetchCalled = false;
  const options: WebsiteFetchOptions = {
    fetchImpl: async () => {
      fetchCalled = true;
      return responseFromHtml("unused");
    },
  };

  const invalid = await fetchWebsiteHtml("not a URL", options);
  const unsupported = await fetchWebsiteHtml("ftp://example.com/place", options);

  assert.equal(invalid.ok, false);
  assert.equal(invalid.ok ? null : invalid.errorCode, "invalid-url");
  assert.equal(unsupported.ok, false);
  assert.equal(unsupported.ok ? null : unsupported.errorCode, "unsupported-protocol");
  assert.equal(fetchCalled, false);
});

test("reports timeout and network failures without throwing", async () => {
  const timeoutFetch: typeof fetch = async (_input, init) =>
    new Promise<Response>((_resolve, reject) => {
      init?.signal?.addEventListener("abort", () => {
        reject(new DOMException("The operation was aborted.", "AbortError"));
      });
    });
  const timeout = await fetchWebsiteHtml("https://example.com/slow", {
    fetchImpl: timeoutFetch,
    timeoutMs: 5,
  });
  const network = await fetchWebsiteHtml("https://example.com/offline", {
    fetchImpl: async () => {
      throw new Error("offline");
    },
  });

  assert.equal(timeout.ok, false);
  assert.equal(timeout.ok ? null : timeout.errorCode, "timeout");
  assert.equal(network.ok, false);
  assert.equal(network.ok ? null : network.errorCode, "network-error");
});

test("limits response size and rejects non-HTML responses", async () => {
  const tooLarge = await fetchWebsiteHtml("https://example.com/large", {
    maxBytes: 10,
    fetchImpl: async () => responseFromHtml("12345678901"),
  });
  const notHtml = await fetchWebsiteHtml("https://example.com/file", {
    fetchImpl: async () => new Response("binary", { headers: { "content-type": "application/json" } }),
  });

  assert.equal(tooLarge.ok, false);
  assert.equal(tooLarge.ok ? null : tooLarge.errorCode, "response-too-large");
  assert.equal(notHtml.ok, false);
  assert.equal(notHtml.ok ? null : notHtml.errorCode, "unsupported-content-type");
});

test("passes fetched HTML to the website parser and keeps Google Maps URL parsing unchanged", async () => {
  const pipeline = await runExtractionPipelineWithWebsiteFetch("https://example.com/restaurant", {
    fetchImpl: async () =>
      responseFromHtml(`
        <html>
          <head><title>Harbor Market</title></head>
          <body><script type="application/ld+json">{"@type":"Restaurant","name":"Harbor Market","telephone":"021-5555-6666"}</script></body>
        </html>
      `),
  });

  assert.equal(pipeline.result.sourceType, "website");
  assert.equal(pipeline.result.name, "Harbor Market");
  assert.equal(pipeline.result.phone, "021-5555-6666");
  assert.deepEqual(pipeline.result.extractedFields, ["name", "category", "phone"]);

  const googleResult = await runExtractionPipelineWithWebsiteFetch(
    "https://maps.google.com/?q=Restaurant+Name",
    {
      fetchImpl: async () => {
        throw new Error("Google Maps must not be fetched by the website flow");
      },
    },
  );

  assert.equal(googleResult.fetchResult, null);
  assert.equal(googleResult.result.name, googleMapsExtractor.extract("https://maps.google.com/?q=Restaurant+Name").name);
});
