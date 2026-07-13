import { resolvePlaceLocation } from "./place-location.ts";

export type PlaceMarkerInput = {
  id: number;
  name: string;
  city: string;
  category?: string | null;
  latitude?: number | null;
  longitude?: number | null;
};

export type PlaceMarkerData = {
  id: number;
  name: string;
  city: string;
  category: string | null;
  latitude: number;
  longitude: number;
  precision: "exact" | "city";
  approximate: boolean;
};

export function createPlaceMarkerData(places: PlaceMarkerInput[]): PlaceMarkerData[] {
  return places.flatMap((place) => {
    const resolvedLocation = resolvePlaceLocation(place);

    if (resolvedLocation.status === "unresolved") {
      return [];
    }

    return [{
      id: place.id,
      name: place.name,
      city: place.city,
      category: place.category ?? null,
      latitude: resolvedLocation.location.latitude,
      longitude: resolvedLocation.location.longitude,
      precision: resolvedLocation.location.precision,
      approximate: resolvedLocation.location.approximate,
    }];
  });
}
