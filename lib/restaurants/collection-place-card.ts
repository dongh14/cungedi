import type { CollectionPlacePreview } from "./types.ts";
import { getPlaceCategoryLabel, getPlaceSubtypeLabel } from "./constants.ts";
import { formatHierarchyLocationLabel } from "../location-hierarchy.ts";

export function getCollectionPlaceCardDisplayData(place: CollectionPlacePreview) {
  return {
    detailHref: `/restaurants/${place.id}`,
    name: place.name,
    metadata: `${formatHierarchyLocationLabel(place.country, place.city, place.district)} · ${getPlaceCategoryLabel(place.category)}${place.cuisine ? ` · ${getPlaceSubtypeLabel(place.cuisine, place.category)}` : ""}`,
  };
}
