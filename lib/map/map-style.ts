import type { StyleSpecification } from "maplibre-gl";

export const defaultMapCenter = [104, 35] as const;
export const defaultMapZoom = 2.4;

export function createLocalPmtilesMapStyle(sourceUrl: string): StyleSpecification {
  return {
    version: 8 as const,
    name: "cunge-di-pmtiles-style",
    center: [...defaultMapCenter] as [number, number],
    zoom: defaultMapZoom,
    sources: {
      basemap: {
        type: "vector" as const,
        url: sourceUrl,
        attribution: "© OpenStreetMap contributors",
      },
    },
    layers: [
      {
        id: "map-background",
        type: "background" as const,
        paint: {
          "background-color": "#fff5ed",
        },
      },
      {
        id: "landuse-fill",
        type: "fill" as const,
        source: "basemap",
        "source-layer": "landuse",
        paint: {
          "fill-color": "#f7ead8",
          "fill-opacity": 0.72,
        },
      },
      {
        id: "water-fill",
        type: "fill" as const,
        source: "basemap",
        "source-layer": "water",
        paint: {
          "fill-color": "#dcecff",
          "fill-opacity": 0.92,
        },
      },
      {
        id: "boundary-line",
        type: "line" as const,
        source: "basemap",
        "source-layer": "boundaries",
        paint: {
          "line-color": "#d97745",
          "line-opacity": 0.55,
          "line-width": 1,
        },
      },
      {
        id: "road-line",
        type: "line" as const,
        source: "basemap",
        "source-layer": "roads",
        paint: {
          "line-color": "#ffffff",
          "line-opacity": 0.9,
          "line-width": 1.25,
        },
      },
    ],
  };
}
