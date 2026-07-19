import {
  resolveApproximateCityCenter,
  type ApproximateCityCenterLocation,
} from "./city-centers.ts";
import { resolveApproximateAreaCenter, type AreaCenterLocation } from "./area-centers.ts";

export const exactLocationPrecision = "exact" as const;
export const storedCoordinatesSource = "stored_coordinates" as const;

export type ExactStoredLocation = {
  normalizedCityName: string | null;
  latitude: number;
  longitude: number;
  precision: typeof exactLocationPrecision;
  approximate: false;
  source: typeof storedCoordinatesSource;
};

export type UnresolvedPlaceLocation = {
  status: "unresolved";
  reason: "missing_location" | "invalid_coordinates";
};

export type ResolvedPlaceLocation =
  | {
      status: "resolved";
      location: ExactStoredLocation | ApproximateCityCenterLocation | AreaCenterLocation;
    }
  | UnresolvedPlaceLocation;

export type PlaceLocationInput = {
  city?: string | null;
  country?: string | null;
  district?: string | null;
  latitude?: number | null;
  longitude?: number | null;
};

type PlaceLocationInputWithExactCoordinates = PlaceLocationInput & {
  latitude: number;
  longitude: number;
};

export function isValidLatitude(latitude: number) {
  return Number.isFinite(latitude) && latitude >= -90 && latitude <= 90;
}

export function isValidLongitude(longitude: number) {
  return Number.isFinite(longitude) && longitude >= -180 && longitude <= 180;
}

export function hasExactStoredCoordinates(
  input: PlaceLocationInput,
): input is PlaceLocationInputWithExactCoordinates {
  return typeof input.latitude === "number" && typeof input.longitude === "number";
}

export function resolvePlaceLocation(input: PlaceLocationInput): ResolvedPlaceLocation {
  if (hasExactStoredCoordinates(input)) {
    if (!isValidLatitude(input.latitude) || !isValidLongitude(input.longitude)) {
      return {
        status: "unresolved",
        reason: "invalid_coordinates",
      };
    }

    return {
      status: "resolved",
      location: {
        normalizedCityName: resolveApproximateCityCenter(input.city, input.country)?.normalizedCityName ?? null,
        latitude: input.latitude,
        longitude: input.longitude,
        precision: exactLocationPrecision,
        approximate: false,
        source: storedCoordinatesSource,
      },
    };
  }

  const hasPartialCoordinate =
    typeof input.latitude === "number" || typeof input.longitude === "number";

  if (hasPartialCoordinate) {
    const approximateAreaCenter = resolveApproximateAreaCenter(
      input.district,
      input.city,
      input.country,
    );

    if (approximateAreaCenter) {
      return {
        status: "resolved",
        location: approximateAreaCenter,
      };
    }

    const approximateCityCenter = resolveApproximateCityCenter(input.city, input.country);

    if (approximateCityCenter) {
      return {
        status: "resolved",
        location: approximateCityCenter,
      };
    }
  }

  const approximateCityCenter = resolveApproximateCityCenter(input.city, input.country);
  const approximateAreaCenter = resolveApproximateAreaCenter(
    input.district,
    input.city,
    input.country,
  );

  if (approximateAreaCenter) {
    return {
      status: "resolved",
      location: approximateAreaCenter,
    };
  }

  if (approximateCityCenter) {
    return {
      status: "resolved",
      location: approximateCityCenter,
    };
  }

  return {
    status: "unresolved",
    reason: "missing_location",
  };
}
