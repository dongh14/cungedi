import type {
  RestaurantInsertInput,
  RestaurantUpdateInput,
} from "./types";

export function buildRestaurantInsertPayload(
  userId: string,
  restaurant: RestaurantInsertInput,
) {
  return {
    user_id: userId,
    name: restaurant.name,
    city: restaurant.city,
    source_url: restaurant.sourceUrl,
    privacy: restaurant.privacy,
    category: restaurant.category,
    address: restaurant.address,
    cuisine: restaurant.cuisine,
    note: restaurant.note,
  };
}

export function buildRestaurantUpdatePayload(restaurant: RestaurantUpdateInput) {
  return {
    category: restaurant.category,
    cuisine: restaurant.cuisine,
    note: restaurant.note,
    privacy: restaurant.privacy,
  };
}
