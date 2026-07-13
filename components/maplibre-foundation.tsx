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
  activeMarkerId?: number | null;
};

export function MapLibreFoundation({
  className,
  placeMarkers = [],
  activeMarkerId = null,
}: MapLibreFoundationProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markerCleanupRef = useRef<(() => void) | null>(null);
  const placeMarkersRef = useRef<PlaceMarkerData[]>(placeMarkers);
  const activeMarkerIdRef = useRef<number | null>(activeMarkerId);
  const [fallbackMessage, setFallbackMessage] = useState<string | null>(null);
  const [isMapLoading, setIsMapLoading] = useState(true);

  function focusActiveMarker() {
    if (!mapRef.current || activeMarkerIdRef.current === null) {
      return;
    }

    const activeMarker = placeMarkersRef.current.find(
      (marker) => marker.id === activeMarkerIdRef.current,
    );

    if (!activeMarker) {
      return;
    }

    mapRef.current.flyTo({
      center: [activeMarker.longitude, activeMarker.latitude],
      zoom: Math.max(mapRef.current.getZoom(), 11),
      essential: true,
      duration: 900,
    });
  }

  useEffect(() => {
    placeMarkersRef.current = placeMarkers;
    activeMarkerIdRef.current = activeMarkerId;

    if (!mapRef.current) {
      return;
    }

    markerCleanupRef.current?.();
    const renderedLayer = renderPlaceMarkerLayer(mapRef.current, placeMarkers, activeMarkerId);
    markerCleanupRef.current = renderedLayer.cleanup;

    if (activeMarkerId !== null) {
      focusActiveMarker();
      renderedLayer.markerById.get(activeMarkerId)?.togglePopup();
    }
  }, [placeMarkers, activeMarkerId]);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) {
      return;
    }

    const resolvedBasemapConfig = resolveLocalPmtilesBasemapConfig();

    if (resolvedBasemapConfig.status !== "ready") {
      setFallbackMessage(createPmtilesConfigErrorMessage(resolvedBasemapConfig.publicPath));
      setIsMapLoading(false);
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
          setIsMapLoading(false);
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
            setIsMapLoading(false);
          }
        });

        map.once("load", () => {
          if (!cancelled) {
            setIsMapLoading(false);
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
        const renderedLayer = renderPlaceMarkerLayer(
          map,
          placeMarkersRef.current,
          activeMarkerIdRef.current,
        );
        markerCleanupRef.current = renderedLayer.cleanup;

        if (activeMarkerIdRef.current !== null) {
          focusActiveMarker();
          renderedLayer.markerById.get(activeMarkerIdRef.current)?.togglePopup();
        }
      } catch {
        if (!cancelled) {
          setFallbackMessage(createPmtilesMissingFileMessage(basemapConfig.publicPath));
          setIsMapLoading(false);
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
      {isMapLoading && !fallbackMessage ? (
        <div className="absolute inset-0 flex items-center justify-center bg-[linear-gradient(180deg,rgba(255,255,255,0.76),rgba(255,243,234,0.92))] p-5 text-center text-sm leading-7 text-[var(--ink-soft)]">
          <div className="space-y-2">
            <div className="mx-auto h-8 w-8 animate-pulse rounded-full border-4 border-orange-100 border-t-[var(--accent)]" />
            <p>正在加载本地地图...</p>
          </div>
        </div>
      ) : null}
      {fallbackMessage ? (
        <div className="absolute inset-0 flex items-center justify-center bg-[linear-gradient(180deg,rgba(255,255,255,0.84),rgba(255,243,234,0.96))] p-5 text-center text-sm leading-7 text-[var(--ink-soft)]">
          <div className="max-w-xs rounded-[22px] border border-orange-100 bg-white/92 p-5 shadow-[0_16px_36px_rgba(122,61,21,0.12)]">
            <p className="font-semibold text-[var(--ink-strong)]">本地底图暂时无法显示</p>
            <p className="mt-2">{fallbackMessage}</p>
            <p className="mt-2 text-xs leading-5">请确认本地 PMTiles 文件可访问后再刷新页面。</p>
          </div>
        </div>
      ) : null}
    </div>
  );
}
