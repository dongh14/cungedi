import {
  createMapMarkerResolution,
  type PlaceMarkerInput,
} from "./place-markers.ts";
import { normalizeCityForComparison, normalizeCityName } from "./city-centers.ts";
import { isCountryLevelLocation } from "./country-locations.ts";
import { normalizeCountryName } from "../location.ts";
import {
  allCountriesFilterValue,
  filterRecordsByLocation,
  getCityIdentity,
  getCountryIdentity,
  getLocationSearchTerms,
  type LocationHierarchyState,
} from "../location-hierarchy.ts";
import { getPlaceCategoryLabel, getPlaceSubtypeLabel } from "../restaurants/constants.ts";

export const allCitiesFilterValue = "";
export const emptyPlaceSearchQuery = "";

function normalizePlaceSearchQuery(query: string) {
  const trimmedQuery = query.trim();
  const normalizedCityQuery = normalizeCityForComparison(trimmedQuery);

  return (normalizedCityQuery ?? trimmedQuery).toLocaleLowerCase("zh-CN");
}

function getPlaceSearchHaystack(place: PlaceMarkerInput) {
  const normalizedComparableCity = normalizeCityForComparison(place.city);
  const locationTerms = getLocationSearchTerms(place);

  return [
    place.name,
    place.city,
    place.country ?? "",
    normalizedComparableCity && normalizedComparableCity !== place.city
      ? normalizedComparableCity
      : "",
    normalizeCountryName(place.country) ?? "",
    ...locationTerms,
    getPlaceCategoryLabel(place.category),
    getPlaceSubtypeLabel(place.cuisine, place.category),
    place.cuisine ?? "",
    place.address ?? "",
    place.note ?? "",
  ]
    .join("\n")
    .toLocaleLowerCase("zh-CN");
}

export function getMapCityOptions(places: PlaceMarkerInput[]) {
  const canonicalCityOptions = new Map<string, string>();

  places.forEach((place) => {
    if (isCountryLevelLocation(place.city) && !normalizeCityName(place.city)) {
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

export function filterPlacesByCountry(places: PlaceMarkerInput[], selectedCountry: string) {
  if (selectedCountry === allCountriesFilterValue) {
    return places;
  }

  return places.filter((place) => getCountryIdentity(place.country) === selectedCountry);
}

export function filterPlacesByLocation(
  places: PlaceMarkerInput[],
  state: LocationHierarchyState,
) {
  return filterRecordsByLocation(places, state);
}

export function filterPlacesForMap(input: {
  places: PlaceMarkerInput[];
  searchQuery: string;
  selectedCountry?: string;
  selectedCity?: string;
  selectedDistrict?: string;
}) {
  return filterPlacesByLocation(filterPlacesBySearch(input.places, input.searchQuery), {
    selectedCountry: input.selectedCountry
      ? getCountryIdentity(input.selectedCountry)
      : allCountriesFilterValue,
    selectedCity: input.selectedCity ? getCityIdentity(input.selectedCity) : allCitiesFilterValue,
    selectedDistrict: input.selectedDistrict ?? "",
  });
}

export function createFilteredMapDisplay(input: {
  places: PlaceMarkerInput[];
  searchQuery: string;
  selectedCountry?: string;
  selectedCity?: string;
  selectedDistrict?: string;
}) {
  return createMapMarkerResolution(filterPlacesForMap(input));
}
