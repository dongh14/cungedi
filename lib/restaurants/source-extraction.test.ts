import assert from "node:assert/strict";
import test from "node:test";
import { inferCuisineFromSourceContent } from "./cuisine-inference";
import { validateAddress, validateRestaurantName } from "./field-validation";
import {
  classifyRestaurantSource,
  getSourceSupportLevel,
} from "./source-classification";
import { extractRestaurantDraftFromSource } from "./source-extraction";

function createHtmlResponse(html: string, url: string) {
  return new Response(html, {
    status: 200,
    headers: {
      "content-type": "text/html; charset=utf-8",
    },
  });
}

test("classifies source kinds and support levels correctly", () => {
  assert.equal(
    classifyRestaurantSource("https://www.google.com/maps/place/Example"),
    "google-maps",
  );
  assert.equal(classifyRestaurantSource("https://xhslink.com/abc"), "xiaohongshu");
  assert.equal(classifyRestaurantSource("https://v.douyin.com/abc"), "douyin");
  assert.equal(classifyRestaurantSource("https://example.com/restaurant"), "public-web");
  assert.equal(getSourceSupportLevel("google-maps"), "official");
  assert.equal(getSourceSupportLevel("xiaohongshu"), "best-effort");
});

test("rejects generic navigation-like restaurant names", () => {
  const validatedField = validateRestaurantName({
    value: "Locations",
    confidence: "medium",
    evidenceSource: "page_title",
  });

  assert.equal(validatedField.accepted, false);
  assert.equal(validatedField.value, null);
});

test("rejects oversized body-like address text blocks", () => {
  const validatedField = validateAddress({
    value:
      "Seattle Pacific Place level 4 newsletter sign up privacy cookies careers reservations 600 Pine Street Seattle Washington 98101 and many more repeated navigation words that should never be accepted as an address field value",
    confidence: "low",
    evidenceSource: "visible_text",
  });

  assert.equal(validatedField.accepted, false);
  assert.equal(validatedField.value, null);
});

test("extracts a single restaurant from JSON-LD Restaurant data", async () => {
  const html = `
    <html>
      <head>
        <title>Alimentari Bistro | Shanghai</title>
        <meta property="og:title" content="Alimentari Bistro" />
        <script type="application/ld+json">
          {
            "@context": "https://schema.org",
            "@type": "Restaurant",
            "name": "Alimentari Bistro",
            "servesCuisine": ["Cafe", "Brunch"],
            "address": {
              "@type": "PostalAddress",
              "streetAddress": "永嘉路 321 号",
              "addressLocality": "上海"
            }
          }
        </script>
      </head>
      <body>
        <h1>Alimentari Bistro</h1>
      </body>
    </html>
  `;

  const result = await extractRestaurantDraftFromSource("https://example.com/alimentari", {
    fetchImpl: async () => createHtmlResponse(html, "https://example.com/alimentari"),
  });

  assert.equal(result.status, "success");

  if (result.status !== "success") {
    return;
  }

  assert.equal(result.pageType, "single_restaurant");
  assert.equal(result.candidate.fields.name.value, "Alimentari Bistro");
  assert.equal(result.candidate.fields.address.value, "永嘉路 321 号, 上海");
  assert.equal(result.candidate.fields.city.value, "上海");
  assert.equal(result.candidate.fields.cuisine.value, "Cafe");
});

test("extracts a single restaurant from JSON-LD @graph data", async () => {
  const html = `
    <html>
      <head>
        <title>Graph House</title>
        <script type="application/ld+json">
          {
            "@context": "https://schema.org",
            "@graph": [
              {
                "@type": "BreadcrumbList",
                "name": "Breadcrumbs"
              },
              {
                "@type": "Restaurant",
                "name": "Graph House",
                "address": {
                  "@type": "PostalAddress",
                  "streetAddress": "88 Madison Avenue",
                  "addressLocality": "New York",
                  "addressRegion": "NY",
                  "postalCode": "10016"
                }
              }
            ]
          }
        </script>
      </head>
      <body>
        <p>Seasonal tasting menu.</p>
      </body>
    </html>
  `;

  const result = await extractRestaurantDraftFromSource("https://example.com/graph-house", {
    fetchImpl: async () => createHtmlResponse(html, "https://example.com/graph-house"),
  });

  assert.equal(result.status, "success");

  if (result.status !== "success") {
    return;
  }

  assert.equal(result.candidate.fields.name.value, "Graph House");
  assert.equal(
    result.candidate.fields.address.value,
    "88 Madison Avenue, New York, NY, 10016",
  );
  assert.equal(result.candidate.fields.city.value, "New York");
});

test("extracts from LocalBusiness plus PostalAddress data", async () => {
  const html = `
    <html>
      <head>
        <title>Good Noodles</title>
        <script type="application/ld+json">
          {
            "@context": "https://schema.org",
            "@type": "LocalBusiness",
            "name": "Good Noodles",
            "address": {
              "@type": "PostalAddress",
              "streetAddress": "愚园路 88 号",
              "addressLocality": "上海"
            }
          }
        </script>
      </head>
      <body>
        <p>Hand-pulled noodles.</p>
      </body>
    </html>
  `;

  const result = await extractRestaurantDraftFromSource("https://example.com/good-noodles", {
    fetchImpl: async () => createHtmlResponse(html, "https://example.com/good-noodles"),
  });

  assert.equal(result.status, "success");

  if (result.status !== "success") {
    return;
  }

  assert.equal(result.candidate.fields.name.value, "Good Noodles");
  assert.equal(result.candidate.fields.city.value, "上海");
  assert.equal(result.candidate.fields.address.value, "愚园路 88 号, 上海");
});

test("extracts from a FoodEstablishment subtype", async () => {
  const html = `
    <html>
      <head>
        <title>Sun Bakery</title>
        <script type="application/ld+json">
          {
            "@context": "https://schema.org",
            "@type": "Bakery",
            "name": "Sun Bakery",
            "address": {
              "@type": "PostalAddress",
              "streetAddress": "120 King Street",
              "addressLocality": "Seattle",
              "addressRegion": "WA",
              "postalCode": "98101"
            }
          }
        </script>
      </head>
      <body>
        <p>Fresh pastries every morning.</p>
      </body>
    </html>
  `;

  const result = await extractRestaurantDraftFromSource("https://example.com/sun-bakery", {
    fetchImpl: async () => createHtmlResponse(html, "https://example.com/sun-bakery"),
  });

  assert.equal(result.status, "success");

  if (result.status !== "success") {
    return;
  }

  assert.equal(result.candidate.fields.name.value, "Sun Bakery");
  assert.equal(result.candidate.fields.city.value, "Seattle");
});

test("keeps parsing valid structured data when another JSON-LD block is malformed", async () => {
  const html = `
    <html>
      <head>
        <title>Beacon Dining</title>
        <script type="application/ld+json">{ not valid json }</script>
        <script type="application/ld+json">
          {
            "@context": "https://schema.org",
            "@type": "Restaurant",
            "name": "Beacon Dining",
            "address": {
              "@type": "PostalAddress",
              "streetAddress": "500 Market Street",
              "addressLocality": "San Francisco",
              "addressRegion": "CA",
              "postalCode": "94105"
            }
          }
        </script>
      </head>
      <body>
        <p>Modern California cooking.</p>
      </body>
    </html>
  `;

  const result = await extractRestaurantDraftFromSource("https://example.com/beacon", {
    fetchImpl: async () => createHtmlResponse(html, "https://example.com/beacon"),
  });

  assert.equal(result.status, "success");

  if (result.status !== "success") {
    return;
  }

  assert.equal(result.candidate.fields.name.value, "Beacon Dining");
});

test("allows a reliable single-restaurant name while leaving address blank", async () => {
  const html = `
    <html>
      <head>
        <title>Sushi Nakazawa</title>
        <meta
          name="description"
          content="Sushi Nakazawa serves an omakase experience in New York."
        />
      </head>
      <body>
        <div id="app"></div>
      </body>
    </html>
  `;

  const result = await extractRestaurantDraftFromSource(
    "https://www.sushinakazawa.com/",
    {
      fetchImpl: async () => createHtmlResponse(html, "https://www.sushinakazawa.com/"),
    },
  );

  assert.equal(result.status, "success");

  if (result.status !== "success") {
    return;
  }

  assert.equal(result.candidate.fields.name.value, "Sushi Nakazawa");
  assert.equal(result.candidate.fields.address.value, null);
  assert.equal(result.candidate.fields.city.value, "纽约");
});

test("extracts address from restaurant-specific metadata only when evidence is strong", async () => {
  const html = `
    <html>
      <head>
        <title>Eleven Madison Park</title>
        <meta
          name="description"
          content="Eleven Madison Park is a fine dining restaurant located at 11 Madison Avenue, New York, NY 10010."
        />
      </head>
      <body>
        <main>
          <section>
            <h2>Hours & Location</h2>
            <p>11 Madison Avenue</p>
            <p>New York, NY 10010</p>
          </section>
        </main>
      </body>
    </html>
  `;

  const result = await extractRestaurantDraftFromSource(
    "https://www.elevenmadisonpark.com/",
    {
      fetchImpl: async () => createHtmlResponse(html, "https://www.elevenmadisonpark.com/"),
    },
  );

  assert.equal(result.status, "success");

  if (result.status !== "success") {
    return;
  }

  assert.equal(result.candidate.fields.address.value, "11 Madison Avenue, New York, NY 10010");
  assert.equal(result.candidate.fields.city.value, "纽约");
});

test("does not treat generic metadata as an address", async () => {
  const html = `
    <html>
      <head>
        <title>Home | Example Dining</title>
        <meta
          name="description"
          content="Visit our homepage to explore menus, gift cards, careers, and the full restaurant story."
        />
      </head>
      <body>
        <p>Welcome to our brand.</p>
      </body>
    </html>
  `;

  const result = await extractRestaurantDraftFromSource("https://example.com/example-dining", {
    fetchImpl: async () => createHtmlResponse(html, "https://example.com/example-dining"),
  });

  assert.equal(result.status, "fallback");
  assert.equal(result.pageType, "generic_page");
});

test("falls back for a generic webpage", async () => {
  const html = `
    <html>
      <head>
        <title>Home | Example Company</title>
        <meta name="description" content="About our company, careers and newsletter." />
      </head>
      <body>
        <p>Sign up for our newsletter and browse company updates.</p>
      </body>
    </html>
  `;

  const result = await extractRestaurantDraftFromSource("https://example.com", {
    fetchImpl: async () => createHtmlResponse(html, "https://example.com"),
  });

  assert.equal(result.status, "fallback");
  assert.equal(result.pageType, "generic_page");
});

test("falls back gracefully when all structured data is malformed", async () => {
  const html = `
    <html>
      <head>
        <title>Example Dining</title>
        <script type="application/ld+json">{ not valid json }</script>
      </head>
      <body>
        <p>Generic copy without a clear restaurant profile.</p>
      </body>
    </html>
  `;

  const result = await extractRestaurantDraftFromSource("https://example.com/malformed", {
    fetchImpl: async () => createHtmlResponse(html, "https://example.com/malformed"),
  });

  assert.equal(result.status, "fallback");
});

test("keeps cuisine blank when confidence is low", async () => {
  const html = `
    <html>
      <head>
        <title>River House</title>
        <script type="application/ld+json">
          {
            "@context": "https://schema.org",
            "@type": "Restaurant",
            "name": "River House",
            "address": {
              "@type": "PostalAddress",
              "streetAddress": "West Lake Road 12",
              "addressLocality": "杭州"
            }
          }
        </script>
        <meta name="description" content="A warm place for dinner and drinks." />
      </head>
      <body>
        <p>A warm room with seasonal plates.</p>
      </body>
    </html>
  `;

  const result = await extractRestaurantDraftFromSource("https://example.com/river-house", {
    fetchImpl: async () => createHtmlResponse(html, "https://example.com/river-house"),
  });

  assert.equal(result.status, "success");

  if (result.status !== "success") {
    return;
  }

  assert.equal(result.candidate.fields.cuisine.value, null);
});

test("classifies a restaurant locations index page as a list and falls back", async () => {
  const html = `
    <html>
      <head>
        <title>Locations | Din Tai Fung Restaurants</title>
        <meta property="og:title" content="Locations" />
        <meta name="description" content="Find all Din Tai Fung restaurant locations, hours, reservations and gift cards." />
      </head>
      <body>
        <header>
          <nav>Menu Locations Gift Cards Careers Newsletter</nav>
        </header>
        <main>
          <h1>Locations</h1>
          <p>Find a Din Tai Fung near you.</p>
          <section>
            <h2>Seattle</h2>
            <p>Pacific Place, 600 Pine St, Seattle, WA 98101</p>
          </section>
          <section>
            <h2>Los Angeles</h2>
            <p>Glendale Galleria, 321 Americana Way, Glendale, CA 91210</p>
          </section>
        </main>
        <footer>
          <p>Subscribe to our newsletter for updates, privacy policy and careers.</p>
        </footer>
      </body>
    </html>
  `;

  const result = await extractRestaurantDraftFromSource("https://dtf.com/en-us/locations", {
    fetchImpl: async () => createHtmlResponse(html, "https://dtf.com/en-us/locations"),
  });

  assert.equal(result.status, "fallback");
  assert.equal(result.pageType, "restaurant_list");
  assert.match(result.reason, /目录|位置索引/);
});

test("falls back for Google Maps when bounded server fetch does not expose reliable fields", async () => {
  const html = `
    <html>
      <head>
        <title>Google Maps</title>
        <meta name="description" content="Find local businesses, view maps and get driving directions in Google Maps." />
      </head>
      <body>
        <div>Enable JavaScript to run this app.</div>
      </body>
    </html>
  `;

  const result = await extractRestaurantDraftFromSource(
    "https://www.google.com/maps/place/Example",
    {
      fetchImpl: async () =>
        createHtmlResponse(html, "https://www.google.com/maps/place/Example"),
    },
  );

  assert.equal(result.status, "fallback");
  assert.match(result.reason, /Google Maps/);
});

test("keeps cuisine inference low-confidence when evidence is weak", () => {
  const result = inferCuisineFromSourceContent({
    title: "A lively neighborhood restaurant",
    description: "Great food, drinks and a warm room.",
    visibleText: "A place for dinner, lunch and casual hangouts.",
  });

  assert.equal(result.cuisine, null);
  assert.equal(result.isConfident, false);
});
