import {
  createMapMarkerResolution,
  type PlaceMarkerInput,
} from "./place-markers.ts";
import { normalizeCityForComparison, normalizeCityName } from "./city-centers.ts";
import { isCountryLevelLocation } from "./country-locations.ts";

export const allCitiesFilterValue = "";
export const emptyPlaceSearchQuery = "";

function normalizePlaceSearchQuery(query: string) {
  const trimmedQuery = query.trim();
  const normalizedCityQuery = normalizeCityForComparison(trimmedQuery);

  return (normalizedCityQuery ?? trimmedQuery).toLocaleLowerCase("zh-CN");
}

function getPlaceSearchHaystack(place: PlaceMarkerInput) {
  const normalizedComparableCity = normalizeCityForComparison(place.city);

  return [
    place.name,
    place.city,
    normalizedComparableCity && normalizedComparableCity !== place.city
      ? normalizedComparableCity
      : "",
    place.category ?? "",
  ]
    .join("\n")
    .toLocaleLowerCase("zh-CN");
}

export function getMapCityOptions(places: PlaceMarkerInput[]) {
  const canonicalCityOptions = new Map<string, string>();

  places.forEach((place) => {
    if (isCountryLevelLocation(place.city)) {
      return;
    }

    const normalizedIdentity = normalizeCityForComparison(place.city);

    if (!normalizedIdentity) {
      return;
    }

    if (canonicalCityOptions.has(normalizedIdentity)) {
      return;
    }

    canonicalCityOptions.set(
      normalizedIdentity,
      normalizeCityName(place.city) ?? place.city.trim(),
    );
  });

  return [...canonicalCityOptions.values()].sort((first, second) =>
    first.localeCompare(second, "zh-CN"),
  );
}

export function filterPlacesBySearch(places: PlaceMarkerInput[], query: string) {
  const normalizedQuery = normalizePlaceSearchQuery(query);

  if (!normalizedQuery) {
    return places;
  }

  return places.filter((place) => getPlaceSearchHaystack(place).includes(normalizedQuery));
}

export function filterPlacesByCity(places: PlaceMarkerInput[], selectedCity: string) {
  if (selectedCity === allCitiesFilterValue) {
    return places;
  }

  const normalizedSelectedCity = normalizeCityForComparison(selectedCity);

  return places.filter((place) => {
    const normalizedPlaceCity = normalizeCityForComparison(place.city);

    return normalizedPlaceCity === normalizedSelectedCity;
  });
}

export function filterPlacesForMap(input: {
  places: PlaceMarkerInput[];
  searchQuery: string;
  selectedCity: string;
}) {
  return filterPlacesByCity(
    filterPlacesBySearch(input.places, input.searchQuery),
    input.selectedCity,
  );
}

export function createFilteredMapDisplay(input: {
  places: PlaceMarkerInput[];
  searchQuery: string;
  selectedCity: string;
}) {
  return createMapMarkerResolution(filterPlacesForMap(input));
}
