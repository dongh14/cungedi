import type { PlaceMarkerData } from "./place-markers.ts";

export type MapSearchSelectablePlace = Pick<
  PlaceMarkerData,
  "id" | "name" | "city" | "category" | "approximate"
>;

export function createMapSearchSelectablePlaces(
  markers: PlaceMarkerData[],
): MapSearchSelectablePlace[] {
  return markers.map((marker) => ({
    id: marker.id,
    name: marker.name,
    city: marker.city,
    category: marker.category,
    approximate: marker.approximate,
  }));
}

export function getActiveMapPlace(
  markers: PlaceMarkerData[],
  activePlaceId: number | null,
) {
  if (activePlaceId === null) {
    return null;
  }

  return markers.find((marker) => marker.id === activePlaceId) ?? null;
}

export function syncActiveMapPlaceId(
  markers: PlaceMarkerData[],
  activePlaceId: number | null,
) {
  return getActiveMapPlace(markers, activePlaceId)?.id ?? null;
}
