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
  assert.equal(result.imageUrl, "https://example.com/blue-bottle.jpg");
  assert.equal(result.extractionStatus, "partial");
  assert.deepEqual(result.extractedFields, ["name", "description", "imageUrl"]);

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
    "city",
    "phone",
    "websiteUrl",
  ]);
});

test("extracts a supported district from structured address data", () => {
  const result = websiteExtractor.extract("https://example.com/restaurant", {
    structuredData: {
      "@type": "Restaurant",
      name: "Shizuku",
      address: {
        "@type": "PostalAddress",
        streetAddress: "南京西路 1 号",
        addressLocality: "上海",
        addressRegion: "静安区",
      },
    },
  });

  assert.equal(result.city, "上海");
  assert.equal(result.district, "静安区");
  assert.equal(result.fieldOrigins?.district, "structured");
  assert.equal(result.extractedFields.includes("district"), true);
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

test("extracts an explicit JSON-LD image URL before Open Graph image metadata", () => {
  const result = websiteExtractor.extract("https://example.com/restaurant", {
    html: `
      <meta property="og:image" content="https://example.com/og.jpg" />
      <script type="application/ld+json">
        {
          "@type": "Restaurant",
          "name": "Alimentari",
          "image": { "url": "https://example.com/structured.jpg" }
        }
      </script>
    `,
  });

  assert.equal(result.imageUrl, "https://example.com/structured.jpg");
  assert.equal(result.fieldOrigins?.imageUrl, "structured");
  assert.equal(result.extractedFields.includes("imageUrl"), true);
});

test("extracts Open Graph image metadata when JSON-LD has no image", () => {
  const result = websiteExtractor.extract("https://example.com/restaurant", {
    html: `
      <meta property="og:title" content="Alimentari" />
      <meta property="og:image" content="https://example.com/og.jpg" />
    `,
  });

  assert.equal(result.imageUrl, "https://example.com/og.jpg");
  assert.equal(result.fieldOrigins?.imageUrl, "metadata");
});

test("prefers a JSON-LD business name over generic page titles", () => {
  const result = websiteExtractor.extract("https://example.com/restaurant", {
    html: `
      <title>Welcome to the restaurant</title>
      <script type="application/ld+json">
        {"@type":"Restaurant","name":"Alimentari","address":"88 Yongjia Road","telephone":"021-5555-6666"}
      </script>
    `,
  });

  assert.equal(result.name, "Alimentari");
  assert.equal(result.confidence, "high");
  assert.equal(result.extractionStatus, "partial");
});

test("prefers an Open Graph title over a generic HTML title", () => {
  const result = websiteExtractor.extract("https://example.com/restaurant", {
    html: `
      <title>Official Website</title>
      <meta property="og:title" content="Alimentari Shanghai" />
    `,
  });

  assert.equal(result.name, "Alimentari Shanghai");
  assert.equal(result.confidence, "medium");
});

test("uses a conservative URL name when generic titles are the only page names", () => {
  const result = websiteExtractor.extract("https://www.tsukiji.or.jp/english/", {
    html: "<title>Welcome to Tsukiji</title>",
  });

  assert.equal(result.name, "Tsukiji");
  assert.equal(result.confidence, "low");
  assert.equal(result.extractionStatus, "partial");
});

test("keeps a weak generic title at low confidence when no useful URL name exists", () => {
  const result = websiteExtractor.extract("https://example.com", {
    title: "Welcome to Tsukiji",
  });

  assert.equal(result.name, "Welcome to Tsukiji");
  assert.equal(result.confidence, "low");
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
  assert.equal(result.imageUrl, null);
});
