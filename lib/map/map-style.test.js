import assert from "node:assert/strict";
import test from "node:test";
import {
  createLocalEmptyMapStyle,
  defaultMapCenter,
  defaultMapZoom,
} from "./map-style.ts";

test("creates a local MapLibre style without external resources", () => {
  const style = createLocalEmptyMapStyle();

  assert.equal(style.version, 8);
  assert.equal(style.name, "cunge-di-empty-style");
  assert.deepEqual(style.center, [...defaultMapCenter]);
  assert.equal(style.zoom, defaultMapZoom);
  assert.deepEqual(style.sources, {});
  assert.equal(style.layers.length, 1);
  assert.equal(style.layers[0]?.type, "background");
  assert.equal(style.layers[0]?.id, "foundation-background");
  assert.equal(style.layers[0]?.paint["background-color"], "#fff5ed");
  assert.equal("glyphs" in style, false);
  assert.equal("sprite" in style, false);
});

test("returns a fresh style object for each map instance", () => {
  const firstStyle = createLocalEmptyMapStyle();
  const secondStyle = createLocalEmptyMapStyle();

  firstStyle.center[0] = 0;
  firstStyle.layers[0].paint["background-color"] = "#000000";

  assert.deepEqual(secondStyle.center, [...defaultMapCenter]);
  assert.equal(secondStyle.layers[0]?.paint["background-color"], "#fff5ed");
});
