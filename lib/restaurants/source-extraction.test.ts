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

test("infers 酒吧 from explicit bar aliases without matching false-positive words", () => {
  for (const text of ["Cocktail Bar", "鸡尾酒吧", "ワインバー"]) {
    assert.equal(
      inferCuisineFromSourceContent({ title: text, description: "" }).cuisine,
      "酒吧",
    );
  }

  assert.equal(
    inferCuisineFromSourceContent({ title: "Toolbar", description: "" }).cuisine,
    null,
  );
  assert.equal(
    inferCuisineFromSourceContent({ title: "Noodle Bar", description: "Restaurant" }).cuisine,
    "面馆",
  );
});

test("automatically classifies explicit cocktail-bar source evidence as 美食 · 酒吧", async () => {
  const html = `
    <html>
      <head>
        <title>Devie Cocktail Bar</title>
        <meta name="description" content="A cocktail bar in Paris with seasonal drinks." />
        <script type="application/ld+json">
          {
            "@context": "https://schema.org",
            "@type": "Restaurant",
            "name": "Devie",
            "servesCuisine": "French",
            "address": {
              "@type": "PostalAddress",
              "streetAddress": "Rue Saint-Sauveur 1",
              "addressLocality": "Paris"
            }
          }
        </script>
      </head>
      <body><p>Seasonal cocktails and a compact neighborhood bar.</p></body>
    </html>
  `;
  const result = await extractRestaurantDraftFromSource("https://example.com/devie", {
    fetchImpl: async () => createHtmlResponse(html, "https://example.com/devie"),
  });

  assert.equal(result.status, "success");
  if (result.status !== "success") {
    return;
  }

  assert.equal(result.candidate.category, "美食");
  assert.equal(result.candidate.fields.cuisine.value, "酒吧");
});

function renderDevFixtureHtml(input: {
  metadataTitle: string;
  metadataDescription: string;
  ogTitle: string;
  ogDescription: string;
  pageTitle: string;
  pageDescription: string;
  body: string[];
  jsonLd: Record<string, unknown> | Array<Record<string, unknown>>;
}) {
  return `
    <html>
      <head>
        <title>${input.metadataTitle}</title>
        <meta name="description" content="${input.metadataDescription}" />
        <meta property="og:title" content="${input.ogTitle}" />
        <meta property="og:description" content="${input.ogDescription}" />
        <script type="application/ld+json">
          ${JSON.stringify(input.jsonLd)}
        </script>
      </head>
      <body>
        <main>
          <div>
            <p>Development/Test Only</p>
            <h1>${input.pageTitle}</h1>
            <p>${input.pageDescription}</p>
            <p>这个页面只用于本地开发时做确定性提取验证。请把当前 localhost URL 粘贴进地点保存入口，继续走真实的 Step 11 / Step 12 提取与确认流程。</p>
          </div>
          <section>
            ${input.body.map((paragraph) => `<p>${paragraph}</p>`).join("")}
          </section>
        </main>
      </body>
    </html>
  `;
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
  assert.equal(result.candidate.fields.cuisine.value, "咖啡馆");
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

test("accepts a ShoppingCenter JSON-LD page as a 购物 candidate", async () => {
  const html = `
    <html>
      <head>
        <title>Harbor Mall</title>
        <meta
          name="description"
          content="A waterfront mall with retail, cafés and weekend browsing."
        />
        <script type="application/ld+json">
          {
            "@context": "https://schema.org",
            "@type": "ShoppingCenter",
            "name": "Harbor Mall",
            "address": {
              "@type": "PostalAddress",
              "streetAddress": "海港路 188 号",
              "addressLocality": "厦门"
            }
          }
        </script>
      </head>
      <body>
        <main>
          <h1>Harbor Mall</h1>
          <p>A waterfront mall with retail, cafés and weekend browsing.</p>
          <p>Visitors usually come here for seasonal pop-ups, relaxed browsing and a straightforward indoor mall experience.</p>
        </main>
      </body>
    </html>
  `;

  const result = await extractRestaurantDraftFromSource("https://example.com/harbor-mall", {
    fetchImpl: async () => createHtmlResponse(html, "https://example.com/harbor-mall"),
  });

  assert.equal(result.status, "success");

  if (result.status !== "success") {
    return;
  }

  assert.equal(result.candidate.category, "购物");
  assert.equal(result.candidate.fields.city.value, "厦门");
  assert.equal(result.candidate.fields.cuisine.value, "商场");
});

test("infers 书店 from BookStore structured data", async () => {
  const html = `
    <html>
      <head>
        <title>Page One Bookstore</title>
        <script type="application/ld+json">
          {
            "@context": "https://schema.org",
            "@type": "BookStore",
            "name": "Page One Bookstore",
            "address": {
              "@type": "PostalAddress",
              "streetAddress": "南京西路 999 号",
              "addressLocality": "上海"
            }
          }
        </script>
      </head>
      <body>
        <p>Books, magazines and stationery.</p>
      </body>
    </html>
  `;

  const result = await extractRestaurantDraftFromSource("https://example.com/page-one", {
    fetchImpl: async () => createHtmlResponse(html, "https://example.com/page-one"),
  });

  assert.equal(result.status, "success");

  if (result.status !== "success") {
    return;
  }

  assert.equal(result.candidate.category, "购物");
  assert.equal(result.candidate.fields.cuisine.value, "书店");
});

test("infers 服装店 from ClothingStore structured data", async () => {
  const html = `
    <html>
      <head>
        <title>Archive Wardrobe</title>
        <script type="application/ld+json">
          {
            "@context": "https://schema.org",
            "@type": "ClothingStore",
            "name": "Archive Wardrobe",
            "address": {
              "@type": "PostalAddress",
              "streetAddress": "延安中路 88 号",
              "addressLocality": "上海"
            }
          }
        </script>
      </head>
      <body>
        <p>Curated fashion labels.</p>
      </body>
    </html>
  `;

  const result = await extractRestaurantDraftFromSource("https://example.com/archive-wardrobe", {
    fetchImpl: async () => createHtmlResponse(html, "https://example.com/archive-wardrobe"),
  });

  assert.equal(result.status, "success");

  if (result.status !== "success") {
    return;
  }

  assert.equal(result.candidate.category, "购物");
  assert.equal(result.candidate.fields.cuisine.value, "服装店");
});

test("infers 超市 from GroceryStore structured data", async () => {
  const html = `
    <html>
      <head>
        <title>Fresh Basket Market</title>
        <script type="application/ld+json">
          {
            "@context": "https://schema.org",
            "@type": "GroceryStore",
            "name": "Fresh Basket Market",
            "address": {
              "@type": "PostalAddress",
              "streetAddress": "福州路 66 号",
              "addressLocality": "上海"
            }
          }
        </script>
      </head>
      <body>
        <p>Fresh produce and pantry staples.</p>
      </body>
    </html>
  `;

  const result = await extractRestaurantDraftFromSource("https://example.com/fresh-basket", {
    fetchImpl: async () => createHtmlResponse(html, "https://example.com/fresh-basket"),
  });

  assert.equal(result.status, "success");

  if (result.status !== "success") {
    return;
  }

  assert.equal(result.candidate.category, "购物");
  assert.equal(result.candidate.fields.cuisine.value, "超市");
});

test("infers 便利店 from ConvenienceStore structured data", async () => {
  const html = `
    <html>
      <head>
        <title>City Corner</title>
        <script type="application/ld+json">
          {
            "@context": "https://schema.org",
            "@type": "ConvenienceStore",
            "name": "City Corner",
            "address": {
              "@type": "PostalAddress",
              "streetAddress": "人民路 12 号",
              "addressLocality": "成都"
            }
          }
        </script>
      </head>
      <body>
        <p>Snacks and essentials around the clock.</p>
      </body>
    </html>
  `;

  const result = await extractRestaurantDraftFromSource("https://example.com/city-corner", {
    fetchImpl: async () => createHtmlResponse(html, "https://example.com/city-corner"),
  });

  assert.equal(result.status, "success");

  if (result.status !== "success") {
    return;
  }

  assert.equal(result.candidate.category, "购物");
  assert.equal(result.candidate.fields.cuisine.value, "便利店");
});

test("accepts a generic Store with blank subtype when subtype evidence is weak", async () => {
  const html = `
    <html>
      <head>
        <title>Studio Market</title>
        <script type="application/ld+json">
          {
            "@context": "https://schema.org",
            "@type": "Store",
            "name": "Studio Market",
            "address": {
              "@type": "PostalAddress",
              "streetAddress": "复兴中路 18 号",
              "addressLocality": "上海"
            }
          }
        </script>
        <meta name="description" content="A neighborhood retail space." />
      </head>
      <body>
        <p>Open daily.</p>
      </body>
    </html>
  `;

  const result = await extractRestaurantDraftFromSource("https://example.com/studio-market", {
    fetchImpl: async () => createHtmlResponse(html, "https://example.com/studio-market"),
  });

  assert.equal(result.status, "success");

  if (result.status !== "success") {
    return;
  }

  assert.equal(result.candidate.category, "购物");
  assert.equal(result.candidate.fields.cuisine.value, null);
});

test("infers 电影院 from MovieTheater structured data", async () => {
  const html = `
    <html>
      <head>
        <title>Skyline Cinema</title>
        <script type="application/ld+json">
          {
            "@context": "https://schema.org",
            "@type": "MovieTheater",
            "name": "Skyline Cinema",
            "address": {
              "@type": "PostalAddress",
              "streetAddress": "长宁路 88 号",
              "addressLocality": "上海"
            }
          }
        </script>
      </head>
      <body>
        <p>Daily screenings and weekend movie nights.</p>
      </body>
    </html>
  `;

  const result = await extractRestaurantDraftFromSource("https://example.com/skyline-cinema", {
    fetchImpl: async () => createHtmlResponse(html, "https://example.com/skyline-cinema"),
  });

  assert.equal(result.status, "success");

  if (result.status !== "success") {
    return;
  }

  assert.equal(result.candidate.category, "玩乐");
  assert.equal(result.candidate.fields.cuisine.value, "电影院");
});

test("does not infer 酒吧 from NightClub structured data without explicit bar wording", async () => {
  const html = `
    <html>
      <head>
        <title>Moonrise Club</title>
        <script type="application/ld+json">
          {
            "@context": "https://schema.org",
            "@type": "NightClub",
            "name": "Moonrise Club",
            "address": {
              "@type": "PostalAddress",
              "streetAddress": "永康路 6 号",
              "addressLocality": "上海"
            }
          }
        </script>
      </head>
      <body>
        <p>Late-night music and cocktails.</p>
      </body>
    </html>
  `;

  const result = await extractRestaurantDraftFromSource("https://example.com/moonrise-club", {
    fetchImpl: async () => createHtmlResponse(html, "https://example.com/moonrise-club"),
  });

  assert.equal(result.status, "success");

  if (result.status !== "success") {
    return;
  }

  assert.equal(result.candidate.category, "玩乐");
  assert.equal(result.candidate.fields.cuisine.value, null);
});

test("infers 保龄球馆 from BowlingAlley structured data", async () => {
  const html = `
    <html>
      <head>
        <title>Strike Lane</title>
        <script type="application/ld+json">
          {
            "@context": "https://schema.org",
            "@type": "BowlingAlley",
            "name": "Strike Lane",
            "address": {
              "@type": "PostalAddress",
              "streetAddress": "新华路 30 号",
              "addressLocality": "杭州"
            }
          }
        </script>
      </head>
      <body>
        <p>Casual bowling for groups and families.</p>
      </body>
    </html>
  `;

  const result = await extractRestaurantDraftFromSource("https://example.com/strike-lane", {
    fetchImpl: async () => createHtmlResponse(html, "https://example.com/strike-lane"),
  });

  assert.equal(result.status, "success");

  if (result.status !== "success") {
    return;
  }

  assert.equal(result.candidate.category, "玩乐");
  assert.equal(result.candidate.fields.cuisine.value, "保龄球馆");
});

test("infers 游乐园 from AmusementPark structured data", async () => {
  const html = `
    <html>
      <head>
        <title>Wonder Harbor Park</title>
        <script type="application/ld+json">
          {
            "@context": "https://schema.org",
            "@type": "AmusementPark",
            "name": "Wonder Harbor Park",
            "address": {
              "@type": "PostalAddress",
              "streetAddress": "海岸大道 1 号",
              "addressLocality": "青岛"
            }
          }
        </script>
      </head>
      <body>
        <p>Rides, family attractions and seaside views.</p>
      </body>
    </html>
  `;

  const result = await extractRestaurantDraftFromSource("https://example.com/wonder-harbor", {
    fetchImpl: async () => createHtmlResponse(html, "https://example.com/wonder-harbor"),
  });

  assert.equal(result.status, "success");

  if (result.status !== "success") {
    return;
  }

  assert.equal(result.candidate.category, "玩乐");
  assert.equal(result.candidate.fields.cuisine.value, "游乐园");
});

test("infers 运动场馆 from SportsActivityLocation structured data", async () => {
  const html = `
    <html>
      <head>
        <title>Pulse Arena</title>
        <script type="application/ld+json">
          {
            "@context": "https://schema.org",
            "@type": "SportsActivityLocation",
            "name": "Pulse Arena",
            "address": {
              "@type": "PostalAddress",
              "streetAddress": "滨江大道 15 号",
              "addressLocality": "深圳"
            }
          }
        </script>
      </head>
      <body>
        <p>Indoor courts and evening training sessions.</p>
      </body>
    </html>
  `;

  const result = await extractRestaurantDraftFromSource("https://example.com/pulse-arena", {
    fetchImpl: async () => createHtmlResponse(html, "https://example.com/pulse-arena"),
  });

  assert.equal(result.status, "success");

  if (result.status !== "success") {
    return;
  }

  assert.equal(result.candidate.category, "玩乐");
  assert.equal(result.candidate.fields.cuisine.value, "运动场馆");
});

test("infers 剧院 from PerformingArtsTheater structured data", async () => {
  const html = `
    <html>
      <head>
        <title>Harbor Theater</title>
        <script type="application/ld+json">
          {
            "@context": "https://schema.org",
            "@type": "PerformingArtsTheater",
            "name": "Harbor Theater",
            "address": {
              "@type": "PostalAddress",
              "streetAddress": "海边路 9 号",
              "addressLocality": "厦门"
            }
          }
        </script>
      </head>
      <body>
        <p>Drama, music and contemporary stage productions.</p>
      </body>
    </html>
  `;

  const result = await extractRestaurantDraftFromSource("https://example.com/harbor-theater", {
    fetchImpl: async () => createHtmlResponse(html, "https://example.com/harbor-theater"),
  });

  assert.equal(result.status, "success");

  if (result.status !== "success") {
    return;
  }

  assert.equal(result.candidate.category, "玩乐");
  assert.equal(result.candidate.fields.cuisine.value, "剧院");
});

test("accepts a generic EntertainmentBusiness with blank subtype when subtype evidence is weak", async () => {
  const html = `
    <html>
      <head>
        <title>Playfield Hub</title>
        <script type="application/ld+json">
          {
            "@context": "https://schema.org",
            "@type": "EntertainmentBusiness",
            "name": "Playfield Hub",
            "address": {
              "@type": "PostalAddress",
              "streetAddress": "中山路 66 号",
              "addressLocality": "苏州"
            }
          }
        </script>
        <meta name="description" content="An indoor entertainment venue for casual group outings." />
      </head>
      <body>
        <p>Relaxed evening plans and group hangouts.</p>
      </body>
    </html>
  `;

  const result = await extractRestaurantDraftFromSource("https://example.com/playfield-hub", {
    fetchImpl: async () => createHtmlResponse(html, "https://example.com/playfield-hub"),
  });

  assert.equal(result.status, "success");

  if (result.status !== "success") {
    return;
  }

  assert.equal(result.candidate.category, "玩乐");
  assert.equal(result.candidate.fields.cuisine.value, null);
});

test("accepts a strong single Place with a reliable address as 其他", async () => {
  const html = `
    <html>
      <head>
        <title>Harbor Service Center</title>
        <meta
          name="description"
          content="Harbor Service Center offers visitor support near the ferry pier."
        />
        <script type="application/ld+json">
          {
            "@context": "https://schema.org",
            "@type": "Place",
            "name": "Harbor Service Center",
            "address": {
              "@type": "PostalAddress",
              "streetAddress": "海港路 10 号",
              "addressLocality": "厦门"
            }
          }
        </script>
      </head>
      <body>
        <p>Visitor help desk and route guidance near the terminal.</p>
      </body>
    </html>
  `;

  const result = await extractRestaurantDraftFromSource("https://example.com/harbor-service", {
    fetchImpl: async () => createHtmlResponse(html, "https://example.com/harbor-service"),
  });

  assert.equal(result.status, "success");

  if (result.status !== "success") {
    return;
  }

  assert.equal(result.candidate.category, "其他");
  assert.equal(result.candidate.fields.name.value, "Harbor Service Center");
  assert.equal(result.candidate.fields.city.value, "厦门");
  assert.equal(result.candidate.fields.address.value, "海港路 10 号, 厦门");
  assert.equal(result.candidate.fields.cuisine.value, "服务中心");
});

test("accepts a strong LocalBusiness with a reliable city and address as 其他", async () => {
  const html = `
    <html>
      <head>
        <title>North Pier Visitor Hub</title>
        <meta
          name="description"
          content="North Pier Visitor Hub provides assistance for arrivals in Qingdao."
        />
        <script type="application/ld+json">
          {
            "@context": "https://schema.org",
            "@type": "LocalBusiness",
            "name": "North Pier Visitor Hub",
            "address": {
              "@type": "PostalAddress",
              "streetAddress": "海滨路 20 号",
              "addressLocality": "青岛"
            }
          }
        </script>
      </head>
      <body>
        <p>Arrival support, lockers and route guidance.</p>
      </body>
    </html>
  `;

  const result = await extractRestaurantDraftFromSource("https://example.com/north-pier-hub", {
    fetchImpl: async () => createHtmlResponse(html, "https://example.com/north-pier-hub"),
  });

  assert.equal(result.status, "success");

  if (result.status !== "success") {
    return;
  }

  assert.equal(result.candidate.category, "其他");
  assert.equal(result.candidate.fields.city.value, "青岛");
  assert.equal(result.candidate.fields.address.value, "海滨路 20 号, 青岛");
});

test("falls back for Place structured data without reliable address or city evidence", async () => {
  const html = `
    <html>
      <head>
        <title>Harbor Marker</title>
        <script type="application/ld+json">
          {
            "@context": "https://schema.org",
            "@type": "Place",
            "name": "Harbor Marker"
          }
        </script>
      </head>
      <body>
        <p>A saved place marker for later review.</p>
      </body>
    </html>
  `;

  const result = await extractRestaurantDraftFromSource("https://example.com/harbor-marker", {
    fetchImpl: async () => createHtmlResponse(html, "https://example.com/harbor-marker"),
  });

  assert.equal(result.status, "fallback");
});

test("falls back for generic LocalBusiness alone when reliable location evidence is missing", async () => {
  const html = `
    <html>
      <head>
        <title>Visitor Hub</title>
        <script type="application/ld+json">
          {
            "@context": "https://schema.org",
            "@type": "LocalBusiness",
            "name": "Visitor Hub"
          }
        </script>
      </head>
      <body>
        <p>Plan your stop here.</p>
      </body>
    </html>
  `;

  const result = await extractRestaurantDraftFromSource("https://example.com/visitor-hub", {
    fetchImpl: async () => createHtmlResponse(html, "https://example.com/visitor-hub"),
  });

  assert.equal(result.status, "fallback");
});

test("falls back for a generic place directory page", async () => {
  const html = `
    <html>
      <head>
        <title>Service Center Directory</title>
        <meta
          name="description"
          content="Browse all service centers and visitor hubs across the city."
        />
        <script type="application/ld+json">
          [
            {
              "@context": "https://schema.org",
              "@type": "Place",
              "name": "East Service Center",
              "address": {
                "@type": "PostalAddress",
                "streetAddress": "东一路 8 号",
                "addressLocality": "上海"
              }
            },
            {
              "@context": "https://schema.org",
              "@type": "Place",
              "name": "West Service Center",
              "address": {
                "@type": "PostalAddress",
                "streetAddress": "西一路 18 号",
                "addressLocality": "上海"
              }
            }
          ]
        </script>
      </head>
      <body>
        <p>All locations</p>
        <p>East Service Center</p>
        <p>West Service Center</p>
      </body>
    </html>
  `;

  const result = await extractRestaurantDraftFromSource("https://example.com/service-directory", {
    fetchImpl: async () => createHtmlResponse(html, "https://example.com/service-directory"),
  });

  assert.equal(result.status, "fallback");
  assert.equal(result.pageType, "restaurant_list");
});

test("falls back when generic place evidence and strong restaurant evidence both appear", async () => {
  const html = `
    <html>
      <head>
        <title>Harbor Hall & Noodle Bar</title>
        <script type="application/ld+json">
          [
            {
              "@context": "https://schema.org",
              "@type": "Place",
              "name": "Harbor Hall",
              "address": {
                "@type": "PostalAddress",
                "streetAddress": "港湾路 1 号",
                "addressLocality": "上海"
              }
            },
            {
              "@context": "https://schema.org",
              "@type": "Restaurant",
              "name": "Noodle Bar",
              "address": {
                "@type": "PostalAddress",
                "streetAddress": "港湾路 1 号",
                "addressLocality": "上海"
              }
            }
          ]
        </script>
      </head>
      <body>
        <p>A hall with an attached restaurant.</p>
      </body>
    </html>
  `;

  const result = await extractRestaurantDraftFromSource("https://example.com/harbor-hall", {
    fetchImpl: async () => createHtmlResponse(html, "https://example.com/harbor-hall"),
  });

  assert.equal(result.status, "fallback");
});

test("keeps generic-place subtype blank when the label is vague marketing text", async () => {
  const html = `
    <html>
      <head>
        <title>Open Hub</title>
        <meta
          name="description"
          content="Open Hub is a flexible space for arrivals and everyday convenience."
        />
        <script type="application/ld+json">
          {
            "@context": "https://schema.org",
            "@type": "Place",
            "name": "Open Hub",
            "address": {
              "@type": "PostalAddress",
              "streetAddress": "江边路 9 号",
              "addressLocality": "武汉"
            }
          }
        </script>
      </head>
      <body>
        <p>A flexible, welcoming place for all kinds of city moments.</p>
      </body>
    </html>
  `;

  const result = await extractRestaurantDraftFromSource("https://example.com/open-hub", {
    fetchImpl: async () => createHtmlResponse(html, "https://example.com/open-hub"),
  });

  assert.equal(result.status, "success");

  if (result.status !== "success") {
    return;
  }

  assert.equal(result.candidate.category, "其他");
  assert.equal(result.candidate.fields.cuisine.value, null);
});

test("matches the live generic-place fixture shape and succeeds as 其他", async () => {
  const html = renderDevFixtureHtml({
    metadataTitle: "DEV ONLY Generic Place Fixture",
    metadataDescription:
      "Development-only extraction fixture for a successful generic Place candidate.",
    ogTitle: "Harbor Service Center",
    ogDescription: "A single visitor support point near the ferry terminal.",
    pageTitle: "Harbor Service Center",
    pageDescription: "A single visitor support point near the ferry terminal.",
    body: [
      "Harbor Service Center focuses on route guidance, baggage help and simple arrival support for one specific point of interest.",
      "The page is intentionally category-neutral so Step 3E can accept it only as a conservative 其他 candidate.",
    ],
    jsonLd: {
      "@context": "https://schema.org",
      "@type": "Place",
      name: "Harbor Service Center",
      description: "A single visitor support point near the ferry terminal.",
      url: "http://localhost:3000/dev-fixtures/extraction/generic-place",
      address: {
        "@type": "PostalAddress",
        streetAddress: "海港路 10 号",
        addressLocality: "厦门",
      },
    },
  });

  const result = await extractRestaurantDraftFromSource("https://example.com/live-generic-place", {
    fetchImpl: async () => createHtmlResponse(html, "https://example.com/live-generic-place"),
  });

  assert.equal(result.status, "success");

  if (result.status !== "success") {
    return;
  }

  assert.equal(result.candidate.category, "其他");
  assert.equal(result.candidate.fields.cuisine.value, "服务中心");
});

test("matches the live generic-local-business fixture shape and succeeds as 其他", async () => {
  const html = renderDevFixtureHtml({
    metadataTitle: "DEV ONLY Generic LocalBusiness Fixture",
    metadataDescription:
      "Development-only extraction fixture for a successful generic LocalBusiness candidate.",
    ogTitle: "North Pier Visitor Hub",
    ogDescription: "Arrival assistance and route guidance at one specific harbor point.",
    pageTitle: "North Pier Visitor Hub",
    pageDescription: "Arrival assistance and route guidance at one specific harbor point.",
    body: [
      "North Pier Visitor Hub provides lockers, help-desk service and printed route information for one arrival area.",
      "The copy avoids shopping, dining, lodging and entertainment labels so the extractor keeps this in the conservative 其他 path.",
    ],
    jsonLd: {
      "@context": "https://schema.org",
      "@type": "LocalBusiness",
      name: "North Pier Visitor Hub",
      description: "Arrival assistance and route guidance at one specific harbor point.",
      url: "http://localhost:3000/dev-fixtures/extraction/generic-local-business",
      address: {
        "@type": "PostalAddress",
        streetAddress: "海滨路 20 号",
        addressLocality: "青岛",
      },
    },
  });

  const result = await extractRestaurantDraftFromSource(
    "https://example.com/live-generic-local-business",
    {
      fetchImpl: async () =>
        createHtmlResponse(html, "https://example.com/live-generic-local-business"),
    },
  );

  assert.equal(result.status, "success");

  if (result.status !== "success") {
    return;
  }

  assert.equal(result.candidate.category, "其他");
  assert.equal(result.candidate.fields.cuisine.value, null);
});

test("matches the live missing-location fixture shape and falls back", async () => {
  const html = renderDevFixtureHtml({
    metadataTitle: "DEV ONLY Generic Place Missing Location Fixture",
    metadataDescription:
      "Development-only extraction fixture for a generic Place fallback without reliable location evidence.",
    ogTitle: "Harbor Marker",
    ogDescription: "A placeholder marker with no reliable city or address evidence.",
    pageTitle: "Harbor Marker",
    pageDescription: "A placeholder marker with no reliable city or address evidence.",
    body: [
      "This page intentionally omits any reliable city or precise location information.",
      "Step 3E should therefore fall back instead of creating an automatic 其他 draft.",
    ],
    jsonLd: {
      "@context": "https://schema.org",
      "@type": "Place",
      name: "Harbor Marker",
      description: "A placeholder marker with no reliable city or address evidence.",
      url: "http://localhost:3000/dev-fixtures/extraction/generic-place-missing-location",
    },
  });

  const result = await extractRestaurantDraftFromSource(
    "https://example.com/live-generic-place-missing-location",
    {
      fetchImpl: async () =>
        createHtmlResponse(html, "https://example.com/live-generic-place-missing-location"),
    },
  );

  assert.equal(result.status, "fallback");
});

test("matches the live generic-directory fixture shape and falls back", async () => {
  const html = renderDevFixtureHtml({
    metadataTitle: "DEV ONLY Generic Directory Fixture",
    metadataDescription:
      "Development-only extraction fixture for a generic directory fallback.",
    ogTitle: "Service Center Directory",
    ogDescription: "Browse all service centers and visitor hubs across the city.",
    pageTitle: "Service Center Directory",
    pageDescription: "Browse all service centers and visitor hubs across the city.",
    body: [
      "All locations",
      "East Service Center and West Service Center are shown together on purpose so the extractor treats this as a directory page.",
    ],
    jsonLd: [
      {
        "@context": "https://schema.org",
        "@type": "Place",
        name: "East Service Center",
        address: {
          "@type": "PostalAddress",
          streetAddress: "东一路 8 号",
          addressLocality: "上海",
        },
      },
      {
        "@context": "https://schema.org",
        "@type": "Place",
        name: "West Service Center",
        address: {
          "@type": "PostalAddress",
          streetAddress: "西一路 18 号",
          addressLocality: "上海",
        },
      },
    ],
  });

  const result = await extractRestaurantDraftFromSource(
    "https://example.com/live-generic-directory",
    {
      fetchImpl: async () => createHtmlResponse(html, "https://example.com/live-generic-directory"),
    },
  );

  assert.equal(result.status, "fallback");
  assert.equal(result.pageType, "restaurant_list");
});

test("matches the live mixed generic-plus-restaurant fixture shape and falls back", async () => {
  const html = renderDevFixtureHtml({
    metadataTitle: "DEV ONLY Mixed Generic Restaurant Fixture",
    metadataDescription:
      "Development-only extraction fixture for mixed generic-place and restaurant evidence fallback.",
    ogTitle: "Harbor Hall & Noodle Bar",
    ogDescription: "A hall with an attached restaurant and mixed structured data.",
    pageTitle: "Harbor Hall & Noodle Bar",
    pageDescription: "A hall with an attached restaurant and mixed structured data.",
    body: [
      "The page intentionally mixes a generic place record with a restaurant record.",
      "Step 3E should fall back rather than silently picking 其他 or 美食.",
    ],
    jsonLd: [
      {
        "@context": "https://schema.org",
        "@type": "Place",
        name: "Harbor Hall",
        address: {
          "@type": "PostalAddress",
          streetAddress: "港湾路 1 号",
          addressLocality: "上海",
        },
      },
      {
        "@context": "https://schema.org",
        "@type": "Restaurant",
        name: "Noodle Bar",
        address: {
          "@type": "PostalAddress",
          streetAddress: "港湾路 1 号",
          addressLocality: "上海",
        },
      },
    ],
  });

  const result = await extractRestaurantDraftFromSource(
    "https://example.com/live-mixed-generic-restaurant",
    {
      fetchImpl: async () =>
        createHtmlResponse(html, "https://example.com/live-mixed-generic-restaurant"),
    },
  );

  assert.equal(result.status, "fallback");
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

test("falls back when generic LocalBusiness is the only shopping-like evidence", async () => {
  const html = `
    <html>
      <head>
        <title>Moonlight Shop</title>
        <script type="application/ld+json">
          {
            "@context": "https://schema.org",
            "@type": "LocalBusiness",
            "name": "Moonlight Shop",
            "address": {
              "@type": "PostalAddress",
              "streetAddress": "天府大道 8 号",
              "addressLocality": "成都"
            }
          }
        </script>
      </head>
      <body>
        <p>Independent shop for daily picks.</p>
      </body>
    </html>
  `;

  const result = await extractRestaurantDraftFromSource("https://example.com/moonlight-shop", {
    fetchImpl: async () => createHtmlResponse(html, "https://example.com/moonlight-shop"),
  });

  assert.equal(result.status, "fallback");
});

test("falls back when generic LocalBusiness is the only entertainment-like evidence", async () => {
  const html = `
    <html>
      <head>
        <title>Night KTV Hub</title>
        <script type="application/ld+json">
          {
            "@context": "https://schema.org",
            "@type": "LocalBusiness",
            "name": "Night KTV Hub",
            "address": {
              "@type": "PostalAddress",
              "streetAddress": "解放路 18 号",
              "addressLocality": "长沙"
            }
          }
        </script>
        <meta name="description" content="Private karaoke rooms and late-night KTV sessions." />
      </head>
      <body>
        <p>Private karaoke rooms for group KTV nights.</p>
      </body>
    </html>
  `;

  const result = await extractRestaurantDraftFromSource("https://example.com/night-ktv-hub", {
    fetchImpl: async () => createHtmlResponse(html, "https://example.com/night-ktv-hub"),
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

test("keeps shopping subtype blank when confidence is low", async () => {
  const html = `
    <html>
      <head>
        <title>North Gate Store</title>
        <script type="application/ld+json">
          {
            "@context": "https://schema.org",
            "@type": "Store",
            "name": "North Gate Store",
            "address": {
              "@type": "PostalAddress",
              "streetAddress": "北门路 5 号",
              "addressLocality": "苏州"
            }
          }
        </script>
        <meta name="description" content="Retail goods and neighborhood essentials." />
      </head>
      <body>
        <p>Everyday shopping in the old town.</p>
      </body>
    </html>
  `;

  const result = await extractRestaurantDraftFromSource("https://example.com/north-gate-store", {
    fetchImpl: async () => createHtmlResponse(html, "https://example.com/north-gate-store"),
  });

  assert.equal(result.status, "success");

  if (result.status !== "success") {
    return;
  }

  assert.equal(result.candidate.category, "购物");
  assert.equal(result.candidate.fields.cuisine.value, null);
});

test("keeps entertainment subtype blank when confidence is low", async () => {
  const html = `
    <html>
      <head>
        <title>Evening Playhouse</title>
        <script type="application/ld+json">
          {
            "@context": "https://schema.org",
            "@type": "EntertainmentBusiness",
            "name": "Evening Playhouse",
            "address": {
              "@type": "PostalAddress",
              "streetAddress": "城中路 12 号",
              "addressLocality": "南京"
            }
          }
        </script>
        <meta name="description" content="An indoor venue for relaxed social outings." />
      </head>
      <body>
        <p>Casual evening entertainment in the city center.</p>
      </body>
    </html>
  `;

  const result = await extractRestaurantDraftFromSource("https://example.com/evening-playhouse", {
    fetchImpl: async () => createHtmlResponse(html, "https://example.com/evening-playhouse"),
  });

  assert.equal(result.status, "success");

  if (result.status !== "success") {
    return;
  }

  assert.equal(result.candidate.category, "玩乐");
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

test("falls back for a shopping directory or list page", async () => {
  const html = `
    <html>
      <head>
        <title>Stores | Harbor Mall</title>
        <meta name="description" content="Browse brands, stores and shopping categories." />
        <script type="application/ld+json">
          {
            "@context": "https://schema.org",
            "@graph": [
              {
                "@type": "Store",
                "name": "North Wing Store",
                "address": {
                  "@type": "PostalAddress",
                  "streetAddress": "Mall Road 1",
                  "addressLocality": "Xiamen"
                }
              },
              {
                "@type": "BookStore",
                "name": "Books Plaza",
                "address": {
                  "@type": "PostalAddress",
                  "streetAddress": "Mall Road 2",
                  "addressLocality": "Xiamen"
                }
              }
            ]
          }
        </script>
      </head>
      <body>
        <h1>Find a Store</h1>
        <p>Search stores by category, floor and brand.</p>
      </body>
    </html>
  `;

  const result = await extractRestaurantDraftFromSource("https://example.com/stores", {
    fetchImpl: async () => createHtmlResponse(html, "https://example.com/stores"),
  });

  assert.equal(result.status, "fallback");
  assert.equal(result.pageType, "restaurant_list");
  assert.match(result.reason, /购物目录|门店列表|搜索结果页/);
});

test("falls back for an entertainment directory or list page", async () => {
  const html = `
    <html>
      <head>
        <title>Venues | City Fun Guide</title>
        <meta name="description" content="Browse cinemas, bowling alleys and event venues across the district." />
        <script type="application/ld+json">
          {
            "@context": "https://schema.org",
            "@graph": [
              {
                "@type": "MovieTheater",
                "name": "Skyline Cinema",
                "address": {
                  "@type": "PostalAddress",
                  "streetAddress": "Central Road 1",
                  "addressLocality": "Shanghai"
                }
              },
              {
                "@type": "BowlingAlley",
                "name": "Strike Lane",
                "address": {
                  "@type": "PostalAddress",
                  "streetAddress": "Central Road 2",
                  "addressLocality": "Shanghai"
                }
              }
            ]
          }
        </script>
      </head>
      <body>
        <h1>Venues</h1>
        <p>Find a venue by neighborhood, activity type or tonight's plans.</p>
      </body>
    </html>
  `;

  const result = await extractRestaurantDraftFromSource("https://example.com/venues", {
    fetchImpl: async () => createHtmlResponse(html, "https://example.com/venues"),
  });

  assert.equal(result.status, "fallback");
  assert.equal(result.pageType, "restaurant_list");
  assert.match(result.reason, /玩乐目录|活动排期|场馆集合页/);
});

test("falls back for an event schedule page", async () => {
  const html = `
    <html>
      <head>
        <title>Show Schedule | Harbor Stage</title>
        <meta name="description" content="Check this week's performances, schedule and upcoming events at the venue." />
        <script type="application/ld+json">
          {
            "@context": "https://schema.org",
            "@type": "EventVenue",
            "name": "Harbor Stage",
            "address": {
              "@type": "PostalAddress",
              "streetAddress": "海边路 20 号",
              "addressLocality": "青岛"
            }
          }
        </script>
      </head>
      <body>
        <h1>Show Schedule</h1>
        <p>View this week's performances, lineup and upcoming events.</p>
      </body>
    </html>
  `;

  const result = await extractRestaurantDraftFromSource("https://example.com/show-schedule", {
    fetchImpl: async () => createHtmlResponse(html, "https://example.com/show-schedule"),
  });

  assert.equal(result.status, "fallback");
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

test("falls back when shopping and restaurant structured data are both strong", async () => {
  const html = `
    <html>
      <head>
        <title>City Center Complex</title>
        <script type="application/ld+json">
          {
            "@context": "https://schema.org",
            "@graph": [
              {
                "@type": "ShoppingCenter",
                "name": "City Center Mall"
              },
              {
                "@type": "Restaurant",
                "name": "City Center Kitchen"
              }
            ]
          }
        </script>
      </head>
      <body>
        <p>Shopping and dining under one roof.</p>
      </body>
    </html>
  `;

  const result = await extractRestaurantDraftFromSource("https://example.com/city-center-complex", {
    fetchImpl: async () => createHtmlResponse(html, "https://example.com/city-center-complex"),
  });

  assert.equal(result.status, "fallback");
  assert.match(result.reason, /不会静默改写分类|手动确认/);
});

test("falls back when shopping and hotel structured data are both strong", async () => {
  const html = `
    <html>
      <head>
        <title>Harbor Destination</title>
        <script type="application/ld+json">
          {
            "@context": "https://schema.org",
            "@graph": [
              {
                "@type": "ShoppingCenter",
                "name": "Harbor Galleria"
              },
              {
                "@type": "Hotel",
                "name": "Harbor Hotel",
                "address": {
                  "@type": "PostalAddress",
                  "streetAddress": "Harbor Road 8",
                  "addressLocality": "Qingdao"
                }
              }
            ]
          }
        </script>
      </head>
      <body>
        <p>Retail arcade connected to the hotel lobby.</p>
      </body>
    </html>
  `;

  const result = await extractRestaurantDraftFromSource("https://example.com/harbor-destination", {
    fetchImpl: async () => createHtmlResponse(html, "https://example.com/harbor-destination"),
  });

  assert.equal(result.status, "fallback");
  assert.match(result.reason, /不会静默改写分类|手动确认/);
});

test("falls back when entertainment and restaurant structured data are both strong", async () => {
  const html = `
    <html>
      <head>
        <title>City Night Complex</title>
        <script type="application/ld+json">
          {
            "@context": "https://schema.org",
            "@graph": [
              {
                "@type": "NightClub",
                "name": "City Night Club"
              },
              {
                "@type": "Restaurant",
                "name": "Late Supper Kitchen"
              }
            ]
          }
        </script>
      </head>
      <body>
        <p>Nightlife and late dinner in one complex.</p>
      </body>
    </html>
  `;

  const result = await extractRestaurantDraftFromSource("https://example.com/city-night-complex", {
    fetchImpl: async () => createHtmlResponse(html, "https://example.com/city-night-complex"),
  });

  assert.equal(result.status, "fallback");
  assert.match(result.reason, /不会静默改写分类|手动确认/);
});

test("falls back when entertainment and hotel structured data are both strong", async () => {
  const html = `
    <html>
      <head>
        <title>Harbor Leisure Tower</title>
        <script type="application/ld+json">
          {
            "@context": "https://schema.org",
            "@graph": [
              {
                "@type": "MovieTheater",
                "name": "Harbor Screen"
              },
              {
                "@type": "Hotel",
                "name": "Harbor Hotel",
                "address": {
                  "@type": "PostalAddress",
                  "streetAddress": "Harbor Road 8",
                  "addressLocality": "Qingdao"
                }
              }
            ]
          }
        </script>
      </head>
      <body>
        <p>Screenings above the hotel lobby.</p>
      </body>
    </html>
  `;

  const result = await extractRestaurantDraftFromSource("https://example.com/harbor-leisure-tower", {
    fetchImpl: async () => createHtmlResponse(html, "https://example.com/harbor-leisure-tower"),
  });

  assert.equal(result.status, "fallback");
  assert.match(result.reason, /不会静默改写分类|手动确认/);
});

test("falls back when entertainment and shopping structured data are both strong", async () => {
  const html = `
    <html>
      <head>
        <title>Central Leisure Plaza</title>
        <script type="application/ld+json">
          {
            "@context": "https://schema.org",
            "@graph": [
              {
                "@type": "MovieTheater",
                "name": "Central Screen"
              },
              {
                "@type": "ShoppingCenter",
                "name": "Central Mall"
              }
            ]
          }
        </script>
      </head>
      <body>
        <p>A cinema inside a shopping plaza.</p>
      </body>
    </html>
  `;

  const result = await extractRestaurantDraftFromSource("https://example.com/central-leisure-plaza", {
    fetchImpl: async () => createHtmlResponse(html, "https://example.com/central-leisure-plaza"),
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
