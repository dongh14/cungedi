"use client";

import { useEffect, useRef } from "react";
import maplibregl, { NavigationControl } from "maplibre-gl";
import { createLocalEmptyMapStyle, defaultMapCenter, defaultMapZoom } from "@/lib/map/map-style";

type MapLibreFoundationProps = {
  className?: string;
};

export function MapLibreFoundation({
  className,
}: MapLibreFoundationProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) {
      return;
    }

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: createLocalEmptyMapStyle(),
      center: [...defaultMapCenter],
      zoom: defaultMapZoom,
      attributionControl: false,
    });

    map.addControl(
      new NavigationControl({
        showCompass: false,
        visualizePitch: false,
      }),
      "top-right",
    );

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  return (
    <div
      className={className}
      data-testid="maplibre-foundation"
    >
      <div
        ref={containerRef}
        className="h-full w-full"
        aria-label="MapLibre 地图基础画布"
      />
    </div>
  );
}
