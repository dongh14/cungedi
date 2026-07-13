import {
  createMapMarkerResolution,
  type PlaceMarkerInput,
} from "./place-markers.ts";

export const allCitiesFilterValue = "";
export const emptyPlaceSearchQuery = "";

function normalizePlaceSearchQuery(query: string) {
  return query.trim().toLocaleLowerCase("zh-CN");
}

function getPlaceSearchHaystack(place: PlaceMarkerInput) {
  return [place.name, place.city, place.category ?? ""]
    .join("\n")
    .toLocaleLowerCase("zh-CN");
}

export function getMapCityOptions(places: PlaceMarkerInput[]) {
  return [...new Set(places.map((place) => place.city))].sort((first, second) =>
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

  return places.filter((place) => place.city === selectedCity);
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
