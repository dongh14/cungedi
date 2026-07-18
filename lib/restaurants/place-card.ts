import { getCanonicalPlaceCategory } from "./constants.ts";
import type { DiscoveryPlaceItem, RestaurantCollectionBadge } from "./types";

export type PlaceCardInput = Pick<
  DiscoveryPlaceItem,
  "id" | "name" | "city" | "category" | "source_url"
> & {
  imageUrl?: string | null;
  collections?: RestaurantCollectionBadge[];
};

export type PlaceCardDisplayData = {
  detailHref: string;
  name: string;
  city: string;
  category: string;
  imageUrl: string | null;
  hasImage: boolean;
  collectionBadges: RestaurantCollectionBadge[];
  sourceHost: string;
};

function getSafeImageUrl(value: string | null | undefined) {
  if (!value) {
    return null;
  }

  try {
    const url = new URL(value);

    return url.protocol === "http:" || url.protocol === "https:" ? url.toString() : null;
  } catch {
    return null;
  }
}

function getSourceHost(value: string) {
  try {
    return new URL(value).hostname.replace(/^www\./, "");
  } catch {
    return "原始来源";
  }
}

export function getPlaceCardDisplayData(place: PlaceCardInput): PlaceCardDisplayData {
  const imageUrl = getSafeImageUrl(place.imageUrl);
  const collectionBadges = Array.from(
    new Map((place.collections ?? []).map((collection) => [collection.id, collection])).values(),
  );

  return {
    detailHref: `/restaurants/${place.id}`,
    name: place.name,
    city: place.city,
    category: getCanonicalPlaceCategory(place.category) ?? place.category,
    imageUrl,
    hasImage: Boolean(imageUrl),
    collectionBadges,
    sourceHost: getSourceHost(place.source_url),
  };
}
