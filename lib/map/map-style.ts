export const defaultMapCenter = [104, 35] as const;
export const defaultMapZoom = 2.4;

export function createLocalEmptyMapStyle() {
  return {
    version: 8 as const,
    name: "cunge-di-empty-style",
    center: [...defaultMapCenter] as [number, number],
    zoom: defaultMapZoom,
    sources: {},
    layers: [
      {
        id: "foundation-background",
        type: "background" as const,
        paint: {
          "background-color": "#fff5ed",
        },
      },
    ],
  };
}
