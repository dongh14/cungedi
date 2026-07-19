import type { PlaceMarkerData } from "./place-markers.ts";
import { getPlaceCategoryLabel, getPlaceSubtypeLabel } from "../restaurants/constants.ts";
import { formatHierarchyLocationLabel } from "../location-hierarchy.ts";

export function getMapPlaceDetailHref(placeId: number) {
  return `/restaurants/${placeId}`;
}

export function getMapPlaceLocationLabel(marker: Pick<PlaceMarkerData, "approximate" | "precision">) {
  if (!marker.approximate) return "精确位置";
  return marker.precision === "district" ? "区域位置" : "大概位置";
}

export function createMapPlacePopupViewModel(marker: PlaceMarkerData) {
  return {
    name: marker.name,
    city: marker.city,
    location: formatHierarchyLocationLabel(marker.country, marker.city, marker.district),
    category: marker.category
      ? `${getPlaceCategoryLabel(marker.category)}${marker.cuisine ? ` · ${getPlaceSubtypeLabel(marker.cuisine, marker.category)}` : ""}`
      : null,
    address: marker.address,
    locationLabel: getMapPlaceLocationLabel(marker),
    locationDescription: marker.approximate
      ? marker.precision === "district"
        ? "显示区域中心附近，仅用于回忆地点范围。"
        : "位于城市中心附近，不代表精确地点。"
      : "使用已保存的精确坐标显示。",
    detailHref: getMapPlaceDetailHref(marker.id),
  };
}
