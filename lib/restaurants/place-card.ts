import { getPlaceCategoryLabel, getPlaceSubtypeLabel } from "./constants.ts";
import { formatHierarchyLocationLabel } from "../location-hierarchy.ts";
import type { DiscoveryPlaceItem, RestaurantCollectionBadge } from "./types";

export type PlaceCardInput = Pick<
  DiscoveryPlaceItem,
  "id" | "name" | "city" | "country" | "district" | "category" | "source_url"
> & {
  cuisine?: string | null;
  imageUrl?: string | null;
  collections?: RestaurantCollectionBadge[];
};

export type PlaceCardDisplayData = {
  detailHref: string;
  name: string;
  city: string;
  country: string | null;
  locationLabel: string;
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
    country: place.country ?? null,
    locationLabel: formatHierarchyLocationLabel(place.country, place.city, place.district),
    category: `${getPlaceCategoryLabel(place.category)}${place.cuisine ? ` · ${getPlaceSubtypeLabel(place.cuisine, place.category)}` : ""}`,
    imageUrl,
    hasImage: Boolean(imageUrl),
    collectionBadges,
    sourceHost: getSourceHost(place.source_url),
  };
}
