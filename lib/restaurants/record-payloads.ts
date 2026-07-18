import type {
  RestaurantInsertInput,
  RestaurantUpdateInput,
} from "./types";
import { normalizePlaceCategory, personalOnlyPrivacy } from "./constants.ts";

export function buildRestaurantInsertPayload(
  userId: string,
  restaurant: RestaurantInsertInput,
) {
  const category = normalizePlaceCategory(restaurant.category);

  if (!category) {
    throw new Error("分类无效，请选择一个支持的地点分类。");
  }

  return {
    user_id: userId,
    name: restaurant.name,
    city: restaurant.city,
    source_url: restaurant.sourceUrl,
    privacy: personalOnlyPrivacy,
    category,
    address: restaurant.address,
    cuisine: restaurant.cuisine,
    note: restaurant.note,
  };
}

export function buildRestaurantUpdatePayload(restaurant: RestaurantUpdateInput) {
  const category = normalizePlaceCategory(restaurant.category);

  if (!category) {
    throw new Error("分类无效，请选择一个支持的地点分类。");
  }

  return {
    category,
    cuisine: restaurant.cuisine,
    note: restaurant.note,
    privacy: personalOnlyPrivacy,
  };
}
