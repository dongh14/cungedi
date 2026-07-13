import assert from "node:assert/strict";
import test from "node:test";
import {
  createClusteredMapMarkerFeatures,
  defaultMaxClusterZoom,
} from "./marker-clusters.ts";

const markers = [
  {
    id: 1,
    name: "上海精确地点",
    city: "上海",
    category: "美食",
    address: "黄浦区外滩 1 号",
    latitude: 31.2304,
    longitude: 121.4737,
    precision: "exact",
    approximate: false,
  },
  {
    id: 2,
    name: "上海近似地点",
    city: "Shanghai City",
    category: "景点",
    address: null,
    latitude: 31.2309,
    longitude: 121.4742,
    precision: "city",
    approximate: true,
  },
  {
    id: 3,
    name: "成都地点",
    city: "成都",
    category: "景点",
    address: "锦江区春熙路 8 号",
    latitude: 30.5728,
    longitude: 104.0668,
    precision: "exact",
    approximate: false,
  },
];

test("nearby markers can be grouped into a cluster at lower zoom levels", () => {
  const features = createClusteredMapMarkerFeatures(markers, 8);
  const cluster = features.find((feature) => feature.kind === "cluster");

  assert.equal(features.length, 2);
  assert.equal(cluster?.kind, "cluster");
  assert.equal(cluster?.pointCount, 2);
});

test("cluster expansion returns individual markers at higher zoom levels", () => {
  const features = createClusteredMapMarkerFeatures(
    markers,
    defaultMaxClusterZoom + 1,
  );

  assert.deepEqual(
    features.map((feature) => feature.kind),
    ["marker", "marker", "marker"],
  );
});

test("exact and approximate marker metadata survives clustering", () => {
  const features = createClusteredMapMarkerFeatures(markers, 8);
  const cluster = features.find((feature) => feature.kind === "cluster");
  const standaloneMarker = features.find(
    (feature) => feature.kind === "marker" && feature.marker.id === 3,
  );

  assert.equal(cluster?.kind, "cluster");
  assert.equal(cluster?.exactCount, 1);
  assert.equal(cluster?.approximateCount, 1);
  assert.deepEqual(
    cluster?.markers.map((marker) => ({
      id: marker.id,
      approximate: marker.approximate,
      precision: marker.precision,
    })),
    [
      { id: 1, approximate: false, precision: "exact" },
      { id: 2, approximate: true, precision: "city" },
    ],
  );
  assert.equal(standaloneMarker?.kind, "marker");
  assert.equal(standaloneMarker?.marker.approximate, false);
});
