"use client";

import maplibregl from "maplibre-gl";
import type { PlaceMarkerData } from "@/lib/map/place-markers";

type RenderedPlaceMarkerLayer = {
  cleanup: () => void;
  markerById: Map<number, maplibregl.Marker>;
};

function createPopupContent(marker: PlaceMarkerData) {
  const content = document.createElement("div");
  content.className = "map-place-popup";

  const name = document.createElement("p");
  name.className = "map-place-popup-name";
  name.textContent = marker.name;
  content.append(name);

  const details = document.createElement("div");
  details.className = "map-place-popup-details";

  const city = document.createElement("span");
  city.textContent = marker.city;
  details.append(city);

  if (marker.category) {
    const category = document.createElement("p");
    category.className = "map-place-popup-category";
    category.textContent = marker.category;
    details.append(category);
  }

  content.append(details);

  if (marker.approximate) {
    const approximateNotice = document.createElement("p");
    approximateNotice.className = "map-place-popup-notice";
    approximateNotice.textContent = "近似位置，位于城市中心附近，不代表精确地点。";
    content.append(approximateNotice);
  }

  return content;
}

function createMarkerElement(marker: PlaceMarkerData, isActive: boolean) {
  const element = document.createElement("button");
  element.type = "button";
  element.className = [
    "map-place-marker",
    marker.approximate ? "map-place-marker-approximate" : "",
    isActive ? "map-place-marker-active" : "",
  ]
    .filter(Boolean)
    .join(" ");
  element.setAttribute(
    "aria-label",
    marker.approximate
      ? `查看${marker.name}的近似位置`
      : `查看${marker.name}的位置`,
  );
  element.setAttribute("aria-pressed", isActive ? "true" : "false");

  return element;
}

export function renderPlaceMarkerLayer(
  map: maplibregl.Map,
  markers: PlaceMarkerData[],
  activeMarkerId: number | null = null,
): RenderedPlaceMarkerLayer {
  const markerById = new Map<number, maplibregl.Marker>();
  const mapMarkers = markers.map((marker) => {
    const popup = new maplibregl.Popup({
      closeButton: true,
      closeOnClick: true,
      offset: 18,
      maxWidth: "260px",
    }).setDOMContent(createPopupContent(marker));

    const mapMarker = new maplibregl.Marker({
      element: createMarkerElement(marker, marker.id === activeMarkerId),
      anchor: "bottom",
    })
      .setLngLat([marker.longitude, marker.latitude])
      .setPopup(popup)
      .addTo(map);

    markerById.set(marker.id, mapMarker);

    return mapMarker;
  });

  return {
    cleanup: () => {
      mapMarkers.forEach((marker) => marker.remove());
    },
    markerById,
  };
}
