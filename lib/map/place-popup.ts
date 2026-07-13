import type { PlaceMarkerData } from "./place-markers.ts";

export function getMapPlaceDetailHref(placeId: number) {
  return `/restaurants/${placeId}/edit`;
}

export function getMapPlaceLocationLabel(marker: Pick<PlaceMarkerData, "approximate">) {
  return marker.approximate ? "近似位置" : "精确位置";
}

export function createMapPlacePopupViewModel(marker: PlaceMarkerData) {
  return {
    name: marker.name,
    city: marker.city,
    category: marker.category,
    address: marker.address,
    locationLabel: getMapPlaceLocationLabel(marker),
    locationDescription: marker.approximate
      ? "位于城市中心附近，不代表精确地点。"
      : "使用已保存的精确坐标显示。",
    detailHref: getMapPlaceDetailHref(marker.id),
  };
}
