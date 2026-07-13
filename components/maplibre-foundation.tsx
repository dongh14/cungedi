"use client";

import { useEffect, useRef, useState } from "react";
import maplibregl, { NavigationControl } from "maplibre-gl";
import { renderPlaceMarkerLayer } from "@/components/map-marker-layer";
import { createLocalPmtilesMapStyle, defaultMapCenter, defaultMapZoom } from "@/lib/map/map-style";
import type { PlaceMarkerData } from "@/lib/map/place-markers";
import {
  createPmtilesConfigErrorMessage,
  createPmtilesMissingFileMessage,
  resolveLocalPmtilesBasemapConfig,
} from "@/lib/map/pmtiles-config";
import { registerPmtilesArchive } from "@/lib/map/pmtiles-protocol";

type MapLibreFoundationProps = {
  className?: string;
  placeMarkers?: PlaceMarkerData[];
};

export function MapLibreFoundation({
  className,
  placeMarkers = [],
}: MapLibreFoundationProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markerCleanupRef = useRef<(() => void) | null>(null);
  const placeMarkersRef = useRef<PlaceMarkerData[]>(placeMarkers);
  const [fallbackMessage, setFallbackMessage] = useState<string | null>(null);

  useEffect(() => {
    placeMarkersRef.current = placeMarkers;

    if (!mapRef.current) {
      return;
    }

    markerCleanupRef.current?.();
    markerCleanupRef.current = renderPlaceMarkerLayer(mapRef.current, placeMarkers);
  }, [placeMarkers]);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) {
      return;
    }

    const resolvedBasemapConfig = resolveLocalPmtilesBasemapConfig();

    if (resolvedBasemapConfig.status !== "ready") {
      setFallbackMessage(createPmtilesConfigErrorMessage(resolvedBasemapConfig.publicPath));
      return;
    }

    const basemapConfig = resolvedBasemapConfig;
    let cancelled = false;

    async function setupMap() {
      try {
        const basemapResponse = await fetch(basemapConfig.publicPath, {
          method: "HEAD",
        });

        if (cancelled) {
          return;
        }

        if (!basemapResponse.ok) {
          setFallbackMessage(createPmtilesMissingFileMessage(basemapConfig.publicPath));
          return;
        }

        registerPmtilesArchive(basemapConfig.sourceUrl);

        const map = new maplibregl.Map({
          container: containerRef.current!,
          style: createLocalPmtilesMapStyle(basemapConfig.sourceUrl),
          center: [...defaultMapCenter],
          zoom: defaultMapZoom,
          attributionControl: false,
        });

        map.on("error", (event) => {
          if (event.error && !cancelled) {
            setFallbackMessage(createPmtilesMissingFileMessage(basemapConfig.publicPath));
          }
        });

        map.addControl(
          new NavigationControl({
            showCompass: false,
            visualizePitch: false,
          }),
          "top-right",
        );

        mapRef.current = map;
        markerCleanupRef.current = renderPlaceMarkerLayer(map, placeMarkersRef.current);
      } catch {
        if (!cancelled) {
          setFallbackMessage(createPmtilesMissingFileMessage(basemapConfig.publicPath));
        }
      }
    }

    void setupMap();

    return () => {
      cancelled = true;

      if (mapRef.current) {
        markerCleanupRef.current?.();
        markerCleanupRef.current = null;
        mapRef.current.remove();
        mapRef.current = null;
      }
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
      {fallbackMessage ? (
        <div className="absolute inset-0 flex items-center justify-center bg-[linear-gradient(180deg,rgba(255,255,255,0.76),rgba(255,243,234,0.92))] p-5 text-center text-sm leading-7 text-[var(--ink-soft)]">
          <p>{fallbackMessage}</p>
        </div>
      ) : null}
    </div>
  );
}
