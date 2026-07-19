import {
  filterRecordsByLocation,
  getCityIdentity,
  getCountryIdentity,
  getLocationHierarchy,
  type LocationHierarchyState,
} from "../location-hierarchy.ts";
import { filterPlacesBySearch } from "../map/place-filter.ts";
import {
  canonicalPlaceCategories,
  getPlaceCategoryLabel,
  normalizePlaceCategory,
  type CanonicalPlaceCategory,
} from "./constants.ts";
import type { RestaurantListItem } from "./types.ts";

export type PlaceLibraryFilterState = LocationHierarchyState & {
  searchQuery: string;
  selectedCategory: CanonicalPlaceCategory | "";
};

export const emptyPlaceLibraryFilterState: PlaceLibraryFilterState = {
  searchQuery: "",
  selectedCountry: "",
  selectedCity: "",
  selectedCategory: "",
};

export const placeLibraryCategoryOptions = canonicalPlaceCategories.map((value) => ({
  value,
  label: value,
  description:
    value === "美食"
      ? "餐厅、咖啡和饮品"
      : value === "景点"
        ? "景点、博物馆和地标"
        : value === "住宿"
          ? "酒店、民宿和度假村"
          : value === "购物"
            ? "商场、店铺和市集"
            : value === "娱乐"
              ? "展览、夜生活和休闲"
              : "暂时未分类的地点",
})) satisfies ReadonlyArray<{
  value: CanonicalPlaceCategory;
  label: string;
  description: string;
}>;

export function filterPlacesForLibrary(
  places: RestaurantListItem[],
  state: PlaceLibraryFilterState,
) {
  const searched = filterPlacesBySearch(places, state.searchQuery) as RestaurantListItem[];
  const located = filterRecordsByLocation(searched, {
    selectedCountry: state.selectedCountry,
    selectedCity: state.selectedCity,
  });

  if (!state.selectedCategory) {
    return located;
  }

  return located.filter(
    (place) => normalizePlaceCategory(place.category) === state.selectedCategory,
  );
}

export function getPlaceLibraryCityGroups(places: RestaurantListItem[]) {
  return getLocationHierarchy(places).filter((country) => country.cities.length > 0);
}

export function getPlaceLibraryFilterState(params: {
  q?: string;
  search?: string;
  country?: string;
  city?: string;
  district?: string;
  category?: string;
}): PlaceLibraryFilterState {
  return {
    searchQuery: (params.q ?? params.search ?? "").trim(),
    selectedCountry: params.country ? getCountryIdentity(params.country) : "",
    selectedCity: params.city ? getCityIdentity(params.city) : "",
    selectedDistrict: params.district?.trim().toLocaleLowerCase("zh-CN") ?? "",
    selectedCategory: normalizePlaceCategory(params.category) ?? "",
  };
}

export function serializePlaceLibraryFilterState(state: PlaceLibraryFilterState) {
  const params = new URLSearchParams();

  if (state.searchQuery.trim()) params.set("q", state.searchQuery.trim());
  if (state.selectedCountry) params.set("country", state.selectedCountry);
  if (state.selectedCity) params.set("city", state.selectedCity);
  if (state.selectedDistrict) params.set("district", state.selectedDistrict);
  if (state.selectedCategory) params.set("category", state.selectedCategory);

  return params.toString();
}

export function getPlaceLibraryFilterHref(state: PlaceLibraryFilterState) {
  const query = serializePlaceLibraryFilterState(state);
  return query ? `/restaurants?${query}` : "/restaurants";
}

export function getPlaceLibraryLocationLabel(state: PlaceLibraryFilterState) {
  if (!state.selectedCity) return state.selectedCountry || "城市";
  return state.selectedCountry
    ? `${state.selectedCountry} · ${state.selectedCity}`
    : state.selectedCity;
}

export function hasPlaceLibraryFilters(state: PlaceLibraryFilterState) {
  return Boolean(
    state.searchQuery.trim() ||
      state.selectedCountry ||
      state.selectedCity ||
      state.selectedCategory,
  );
}

export function getPlaceLibraryCategoryLabel(value: string | null | undefined) {
  return getPlaceCategoryLabel(value);
}
