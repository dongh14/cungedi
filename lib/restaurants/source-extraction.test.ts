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

test("accepts a Hotel JSON-LD page as a 住宿 candidate", async () => {
  const html = `
    <html>
      <head>
        <title>Lakeview Hotel</title>
        <script type="application/ld+json">
          {
            "@context": "https://schema.org",
            "@type": "Hotel",
            "name": "Lakeview Hotel",
            "address": {
              "@type": "PostalAddress",
              "streetAddress": "西湖大道 88 号",
              "addressLocality": "杭州"
            }
          }
        </script>
      </head>
      <body>
        <p>Stay by the lake.</p>
      </body>
    </html>
  `;

  const result = await extractRestaurantDraftFromSource("https://example.com/lakeview-hotel", {
    fetchImpl: async () => createHtmlResponse(html, "https://example.com/lakeview-hotel"),
  });

  assert.equal(result.status, "success");

  if (result.status !== "success") {
    return;
  }

  assert.equal(result.candidate.category, "住宿");
  assert.equal(result.candidate.fields.name.value, "Lakeview Hotel");
  assert.equal(result.candidate.fields.city.value, "杭州");
  assert.equal(result.candidate.fields.cuisine.value, "酒店");
});

test("accepts LodgingBusiness with PostalAddress as a 住宿 candidate", async () => {
  const html = `
    <html>
      <head>
        <title>Pine Courtyard Stay</title>
        <script type="application/ld+json">
          {
            "@context": "https://schema.org",
            "@type": "LodgingBusiness",
            "name": "Pine Courtyard Stay",
            "address": {
              "@type": "PostalAddress",
              "streetAddress": "平江路 23 号",
              "addressLocality": "苏州"
            }
          }
        </script>
      </head>
      <body>
        <p>Quiet rooms in the old town.</p>
      </body>
    </html>
  `;

  const result = await extractRestaurantDraftFromSource("https://example.com/pine-courtyard", {
    fetchImpl: async () => createHtmlResponse(html, "https://example.com/pine-courtyard"),
  });

  assert.equal(result.status, "success");

  if (result.status !== "success") {
    return;
  }

  assert.equal(result.candidate.category, "住宿");
  assert.equal(result.candidate.fields.address.value, "平江路 23 号, 苏州");
});

test("infers 度假村 from Resort structured data", async () => {
  const html = `
    <html>
      <head>
        <title>Blue Bay Resort</title>
        <script type="application/ld+json">
          {
            "@context": "https://schema.org",
            "@type": "Resort",
            "name": "Blue Bay Resort",
            "address": {
              "@type": "PostalAddress",
              "streetAddress": "Sunrise Coast 1",
              "addressLocality": "Sanya"
            }
          }
        </script>
      </head>
      <body>
        <p>Oceanfront villas and spa weekends.</p>
      </body>
    </html>
  `;

  const result = await extractRestaurantDraftFromSource("https://example.com/blue-bay", {
    fetchImpl: async () => createHtmlResponse(html, "https://example.com/blue-bay"),
  });

  assert.equal(result.status, "success");

  if (result.status !== "success") {
    return;
  }

  assert.equal(result.candidate.category, "住宿");
  assert.equal(result.candidate.fields.cuisine.value, "度假村");
});

test("accepts a TouristAttraction JSON-LD page as a 景点 candidate", async () => {
  const html = `
    <html>
      <head>
        <title>West Lake Scenic Area</title>
        <script type="application/ld+json">
          {
            "@context": "https://schema.org",
            "@type": "TouristAttraction",
            "name": "West Lake Scenic Area",
            "address": {
              "@type": "PostalAddress",
              "streetAddress": "龙井路 1 号",
              "addressLocality": "杭州"
            }
          }
        </script>
      </head>
      <body>
        <p>Classic Hangzhou lakeside scenery.</p>
      </body>
    </html>
  `;

  const result = await extractRestaurantDraftFromSource("https://example.com/west-lake", {
    fetchImpl: async () => createHtmlResponse(html, "https://example.com/west-lake"),
  });

  assert.equal(result.status, "success");

  if (result.status !== "success") {
    return;
  }

  assert.equal(result.candidate.category, "景点");
  assert.equal(result.candidate.fields.name.value, "West Lake Scenic Area");
  assert.equal(result.candidate.fields.city.value, "杭州");
});

test("infers 博物馆 from Museum structured data", async () => {
  const html = `
    <html>
      <head>
        <title>West Bund Museum</title>
        <script type="application/ld+json">
          {
            "@context": "https://schema.org",
            "@type": "Museum",
            "name": "West Bund Museum",
            "address": {
              "@type": "PostalAddress",
              "streetAddress": "龙腾大道 2600 号",
              "addressLocality": "上海"
            }
          }
        </script>
      </head>
      <body>
        <p>Modern art by the river.</p>
      </body>
    </html>
  `;

  const result = await extractRestaurantDraftFromSource("https://example.com/wbm", {
    fetchImpl: async () => createHtmlResponse(html, "https://example.com/wbm"),
  });

  assert.equal(result.status, "success");

  if (result.status !== "success") {
    return;
  }

  assert.equal(result.candidate.category, "景点");
  assert.equal(result.candidate.fields.cuisine.value, "博物馆");
});

test("infers 公园 from Park structured data", async () => {
  const html = `
    <html>
      <head>
        <title>Central Park</title>
        <script type="application/ld+json">
          {
            "@context": "https://schema.org",
            "@type": "Park",
            "name": "Central Park",
            "address": {
              "@type": "PostalAddress",
              "streetAddress": "59th Street",
              "addressLocality": "New York"
            }
          }
        </script>
      </head>
      <body>
        <p>Urban green space.</p>
      </body>
    </html>
  `;

  const result = await extractRestaurantDraftFromSource("https://example.com/central-park", {
    fetchImpl: async () => createHtmlResponse(html, "https://example.com/central-park"),
  });

  assert.equal(result.status, "success");

  if (result.status !== "success") {
    return;
  }

  assert.equal(result.candidate.category, "景点");
  assert.equal(result.candidate.fields.cuisine.value, "公园");
});

test("infers 动物园 from Zoo structured data", async () => {
  const html = `
    <html>
      <head>
        <title>River Zoo</title>
        <script type="application/ld+json">
          {
            "@context": "https://schema.org",
            "@type": "Zoo",
            "name": "River Zoo",
            "address": {
              "@type": "PostalAddress",
              "streetAddress": "Safari Road 8",
              "addressLocality": "Chengdu"
            }
          }
        </script>
      </head>
      <body>
        <p>Animal encounters and family trails.</p>
      </body>
    </html>
  `;

  const result = await extractRestaurantDraftFromSource("https://example.com/river-zoo", {
    fetchImpl: async () => createHtmlResponse(html, "https://example.com/river-zoo"),
  });

  assert.equal(result.status, "success");

  if (result.status !== "success") {
    return;
  }

  assert.equal(result.candidate.category, "景点");
  assert.equal(result.candidate.fields.cuisine.value, "动物园");
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

test("allows a reliable accommodation name while leaving address blank", async () => {
  const html = `
    <html>
      <head>
        <title>Cloud Nine Hotel</title>
        <script type="application/ld+json">
          {
            "@context": "https://schema.org",
            "@type": "Hotel",
            "name": "Cloud Nine Hotel"
          }
        </script>
        <meta name="description" content="A design hotel in Shanghai with skyline views." />
      </head>
      <body>
        <div>Welcome to Cloud Nine Hotel.</div>
      </body>
    </html>
  `;

  const result = await extractRestaurantDraftFromSource("https://example.com/cloud-nine", {
    fetchImpl: async () => createHtmlResponse(html, "https://example.com/cloud-nine"),
  });

  assert.equal(result.status, "success");

  if (result.status !== "success") {
    return;
  }

  assert.equal(result.candidate.category, "住宿");
  assert.equal(result.candidate.fields.name.value, "Cloud Nine Hotel");
  assert.equal(result.candidate.fields.address.value, null);
});

test("allows a reliable attraction name while leaving address blank", async () => {
  const html = `
    <html>
      <head>
        <title>Old Town Gate</title>
        <script type="application/ld+json">
          {
            "@context": "https://schema.org",
            "@type": "TouristAttraction",
            "name": "Old Town Gate"
          }
        </script>
        <meta name="description" content="A landmark at the entrance of the historic district." />
      </head>
      <body>
        <div>Welcome to the old town.</div>
      </body>
    </html>
  `;

  const result = await extractRestaurantDraftFromSource("https://example.com/old-town-gate", {
    fetchImpl: async () => createHtmlResponse(html, "https://example.com/old-town-gate"),
  });

  assert.equal(result.status, "success");

  if (result.status !== "success") {
    return;
  }

  assert.equal(result.candidate.category, "景点");
  assert.equal(result.candidate.fields.name.value, "Old Town Gate");
  assert.equal(result.candidate.fields.address.value, null);
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

test("falls back when generic LocalBusiness is the only accommodation-like evidence", async () => {
  const html = `
    <html>
      <head>
        <title>City Suites</title>
        <script type="application/ld+json">
          {
            "@context": "https://schema.org",
            "@type": "LocalBusiness",
            "name": "City Suites",
            "address": {
              "@type": "PostalAddress",
              "streetAddress": "人民路 10 号",
              "addressLocality": "成都"
            }
          }
        </script>
      </head>
      <body>
        <p>Stay downtown.</p>
      </body>
    </html>
  `;

  const result = await extractRestaurantDraftFromSource("https://example.com/city-suites", {
    fetchImpl: async () => createHtmlResponse(html, "https://example.com/city-suites"),
  });

  assert.equal(result.status, "fallback");
});

test("falls back when generic Place is the only attraction-like evidence", async () => {
  const html = `
    <html>
      <head>
        <title>Sunset Temple</title>
        <script type="application/ld+json">
          {
            "@context": "https://schema.org",
            "@type": "Place",
            "name": "Sunset Temple",
            "address": {
              "@type": "PostalAddress",
              "streetAddress": "Temple Road 18",
              "addressLocality": "Kyoto"
            }
          }
        </script>
      </head>
      <body>
        <p>Quiet temple courtyards at sunset.</p>
      </body>
    </html>
  `;

  const result = await extractRestaurantDraftFromSource("https://example.com/sunset-temple", {
    fetchImpl: async () => createHtmlResponse(html, "https://example.com/sunset-temple"),
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

test("keeps accommodation subtype blank when confidence is low", async () => {
  const html = `
    <html>
      <head>
        <title>Riverfront Stay</title>
        <script type="application/ld+json">
          {
            "@context": "https://schema.org",
            "@type": "LodgingBusiness",
            "name": "Riverfront Stay",
            "address": {
              "@type": "PostalAddress",
              "streetAddress": "滨江路 66 号",
              "addressLocality": "重庆"
            }
          }
        </script>
        <meta name="description" content="A calm stay near the river." />
      </head>
      <body>
        <p>Simple rooms for travelers.</p>
      </body>
    </html>
  `;

  const result = await extractRestaurantDraftFromSource("https://example.com/riverfront-stay", {
    fetchImpl: async () => createHtmlResponse(html, "https://example.com/riverfront-stay"),
  });

  assert.equal(result.status, "success");

  if (result.status !== "success") {
    return;
  }

  assert.equal(result.candidate.category, "住宿");
  assert.equal(result.candidate.fields.cuisine.value, null);
});

test("keeps attraction subtype blank when confidence is low", async () => {
  const html = `
    <html>
      <head>
        <title>Harbor View Attraction</title>
        <script type="application/ld+json">
          {
            "@context": "https://schema.org",
            "@type": "TouristAttraction",
            "name": "Harbor View Attraction",
            "address": {
              "@type": "PostalAddress",
              "streetAddress": "Pier Road 5",
              "addressLocality": "Xiamen"
            }
          }
        </script>
        <meta name="description" content="A scenic stop by the harbor." />
      </head>
      <body>
        <p>Open-air viewpoints and walking paths.</p>
      </body>
    </html>
  `;

  const result = await extractRestaurantDraftFromSource("https://example.com/harbor-view", {
    fetchImpl: async () => createHtmlResponse(html, "https://example.com/harbor-view"),
  });

  assert.equal(result.status, "success");

  if (result.status !== "success") {
    return;
  }

  assert.equal(result.candidate.category, "景点");
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

test("falls back for a hotel directory or list page", async () => {
  const html = `
    <html>
      <head>
        <title>Hotels | Example Stays</title>
        <meta name="description" content="Browse our hotels, resorts and city stays." />
        <script type="application/ld+json">
          {
            "@context": "https://schema.org",
            "@graph": [
              {
                "@type": "Hotel",
                "name": "Example Stay West",
                "address": {
                  "@type": "PostalAddress",
                  "streetAddress": "West Road 1",
                  "addressLocality": "Shanghai"
                }
              },
              {
                "@type": "Hotel",
                "name": "Example Stay East",
                "address": {
                  "@type": "PostalAddress",
                  "streetAddress": "East Road 2",
                  "addressLocality": "Shanghai"
                }
              }
            ]
          }
        </script>
      </head>
      <body>
        <h1>Our Hotels</h1>
        <p>Find the right stay for your next trip.</p>
      </body>
    </html>
  `;

  const result = await extractRestaurantDraftFromSource("https://example.com/hotels", {
    fetchImpl: async () => createHtmlResponse(html, "https://example.com/hotels"),
  });

  assert.equal(result.status, "fallback");
  assert.equal(result.pageType, "restaurant_list");
  assert.match(result.reason, /住宿目录|列表页/);
});

test("falls back for an attraction directory or list page", async () => {
  const html = `
    <html>
      <head>
        <title>Attractions | City Guide</title>
        <meta name="description" content="Browse our museums, parks and family attractions." />
        <script type="application/ld+json">
          {
            "@context": "https://schema.org",
            "@graph": [
              {
                "@type": "Museum",
                "name": "Harbor Museum",
                "address": {
                  "@type": "PostalAddress",
                  "streetAddress": "Museum Road 1",
                  "addressLocality": "Qingdao"
                }
              },
              {
                "@type": "Park",
                "name": "Seaside Park",
                "address": {
                  "@type": "PostalAddress",
                  "streetAddress": "Park Road 2",
                  "addressLocality": "Qingdao"
                }
              }
            ]
          }
        </script>
      </head>
      <body>
        <h1>Things To Do</h1>
        <p>Find museums, parks and more.</p>
      </body>
    </html>
  `;

  const result = await extractRestaurantDraftFromSource("https://example.com/attractions", {
    fetchImpl: async () => createHtmlResponse(html, "https://example.com/attractions"),
  });

  assert.equal(result.status, "fallback");
  assert.equal(result.pageType, "restaurant_list");
  assert.match(result.reason, /景点目录|列表页/);
});

test("falls back for a travel blog page", async () => {
  const html = `
    <html>
      <head>
        <title>Tokyo 3-Day Travel Guide</title>
        <meta
          name="description"
          content="Our favorite temples, parks and museums in Tokyo for a weekend trip."
        />
      </head>
      <body>
        <article>
          <h1>Tokyo itinerary</h1>
          <p>We visited museums, temples and cafes across the city.</p>
        </article>
      </body>
    </html>
  `;

  const result = await extractRestaurantDraftFromSource("https://example.com/tokyo-guide", {
    fetchImpl: async () => createHtmlResponse(html, "https://example.com/tokyo-guide"),
  });

  assert.equal(result.status, "fallback");
});

test("falls back when restaurant and hotel structured data are both strong", async () => {
  const html = `
    <html>
      <head>
        <title>Grand Place</title>
        <script type="application/ld+json">
          {
            "@context": "https://schema.org",
            "@graph": [
              {
                "@type": "Restaurant",
                "name": "Grand Place Dining"
              },
              {
                "@type": "Hotel",
                "name": "Grand Place Hotel",
                "address": {
                  "@type": "PostalAddress",
                  "streetAddress": "Central Avenue 1",
                  "addressLocality": "Shanghai"
                }
              }
            ]
          }
        </script>
      </head>
      <body>
        <p>A hotel with signature dining.</p>
      </body>
    </html>
  `;

  const result = await extractRestaurantDraftFromSource("https://example.com/grand-place", {
    fetchImpl: async () => createHtmlResponse(html, "https://example.com/grand-place"),
  });

  assert.equal(result.status, "fallback");
  assert.match(result.reason, /不会静默改写分类|手动确认/);
});

test("falls back when attraction and hotel structured data are both strong", async () => {
  const html = `
    <html>
      <head>
        <title>Skyline Destination</title>
        <script type="application/ld+json">
          {
            "@context": "https://schema.org",
            "@graph": [
              {
                "@type": "TouristAttraction",
                "name": "Skyline Observation Deck"
              },
              {
                "@type": "Hotel",
                "name": "Skyline Hotel",
                "address": {
                  "@type": "PostalAddress",
                  "streetAddress": "Tower Road 1",
                  "addressLocality": "Shanghai"
                }
              }
            ]
          }
        </script>
      </head>
      <body>
        <p>Observation deck above the hotel lobby.</p>
      </body>
    </html>
  `;

  const result = await extractRestaurantDraftFromSource("https://example.com/skyline-destination", {
    fetchImpl: async () => createHtmlResponse(html, "https://example.com/skyline-destination"),
  });

  assert.equal(result.status, "fallback");
  assert.match(result.reason, /不会静默改写分类|手动确认/);
});

test("falls back when attraction and restaurant structured data are both strong", async () => {
  const html = `
    <html>
      <head>
        <title>Old Town Complex</title>
        <script type="application/ld+json">
          {
            "@context": "https://schema.org",
            "@graph": [
              {
                "@type": "TouristAttraction",
                "name": "Old Town Gate"
              },
              {
                "@type": "Restaurant",
                "name": "Old Town Kitchen"
              }
            ]
          }
        </script>
      </head>
      <body>
        <p>Historic gate with dining nearby.</p>
      </body>
    </html>
  `;

  const result = await extractRestaurantDraftFromSource("https://example.com/old-town-complex", {
    fetchImpl: async () => createHtmlResponse(html, "https://example.com/old-town-complex"),
  });

  assert.equal(result.status, "fallback");
  assert.match(result.reason, /不会静默改写分类|手动确认/);
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
