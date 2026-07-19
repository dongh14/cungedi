import type {
  RestaurantInsertInput,
  RestaurantUpdateInput,
} from "./types";
import {
  normalizePlaceCategory,
  normalizePlaceSubtype,
  personalOnlyPrivacy,
} from "./constants.ts";
import {
  normalizeCountryName,
  normalizeDistrictName,
  resolvePlaceArea,
} from "../location.ts";

function normalizeOptionalText(value: string | null | undefined) {
  const normalized = value?.trim().replace(/\s+/gu, " ") ?? "";

  return normalized || null;
}

export function buildRestaurantInsertPayload(
  userId: string,
  restaurant: RestaurantInsertInput,
) {
  const category = normalizePlaceCategory(restaurant.category);

  if (!category) {
    throw new Error("分类无效，请选择一个支持的地点分类。");
  }

  const area = resolvePlaceArea(restaurant);

  return {
    user_id: userId,
    name: restaurant.name,
    city: area.city ?? restaurant.city,
    country: area.country,
    district: area.district,
    source_url: restaurant.sourceUrl,
    privacy: personalOnlyPrivacy,
    category,
    address: restaurant.address,
    cuisine: normalizePlaceSubtype(restaurant.cuisine, category),
    note: restaurant.note,
  };
}

export function buildRestaurantUpdatePayload(restaurant: RestaurantUpdateInput) {
  const category = normalizePlaceCategory(restaurant.category);

  if (!category) {
    throw new Error("分类无效，请选择一个支持的地点分类。");
  }

  return {
    ...(restaurant.name !== undefined ? { name: normalizeOptionalText(restaurant.name) } : {}),
    ...(restaurant.city !== undefined ? { city: normalizeOptionalText(restaurant.city) } : {}),
    ...(restaurant.country !== undefined
      ? { country: normalizeCountryName(restaurant.country) ?? normalizeOptionalText(restaurant.country) }
      : {}),
    ...(restaurant.district !== undefined
      ? { district: normalizeDistrictName(restaurant.district) ?? normalizeOptionalText(restaurant.district) }
      : {}),
    category,
    ...(restaurant.address !== undefined
      ? { address: normalizeOptionalText(restaurant.address) }
      : {}),
    ...(restaurant.latitude !== undefined ? { latitude: restaurant.latitude } : {}),
    ...(restaurant.longitude !== undefined ? { longitude: restaurant.longitude } : {}),
    cuisine: normalizePlaceSubtype(restaurant.cuisine, category),
    note: restaurant.note,
    privacy: personalOnlyPrivacy,
  };
}
