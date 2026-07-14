import assert from "node:assert/strict";
import test from "node:test";
import { websiteExtractor } from "./extraction-architecture.ts";
import { parseWebsiteMetadata } from "./website-metadata.ts";

test("parses HTML title, meta description, and Open Graph metadata", () => {
  const result = websiteExtractor.extract("https://example.com/place", {
    html: `
      <html>
        <head>
          <title>Blue Bottle Shanghai</title>
          <meta name="description" content="Coffee and pastries." />
          <meta property="og:title" content="Blue Bottle" />
          <meta property="og:description" content="Official place page." />
          <meta property="og:image" content="https://example.com/blue-bottle.jpg" />
        </head>
      </html>
    `,
  });

  assert.equal(result.name, "Blue Bottle");
  assert.equal(result.description, "Official place page.");
  assert.equal(result.extractionStatus, "partial");
  assert.deepEqual(result.extractedFields, ["name", "description"]);

  const metadata = parseWebsiteMetadata({
    metadata: { ogImage: "https://example.com/blue-bottle.jpg" },
  });
  assert.equal(metadata.metadata.ogImage, "https://example.com/blue-bottle.jpg");
});

test("parses Restaurant JSON-LD fields safely", () => {
  const result = websiteExtractor.extract("https://example.com/restaurant", {
    structuredData: {
      "@context": "https://schema.org",
      "@type": "Restaurant",
      name: "Alimentari",
      category: "Restaurant",
      address: {
        "@type": "PostalAddress",
        streetAddress: "永嘉路 321 号",
        addressLocality: "上海",
      },
      telephone: "+86 21 1234 5678",
      url: "https://example.com/restaurant",
    },
  });

  assert.equal(result.name, "Alimentari");
  assert.equal(result.category, "Restaurant");
  assert.equal(result.address, "永嘉路 321 号, 上海");
  assert.equal(result.phone, "+86 21 1234 5678");
  assert.equal(result.websiteUrl, "https://example.com/restaurant");
  assert.equal(result.confidence, "high");
  assert.deepEqual(result.extractedFields, [
    "name",
    "category",
    "address",
    "phone",
    "websiteUrl",
  ]);
});

test("parses LocalBusiness JSON-LD from HTML", () => {
  const result = websiteExtractor.extract("https://example.com/store", {
    html: `
      <script type="application/ld+json">
        {
          "@type": "LocalBusiness",
          "name": "Harbor Market",
          "address": "88 Harbor Road",
          "telephone": "021-5555-6666"
        }
      </script>
    `,
  });

  assert.equal(result.name, "Harbor Market");
  assert.equal(result.address, "88 Harbor Road");
  assert.equal(result.phone, "021-5555-6666");
  assert.equal(result.extractionStatus, "partial");
});

test("ignores unsupported schema types and does not invent missing fields", () => {
  const result = websiteExtractor.extract("https://example.com/page", {
    structuredData: {
      "@type": "Product",
      name: "A product",
      telephone: "should not be used",
    },
  });

  assert.equal(result.extractionStatus, "unavailable");
  assert.equal(result.name, null);
  assert.equal(result.category, null);
  assert.equal(result.address, null);
  assert.equal(result.phone, null);
  assert.deepEqual(result.extractedFields, []);
});

test("website extractor does not fetch when no document is provided", () => {
  const result = websiteExtractor.extract("https://example.com/place");

  assert.equal(result.extractionStatus, "unavailable");
  assert.equal(result.confidence, "low");
  assert.deepEqual(result.extractedFields, []);
});
