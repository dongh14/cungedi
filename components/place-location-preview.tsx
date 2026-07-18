"use client";

import { MapLibreFoundation } from "@/components/maplibre-foundation";
import { createPlaceMarkerData, type PlaceMarkerInput } from "@/lib/map/place-markers";

export function PlaceLocationPreview({ place }: { place: PlaceMarkerInput }) {
  const marker = createPlaceMarkerData([place])[0];

  if (!marker) {
    return null;
  }

  return (
    <div className="relative h-[18rem] overflow-hidden rounded-[24px] border border-[var(--border-soft)] bg-[var(--surface-muted)] sm:h-[22rem]">
      <MapLibreFoundation
        className="absolute inset-0"
        placeMarkers={[marker]}
        activeMarkerId={marker.id}
      />
    </div>
  );
}
