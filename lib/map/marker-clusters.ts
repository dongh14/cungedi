import type { PlaceMarkerData } from "./place-markers.ts";

export type ClusteredMapMarkerFeature =
  | {
      kind: "marker";
      marker: PlaceMarkerData;
    }
  | {
      kind: "cluster";
      id: string;
      latitude: number;
      longitude: number;
      pointCount: number;
      exactCount: number;
      approximateCount: number;
      markers: PlaceMarkerData[];
    };

export type MarkerClusterOptions = {
  radiusPx?: number;
  minPoints?: number;
  maxClusterZoom?: number;
};

export const defaultClusterRadiusPx = 56;
export const defaultClusterMinPoints = 2;
export const defaultMaxClusterZoom = 12;

type ProjectedMarker = {
  marker: PlaceMarkerData;
  x: number;
  y: number;
};

const worldTileSize = 512;

function projectLongitude(longitude: number, scale: number) {
  return ((longitude + 180) / 360) * scale;
}

function projectLatitude(latitude: number, scale: number) {
  const radians = (latitude * Math.PI) / 180;
  const sinValue = Math.min(Math.max(Math.sin(radians), -0.9999), 0.9999);

  return (
    (0.5 - Math.log((1 + sinValue) / (1 - sinValue)) / (4 * Math.PI)) * scale
  );
}

function createProjectedMarkers(markers: PlaceMarkerData[], zoom: number): ProjectedMarker[] {
  const scale = worldTileSize * 2 ** zoom;

  return markers.map((marker) => ({
    marker,
    x: projectLongitude(marker.longitude, scale),
    y: projectLatitude(marker.latitude, scale),
  }));
}

function squaredDistance(first: ProjectedMarker, second: ProjectedMarker) {
  const deltaX = first.x - second.x;
  const deltaY = first.y - second.y;

  return deltaX * deltaX + deltaY * deltaY;
}

export function createClusteredMapMarkerFeatures(
  markers: PlaceMarkerData[],
  zoom: number,
  options: MarkerClusterOptions = {},
): ClusteredMapMarkerFeature[] {
  const radiusPx = options.radiusPx ?? defaultClusterRadiusPx;
  const minPoints = options.minPoints ?? defaultClusterMinPoints;
  const maxClusterZoom = options.maxClusterZoom ?? defaultMaxClusterZoom;

  if (markers.length === 0) {
    return [];
  }

  if (zoom > maxClusterZoom) {
    return markers.map((marker) => ({
      kind: "marker",
      marker,
    }));
  }

  const projectedMarkers = createProjectedMarkers(markers, zoom);
  const radiusSquared = radiusPx * radiusPx;
  const bucketSize = radiusPx;
  const buckets = new Map<string, number[]>();

  projectedMarkers.forEach((projectedMarker, index) => {
    const bucketX = Math.floor(projectedMarker.x / bucketSize);
    const bucketY = Math.floor(projectedMarker.y / bucketSize);
    const bucketKey = `${bucketX}:${bucketY}`;
    const bucketIndexes = buckets.get(bucketKey);

    if (bucketIndexes) {
      bucketIndexes.push(index);
      return;
    }

    buckets.set(bucketKey, [index]);
  });

  const visited = new Set<number>();
  const features: ClusteredMapMarkerFeature[] = [];

  projectedMarkers.forEach((projectedMarker, index) => {
    if (visited.has(index)) {
      return;
    }

    const bucketX = Math.floor(projectedMarker.x / bucketSize);
    const bucketY = Math.floor(projectedMarker.y / bucketSize);
    const clusterIndexes = new Set<number>([index]);
    const queue = [index];

    while (queue.length > 0) {
      const currentIndex = queue.pop()!;
      const currentMarker = projectedMarkers[currentIndex];
      const currentBucketX = Math.floor(currentMarker.x / bucketSize);
      const currentBucketY = Math.floor(currentMarker.y / bucketSize);

      for (let offsetX = -1; offsetX <= 1; offsetX += 1) {
        for (let offsetY = -1; offsetY <= 1; offsetY += 1) {
          const nearbyBucket = buckets.get(
            `${currentBucketX + offsetX}:${currentBucketY + offsetY}`,
          );

          if (!nearbyBucket) {
            continue;
          }

          nearbyBucket.forEach((nearbyIndex) => {
            if (clusterIndexes.has(nearbyIndex)) {
              return;
            }

            if (
              squaredDistance(currentMarker, projectedMarkers[nearbyIndex]) >
              radiusSquared
            ) {
              return;
            }

            clusterIndexes.add(nearbyIndex);
            queue.push(nearbyIndex);
          });
        }
      }
    }

    clusterIndexes.forEach((clusterIndex) => visited.add(clusterIndex));

    if (clusterIndexes.size < minPoints) {
      features.push({
        kind: "marker",
        marker: projectedMarker.marker,
      });
      return;
    }

    const clusterMarkers = [...clusterIndexes].map(
      (clusterIndex) => projectedMarkers[clusterIndex].marker,
    );
    const exactCount = clusterMarkers.filter((marker) => !marker.approximate).length;
    const approximateCount = clusterMarkers.length - exactCount;
    const latitude =
      clusterMarkers.reduce((sum, marker) => sum + marker.latitude, 0) /
      clusterMarkers.length;
    const longitude =
      clusterMarkers.reduce((sum, marker) => sum + marker.longitude, 0) /
      clusterMarkers.length;

    features.push({
      kind: "cluster",
      id: `cluster:${clusterMarkers.map((marker) => marker.id).sort((a, b) => a - b).join("-")}`,
      latitude,
      longitude,
      pointCount: clusterMarkers.length,
      exactCount,
      approximateCount,
      markers: clusterMarkers,
    });
  });

  return features;
}
