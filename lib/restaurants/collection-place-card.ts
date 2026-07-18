import type { CollectionPlacePreview } from "./types.ts";

export function getCollectionPlaceCardDisplayData(place: CollectionPlacePreview) {
  return {
    detailHref: `/restaurants/${place.id}`,
    name: place.name,
    metadata: `${place.city} · ${place.category}`,
  };
}
