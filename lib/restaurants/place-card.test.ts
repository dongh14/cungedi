import assert from "node:assert/strict";
import test from "node:test";
import { getPlaceCardDisplayData } from "./place-card.ts";

const basePlace = {
  id: 7,
  name: "Blue Bottle Coffee",
  city: "东京",
  category: "美食" as const,
  source_url: "https://example.com/blue-bottle",
};

test("place card data includes an available image and collection badges", () => {
  const card = getPlaceCardDisplayData({
    ...basePlace,
    imageUrl: "https://example.com/blue-bottle.jpg",
    collections: [
      { id: 1, name: "Coffee" },
      { id: 1, name: "Coffee" },
    ],
  });

  assert.equal(card.hasImage, true);
  assert.equal(card.imageUrl, "https://example.com/blue-bottle.jpg");
  assert.deepEqual(card.collectionBadges, [{ id: 1, name: "Coffee" }]);
});

test("place card data uses a clean placeholder state without an image", () => {
  const card = getPlaceCardDisplayData({ ...basePlace });

  assert.equal(card.hasImage, false);
  assert.equal(card.imageUrl, null);
  assert.deepEqual(card.collectionBadges, []);
});

test("place card data keeps the core fields and detail target", () => {
  const card = getPlaceCardDisplayData({ ...basePlace });

  assert.equal(card.name, "Blue Bottle Coffee");
  assert.equal(card.city, "东京");
  assert.equal(card.category, "美食");
  assert.equal(card.detailHref, "/restaurants/7");
  assert.equal(card.sourceHost, "example.com");
});
