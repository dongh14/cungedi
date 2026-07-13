"use client";

import maplibregl from "maplibre-gl";
import type { PlaceMarkerData } from "@/lib/map/place-markers";

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

function createMarkerElement(marker: PlaceMarkerData) {
  const element = document.createElement("button");
  element.type = "button";
  element.className = marker.approximate
    ? "map-place-marker map-place-marker-approximate"
    : "map-place-marker";
  element.setAttribute(
    "aria-label",
    marker.approximate
      ? `查看${marker.name}的近似位置`
      : `查看${marker.name}的位置`,
  );

  return element;
}

export function renderPlaceMarkerLayer(map: maplibregl.Map, markers: PlaceMarkerData[]) {
  const mapMarkers = markers.map((marker) => {
    const popup = new maplibregl.Popup({
      closeButton: true,
      closeOnClick: true,
      offset: 18,
      maxWidth: "260px",
    }).setDOMContent(createPopupContent(marker));

    return new maplibregl.Marker({
      element: createMarkerElement(marker),
      anchor: "bottom",
    })
      .setLngLat([marker.longitude, marker.latitude])
      .setPopup(popup)
      .addTo(map);
  });

  return () => {
    mapMarkers.forEach((marker) => marker.remove());
  };
}
