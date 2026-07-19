export type MapReadinessProbe = {
  loaded: () => boolean | void;
  isStyleLoaded: () => boolean | void;
};

export type MapErrorLike = {
  sourceId?: string;
  source?: unknown;
  tile?: unknown;
};

export function isMapReady(map: MapReadinessProbe) {
  return Boolean(map.loaded() || map.isStyleLoaded());
}

export function isTerminalMapError(event: MapErrorLike) {
  return !event.sourceId && !event.source && !event.tile;
}

export function getMapContainerSize(element: HTMLElement | null) {
  if (!element) {
    return { width: 0, height: 0 };
  }

  const rect = element.getBoundingClientRect();
  return {
    width: Math.round(rect.width),
    height: Math.round(rect.height),
  };
}
