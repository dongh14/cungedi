import assert from "node:assert/strict";
import test from "node:test";
import { createLocalPmtilesMapStyle } from "./map-style.ts";
import { resolvePmtilesBasemapConfig } from "./pmtiles-config.ts";

const knownArchive = {
  tileType: "vector",
  minZoom: 0,
  maxZoom: 8,
  bounds: [73.5, 18, 135.1, 53.6],
  vectorLayers: new Set([
    "boundaries",
    "buildings",
    "earth",
    "landcover",
    "landuse",
    "places",
    "pois",
    "roads",
    "water",
  ]),
};

test("production PMTiles style matches the known vector archive metadata", () => {
  const config = resolvePmtilesBasemapConfig({
    configuredUrl: "https://tqpygxpquueuyl94.public.blob.vercel-storage.com/base.pmtiles",
    environment: "production",
  });

  assert.equal(config.status, "ready");
  if (config.status !== "ready") {
    return;
  }

  const style = createLocalPmtilesMapStyle(config.sourceUrl);
  const source = style.sources.basemap;

  assert.equal(knownArchive.tileType, "vector");
  assert.equal(source.type, "vector");
  assert.equal(source.url, "pmtiles://https://tqpygxpquueuyl94.public.blob.vercel-storage.com/base.pmtiles");

  const baseLayers = style.layers.filter((layer) => layer.source === "basemap");
  assert.ok(baseLayers.length > 0);
  assert.ok(baseLayers.every((layer) => knownArchive.vectorLayers.has(layer["source-layer"])));
  assert.ok(baseLayers.every((layer) => (layer.minzoom ?? 0) <= knownArchive.maxZoom));
  assert.ok(baseLayers.every((layer) => (layer.maxzoom ?? knownArchive.maxZoom) >= knownArchive.minZoom));
  assert.equal(style.layers[0].type, "background");
});
