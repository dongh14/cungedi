import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { personalOnlyPrivacy } from "./constants.ts";
import { buildRestaurantInsertPayload, buildRestaurantUpdatePayload } from "./record-payloads.ts";
import { buildRestaurantDraftInput, getInitialDraftFormValues } from "./review-form.ts";

const root = process.cwd();
const read = (path: string) => readFileSync(`${root}/${path}`, "utf8");

test("personal-only save boundaries always use private privacy", () => {
  assert.equal(personalOnlyPrivacy, "private");

  const insertPayload = buildRestaurantInsertPayload("user-1", {
    name: "示例地点",
    city: "上海",
    sourceUrl: "https://example.com/place",
    privacy: "public",
    category: "美食",
    address: null,
    cuisine: null,
    note: null,
  });
  const updatePayload = buildRestaurantUpdatePayload({
    id: 1,
    privacy: "public",
    category: "美食",
    cuisine: null,
    note: null,
  });
  const reviewValues = getInitialDraftFormValues(
    { source_url: "https://example.com/place", privacy: "public" },
    "https://example.com/place",
  );
  const draftInput = buildRestaurantDraftInput(
    {
      name: "示例地点",
      city: "上海",
      source_input: "https://example.com/place",
      privacy: "public",
      category: "美食",
      address: "",
      cuisine: "",
      note: "",
    },
    "https://example.com/place",
  );

  assert.equal(insertPayload.privacy, "private");
  assert.equal(updatePayload.privacy, "private");
  assert.equal(reviewValues.privacy, "private");
  assert.equal(draftInput.privacy, "private");
});

test("new, review, and edit forms have no privacy selector", () => {
  assert.doesNotMatch(read("components/restaurant-form-fields.tsx"), /name="privacy"/u);
  assert.doesNotMatch(read("components/restaurant-edit-form-card.tsx"), /name="privacy"/u);
  assert.doesNotMatch(read("components/extraction-confirmation-card.tsx"), /name="privacy"/u);
});

test("normal place pages do not render public or private badges", () => {
  assert.doesNotMatch(read("components/restaurant-list-card.tsx"), /仅自己可见|标记为公开/u);
  assert.doesNotMatch(read("app/restaurants/[id]/page.tsx"), /可见范围|privacyLabel/u);
  assert.doesNotMatch(read("lib/restaurants/place-details.ts"), /privacyLabel/u);
});

test("place and collection routes remain authenticated", () => {
  for (const route of [
    "app/dashboard/page.tsx",
    "app/map/page.tsx",
    "app/collections/page.tsx",
    "app/restaurants/page.tsx",
    "app/restaurants/new/page.tsx",
    "app/restaurants/review/page.tsx",
    "app/restaurants/[id]/page.tsx",
    "app/restaurants/[id]/edit/page.tsx",
  ]) {
    assert.match(read(route), /requireAuthenticatedUser/u, route);
  }
});

test("owner-scoped RLS remains the access boundary for places and collections", () => {
  const restaurantRls = read("supabase/migrations/20260709130000_enable_restaurants_rls.sql");
  const collectionRls = read("supabase/migrations/20260714090000_add_collections.sql");

  assert.match(restaurantRls, /to authenticated[\s\S]*auth\.uid\(\)\) = user_id/u);
  assert.match(collectionRls, /to authenticated[\s\S]*auth\.uid\(\)\) = user_id/u);
  assert.match(collectionRls, /restaurant_collections[\s\S]*collections\.user_id = \(select auth\.uid\(\)\)/u);
  assert.match(collectionRls, /restaurant_collections[\s\S]*restaurants\.user_id = \(select auth\.uid\(\)\)/u);
  assert.match(collectionRls, /revoke all on table public\.collections from public, anon/u);
  assert.match(collectionRls, /revoke all on table public\.restaurant_collections from public, anon/u);
});

