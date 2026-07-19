"use client";

import { useEffect, useRef, useState } from "react";
import type { ErrorEvent, MapMouseEvent } from "maplibre-gl";
import { renderPlaceMarkerLayer } from "@/components/map-marker-layer";
import { defaultMaxClusterZoom } from "@/lib/map/marker-clusters";
import { createLocalPmtilesMapStyle, defaultMapCenter, defaultMapZoom } from "@/lib/map/map-style";
import type { PlaceMarkerData } from "@/lib/map/place-markers";
import {
  createPmtilesConfigErrorMessage,
  resolveLocalPmtilesBasemapConfig,
} from "@/lib/map/pmtiles-config";
import {
  getMapContainerSize,
  isMapReady,
  isTerminalMapError,
} from "@/lib/map/map-readiness";
import { preflightPmtilesArchive } from "@/lib/map/pmtiles-preflight";

type MapLibreModule = typeof import("maplibre-gl");
type MapLibreMap = InstanceType<MapLibreModule["Map"]>;
type MapLibreMarker = InstanceType<MapLibreModule["Marker"]>;

type MapStatus = "loading" | "ready" | "error";

type MapLibreFoundationProps = {
  className?: string;
  placeMarkers?: PlaceMarkerData[];
  activeMarkerId?: number | null;
  editableLocation?: { latitude: number; longitude: number } | null;
  onLocationChange?: (location: { latitude: number; longitude: number }) => void;
};

export function MapLibreFoundation({
  className,
  placeMarkers = [],
  activeMarkerId = null,
  editableLocation = null,
  onLocationChange,
}: MapLibreFoundationProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const maplibreRef = useRef<MapLibreModule | null>(null);
  const markerCleanupRef = useRef<(() => void) | null>(null);
  const placeMarkersRef = useRef<PlaceMarkerData[]>(placeMarkers);
  const activeMarkerIdRef = useRef<number | null>(activeMarkerId);
  const editableLocationRef = useRef(editableLocation);
  const onLocationChangeRef = useRef(onLocationChange);
  const editableMarkerRef = useRef<MapLibreMarker | null>(null);
  const mountCountRef = useRef(0);
  const [fallbackMessage, setFallbackMessage] = useState<string | null>(null);
  const [mapStatus, setMapStatus] = useState<MapStatus>("loading");
  const [retryNonce, setRetryNonce] = useState(0);

  function renderMarkers(openActivePopup: boolean) {
    const map = mapRef.current;

    if (!map) {
      return;
    }

    markerCleanupRef.current?.();
    const renderedLayer = renderPlaceMarkerLayer(
      map,
      placeMarkersRef.current,
      activeMarkerIdRef.current,
    );
    markerCleanupRef.current = renderedLayer.cleanup;

    if (!openActivePopup || activeMarkerIdRef.current === null) {
      return;
    }

    if (renderedLayer.markerById.has(activeMarkerIdRef.current)) {
      renderedLayer.markerById.get(activeMarkerIdRef.current)?.togglePopup();
      return;
    }

    focusActiveMarker();
  }

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
      zoom: Math.max(mapRef.current.getZoom(), defaultMaxClusterZoom + 1),
      essential: true,
      duration: 900,
    });
  }

  function syncEditableMarker() {
    const map = mapRef.current;

    if (!map) {
      return;
    }

    if (!editableLocationRef.current || !onLocationChangeRef.current || !maplibreRef.current) {
      editableMarkerRef.current?.remove();
      editableMarkerRef.current = null;
      return;
    }

    const { latitude, longitude } = editableLocationRef.current;

    if (!editableMarkerRef.current) {
      const element = document.createElement("div");
      element.className = "map-edit-location-marker";
      element.setAttribute("aria-label", "可编辑位置");

      const marker = new maplibreRef.current.Marker({ element, draggable: true })
        .setLngLat([longitude, latitude])
        .addTo(map);

      marker.on("dragend", () => {
        const next = marker.getLngLat();
        onLocationChangeRef.current?.({ latitude: next.lat, longitude: next.lng });
      });
      editableMarkerRef.current = marker;
    } else {
      editableMarkerRef.current.setLngLat([longitude, latitude]);
    }
  }

  useEffect(() => {
    placeMarkersRef.current = placeMarkers;
    activeMarkerIdRef.current = activeMarkerId;
    editableLocationRef.current = editableLocation;
    onLocationChangeRef.current = onLocationChange;

    renderMarkers(true);
    syncEditableMarker();

    if (mapRef.current && editableLocation) {
      mapRef.current.flyTo({
        center: [editableLocation.longitude, editableLocation.latitude],
        zoom: Math.max(mapRef.current.getZoom(), 10),
        essential: true,
        duration: 450,
      });
    }
  }, [placeMarkers, activeMarkerId, editableLocation, onLocationChange]);

  useEffect(() => {
    const resolvedBasemapConfig = resolveLocalPmtilesBasemapConfig();
    let cancelled = false;
    let map: MapLibreMap | null = null;
    let readinessTimer: number | null = null;
    let resizeFrame: number | null = null;
    let stageWatchdog: number | null = null;
    let readinessChecks = 0;
    let currentStage = "component mounted";

    mountCountRef.current += 1;

    const debugInit = (
      checkpoint: string,
      message: string,
      details: Record<string, unknown> = {},
    ) => {
      if (process.env.NODE_ENV !== "production") {
        console.debug(`[map-init] ${checkpoint} ${message}`, details);
      }
    };

    const debugMap = (event: string, details: Record<string, unknown> = {}) => {
      if (process.env.NODE_ENV !== "production") {
        console.debug(`[map] ${event}`, details);
      }
    };

    const clearReadinessTimer = () => {
      if (readinessTimer !== null) {
        window.clearInterval(readinessTimer);
        readinessTimer = null;
      }
    };

    const clearStageWatchdog = () => {
      if (stageWatchdog !== null) {
        window.clearTimeout(stageWatchdog);
        stageWatchdog = null;
      }
    };

    const markError = (message: string) => {
      if (cancelled) {
        return;
      }

      clearReadinessTimer();
      clearStageWatchdog();
      setFallbackMessage(message);
      setMapStatus("error");
    };

    const failInitialization = (error: unknown) => {
      debugInit("error", "initialization failed", {
        stage: currentStage,
        error: error instanceof Error ? error.message.slice(0, 240) : "unknown error",
      });
      markError("地图初始化失败");
    };

    const armStageWatchdog = () => {
      clearStageWatchdog();
      stageWatchdog = window.setTimeout(() => {
        failInitialization(new Error(`stalled at ${currentStage}`));
      }, 8000);
    };

    const advanceStage = (
      checkpoint: string,
      stage: string,
      details: Record<string, unknown> = {},
    ) => {
      currentStage = stage;
      debugInit(checkpoint, stage, details);
      armStageWatchdog();
    };

    debugInit("1", "component mounted", { mountCount: mountCountRef.current });
    armStageWatchdog();

    if (!containerRef.current || mapRef.current) {
      if (!containerRef.current) {
        advanceStage("2", "container ref missing");
        failInitialization(new Error("map container ref unavailable"));
      }
      return () => {
        cancelled = true;
        clearReadinessTimer();
        clearStageWatchdog();
        debugInit("cleanup", "component cleanup", { mountCount: mountCountRef.current });
      };
    }

    const container = containerRef.current;
    const containerSize = getMapContainerSize(container);
    advanceStage("2", "container ref available", containerSize);
    advanceStage("3", "container dimensions confirmed", containerSize);

    if (process.env.NODE_ENV !== "production" && "serviceWorker" in navigator) {
      void navigator.serviceWorker.getRegistrations()
        .then((registrations) => {
          debugInit("diagnostic", "service worker state", {
            registrations: registrations.length,
          });
        })
        .catch(() => {
          debugInit("diagnostic", "service worker state unavailable");
        });
    }

    const markReady = () => {
      if (cancelled) {
        return;
      }

      clearReadinessTimer();
      clearStageWatchdog();
      setMapStatus("ready");
      setFallbackMessage(null);
      debugInit("18", "ready state set");
      debugMap("ready", {
        loaded: map?.loaded() ?? false,
        styleLoaded: map?.isStyleLoaded() ?? false,
      });
    };

    async function setupMap() {
      try {
        if (resolvedBasemapConfig.status !== "ready") {
          throw new Error(createPmtilesConfigErrorMessage(resolvedBasemapConfig.publicPath));
        }

        const basemapConfig = resolvedBasemapConfig;
        advanceStage("4", "dynamic MapLibre import started");
        const maplibreModule = await import("maplibre-gl");
        maplibreRef.current = maplibreModule;
        advanceStage("5", "dynamic MapLibre import completed");

        advanceStage("6", "PMTiles module import started");
        const { registerPmtilesArchive } = await import("@/lib/map/pmtiles-protocol");
        advanceStage("7", "PMTiles module import completed");

        advanceStage("8", "PMTiles protocol registration started");
        registerPmtilesArchive(basemapConfig.sourceUrl);
        advanceStage("9", "PMTiles protocol registration completed");

        advanceStage("10", "style construction started");
        const style = createLocalPmtilesMapStyle(basemapConfig.sourceUrl);
        if (style.version !== 8 || !style.sources.basemap || style.layers.length === 0) {
          throw new Error("invalid local map style");
        }
        advanceStage("11", "style construction completed", {
          version: style.version,
          sourceNames: Object.keys(style.sources),
          layerCount: style.layers.length,
        });

        const resolvedPmtilesUrl = new URL(basemapConfig.publicPath, window.location.href);
        advanceStage("12", "PMTiles URL resolved", {
          origin: resolvedPmtilesUrl.origin,
          pathname: resolvedPmtilesUrl.pathname,
        });

        advanceStage("12a", "PMTiles range preflight started");
        const preflight = await preflightPmtilesArchive(basemapConfig.publicPath);
        if (preflight.status !== "ready") {
          throw new Error(`PMTiles preflight ${preflight.reason}`);
        }
        advanceStage("12b", "PMTiles range preflight completed", {
          httpStatus: preflight.httpStatus,
          byteLength: preflight.byteLength,
          rangeSupported: preflight.rangeSupported,
        });

        const maplibreRuntime = maplibreModule as MapLibreModule & {
          supported?: () => boolean;
        };
        const canvas = document.createElement("canvas");
        const webgl = Boolean(canvas.getContext("webgl"));
        const webgl2 = Boolean(canvas.getContext("webgl2"));
        const worker = typeof Worker !== "undefined";
        const supported = typeof maplibreRuntime.supported === "function"
          ? maplibreRuntime.supported()
          : true;
        debugInit("diagnostic", "browser capabilities", {
          supported,
          webgl,
          webgl2,
          worker,
        });
        if (!supported || !worker || (!webgl && !webgl2)) {
          throw new Error("MapLibre browser capabilities are unavailable");
        }

        advanceStage("13", "MapLibre constructor called");
        map = new maplibreModule.Map({
          container,
          style,
          center: [...defaultMapCenter],
          zoom: defaultMapZoom,
          attributionControl: false,
        });
        advanceStage("14", "MapLibre constructor returned", getMapContainerSize(container));

        if (cancelled) {
          map.remove();
          map = null;
          return;
        }

        const mapInstance = map;
        if (!mapInstance) {
          throw new Error("MapLibre constructor returned no map instance");
        }

        const markReadyFromEvent = (checkpoint: string, event: string) => {
          debugInit(checkpoint, event, {
            loaded: mapInstance.loaded(),
            styleLoaded: mapInstance.isStyleLoaded(),
          });
          markReady();
        };

        const handleMapError = (event: ErrorEvent) => {
          if (cancelled || !event.error) {
            return;
          }

          const terminal = isTerminalMapError(event as unknown as { sourceId?: string; source?: unknown; tile?: unknown });
          debugMap(terminal ? "error" : "nonfatal_error", {
            terminal,
            message: event.error instanceof Error ? event.error.message : "map error",
            loaded: mapInstance.loaded(),
            styleLoaded: mapInstance.isStyleLoaded(),
          });

          if (terminal && !isMapReady(mapInstance)) {
            markError("地图暂时无法加载");
          }
        };

        mapInstance.on("error", handleMapError);
        mapInstance.once("load", () => markReadyFromEvent("16", "load"));
        mapInstance.once("style.load", () => markReadyFromEvent("15", "style.load"));
        mapInstance.once("idle", () => markReadyFromEvent("17", "idle"));

        if (isMapReady(mapInstance)) {
          markReadyFromEvent("18", "already_ready");
        }

        const refreshClusters = () => {
          if (!cancelled) {
            renderMarkers(false);
          }
        };

        const resizeMap = () => {
          if (cancelled || resizeFrame !== null) {
            return;
          }

          resizeFrame = window.requestAnimationFrame(() => {
            resizeFrame = null;
            if (!cancelled) {
              mapInstance.resize();
            }
          });
        };

        const handleMapClick = (event: MapMouseEvent) => {
          if (!onLocationChangeRef.current) {
            return;
          }

          onLocationChangeRef.current({
            latitude: event.lngLat.lat,
            longitude: event.lngLat.lng,
          });
        };

        mapInstance.on("zoomend", refreshClusters);
        mapInstance.on("click", handleMapClick);
        window.addEventListener("resize", resizeMap);
        window.visualViewport?.addEventListener("resize", resizeMap);
        window.addEventListener("orientationchange", resizeMap);

        const resizeObserver = typeof ResizeObserver === "undefined"
          ? null
          : new ResizeObserver(resizeMap);
        resizeObserver?.observe(containerRef.current!);
        resizeMap();

        mapInstance.addControl(
          new maplibreModule.NavigationControl({
            showCompass: false,
            visualizePitch: false,
          }),
          "top-right",
        );

        mapRef.current = mapInstance;
        renderMarkers(true);
        syncEditableMarker();

        readinessTimer = window.setInterval(() => {
          if (cancelled) {
            return;
          }

          readinessChecks += 1;
          debugMap("readiness_check", {
            check: readinessChecks,
            loaded: mapInstance.loaded(),
            styleLoaded: mapInstance.isStyleLoaded(),
            ...getMapContainerSize(containerRef.current),
          });

          if (isMapReady(mapInstance)) {
            markReady();
          } else if (readinessChecks >= 50) {
            failInitialization(new Error("MapLibre readiness did not complete"));
          }
        }, 100);

        const removeMapListeners = () => {
          clearReadinessTimer();
          if (resizeFrame !== null) {
            window.cancelAnimationFrame(resizeFrame);
            resizeFrame = null;
          }
          resizeObserver?.disconnect();
          mapInstance.off("error", handleMapError);
          mapInstance.off("zoomend", refreshClusters);
          mapInstance.off("click", handleMapClick);
          window.removeEventListener("resize", resizeMap);
          window.visualViewport?.removeEventListener("resize", resizeMap);
          window.removeEventListener("orientationchange", resizeMap);
          debugMap("cleanup");
        };

        mapInstance.once("remove", removeMapListeners);
      } catch (error) {
        if (!cancelled) {
          failInitialization(error);
        }
      }
    }

    void setupMap();

    return () => {
      cancelled = true;

      const mapToRemove = mapRef.current ?? map;

      if (mapToRemove) {
        markerCleanupRef.current?.();
        markerCleanupRef.current = null;
        editableMarkerRef.current?.remove();
        editableMarkerRef.current = null;
        mapToRemove.remove();
        mapRef.current = null;
      }
      maplibreRef.current = null;
      map = null;
      clearReadinessTimer();
      clearStageWatchdog();
      debugInit("cleanup", "component cleanup", { mountCount: mountCountRef.current });
    };
  }, [retryNonce]);

  function retryMap() {
    markerCleanupRef.current?.();
    markerCleanupRef.current = null;
    editableMarkerRef.current?.remove();
    editableMarkerRef.current = null;
    setFallbackMessage(null);
    setMapStatus("loading");
    setRetryNonce((value) => value + 1);
  }

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
      {mapStatus === "loading" && !fallbackMessage ? (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-[linear-gradient(180deg,rgba(255,255,255,0.76),rgba(255,243,234,0.92))] p-5 text-center text-sm leading-7 text-[var(--ink-soft)]">
          <div className="space-y-2">
            <div className="mx-auto h-8 w-8 animate-pulse rounded-full border-4 border-orange-100 border-t-[var(--accent)]" />
            <p>正在加载本地地图...</p>
          </div>
        </div>
      ) : null}
      {mapStatus === "error" && fallbackMessage ? (
        <div className="absolute inset-0 flex items-center justify-center bg-[linear-gradient(180deg,rgba(255,255,255,0.84),rgba(255,243,234,0.96))] p-5 text-center text-sm leading-7 text-[var(--ink-soft)]">
          <div className="max-w-xs rounded-[22px] border border-orange-100 bg-white/92 p-5 shadow-[0_16px_36px_rgba(122,61,21,0.12)]">
            <p className="font-semibold text-[var(--ink-strong)]">地图暂时无法加载</p>
            <p className="mt-2">{fallbackMessage}</p>
            <button type="button" className="primary-button mt-4" onClick={retryMap}>
              重新加载
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
