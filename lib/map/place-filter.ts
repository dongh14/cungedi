import {
  createMapMarkerResolution,
  type PlaceMarkerInput,
} from "./place-markers.ts";

export const allCitiesFilterValue = "";

export function getMapCityOptions(places: PlaceMarkerInput[]) {
  return [...new Set(places.map((place) => place.city))].sort((first, second) =>
    first.localeCompare(second, "zh-CN"),
  );
}

export function filterPlacesByCity(places: PlaceMarkerInput[], selectedCity: string) {
  if (selectedCity === allCitiesFilterValue) {
    return places;
  }

  return places.filter((place) => place.city === selectedCity);
}

export function createFilteredMapDisplay(places: PlaceMarkerInput[], selectedCity: string) {
  return createMapMarkerResolution(filterPlacesByCity(places, selectedCity));
}
