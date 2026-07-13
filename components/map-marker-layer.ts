"use client";

import maplibregl from "maplibre-gl";
import type { PlaceMarkerData } from "@/lib/map/place-markers";

function createPopupContent(marker: PlaceMarkerData) {
  const content = document.createElement("div");
  content.className = "min-w-48 space-y-2 p-1 text-sm text-[var(--ink-strong)]";

  const name = document.createElement("p");
  name.className = "font-semibold leading-5";
  name.textContent = marker.name;
  content.append(name);

  const city = document.createElement("p");
  city.className = "text-xs leading-5 text-[var(--ink-soft)]";
  city.textContent = `城市：${marker.city}`;
  content.append(city);

  if (marker.category) {
    const category = document.createElement("p");
    category.className = "text-xs leading-5 text-[var(--ink-soft)]";
    category.textContent = `分类：${marker.category}`;
    content.append(category);
  }

  if (marker.approximate) {
    const approximateNotice = document.createElement("p");
    approximateNotice.className = "rounded-xl bg-orange-50 px-2 py-1.5 text-xs leading-5 text-[var(--accent-deep)]";
    approximateNotice.textContent = "近似位置：这是城市中心附近的位置，不代表精确地点。";
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
