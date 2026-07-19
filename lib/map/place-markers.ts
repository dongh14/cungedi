import { resolvePlaceLocation } from "./place-location.ts";
import { getPlaceCategoryLabel, getPlaceSubtypeLabel } from "../restaurants/constants.ts";

export type PlaceMarkerInput = {
  id: number;
  name: string;
  city: string;
  country?: string | null;
  district?: string | null;
  category?: string | null;
  address?: string | null;
  cuisine?: string | null;
  note?: string | null;
  latitude?: number | null;
  longitude?: number | null;
};

export type PlaceMarkerData = {
  id: number;
  name: string;
  city: string;
  country?: string | null;
  district?: string | null;
  category: string | null;
  cuisine?: string | null;
  address: string | null;
  latitude: number;
  longitude: number;
  precision: "exact" | "city" | "district";
  approximate: boolean;
};

export type UnresolvedMapPlaceSummary = {
  total: number;
  missingLocation: number;
  invalidCoordinates: number;
};

export type MapMarkerResolution = {
  markers: PlaceMarkerData[];
  unresolved: UnresolvedMapPlaceSummary;
};

export function createMapMarkerResolution(places: PlaceMarkerInput[]): MapMarkerResolution {
  const markers: PlaceMarkerData[] = [];
  const unresolved: UnresolvedMapPlaceSummary = {
    total: 0,
    missingLocation: 0,
    invalidCoordinates: 0,
  };

  places.forEach((place) => {
    const resolvedLocation = resolvePlaceLocation(place);

    if (resolvedLocation.status === "unresolved") {
      unresolved.total += 1;

      if (resolvedLocation.reason === "invalid_coordinates") {
        unresolved.invalidCoordinates += 1;
      } else {
        unresolved.missingLocation += 1;
      }

      return;
    }

    markers.push({
      id: place.id,
      name: place.name,
      city: place.city,
      ...(place.country?.trim() ? { country: place.country.trim() } : {}),
      ...(place.district?.trim() ? { district: place.district.trim() } : {}),
      category: place.category ? getPlaceCategoryLabel(place.category) : null,
      ...(place.cuisine ? { cuisine: getPlaceSubtypeLabel(place.cuisine, place.category) } : {}),
      address: place.address ?? null,
      latitude: resolvedLocation.location.latitude,
      longitude: resolvedLocation.location.longitude,
      precision: resolvedLocation.location.precision,
      approximate: resolvedLocation.location.approximate,
    });
  });

  return { markers, unresolved };
}

export function createPlaceMarkerData(places: PlaceMarkerInput[]): PlaceMarkerData[] {
  return createMapMarkerResolution(places).markers;
}
