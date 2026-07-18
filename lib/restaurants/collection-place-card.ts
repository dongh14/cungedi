import type { CollectionPlacePreview } from "./types.ts";
import { getPlaceCategoryLabel } from "./constants.ts";

export function getCollectionPlaceCardDisplayData(place: CollectionPlacePreview) {
  return {
    detailHref: `/restaurants/${place.id}`,
    name: place.name,
    metadata: `${place.city} · ${getPlaceCategoryLabel(place.category)}`,
  };
}
