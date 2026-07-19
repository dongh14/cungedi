import assert from "node:assert/strict";
import test from "node:test";
import { isMapReady, isTerminalMapError } from "./map-readiness.ts";

test("map readiness accepts either loaded or style-loaded state", () => {
  assert.equal(isMapReady({ loaded: () => true, isStyleLoaded: () => false }), true);
  assert.equal(isMapReady({ loaded: () => false, isStyleLoaded: () => true }), true);
  assert.equal(isMapReady({ loaded: () => false, isStyleLoaded: () => false }), false);
});

test("source and tile errors are non-terminal while the base map can continue loading", () => {
  assert.equal(isTerminalMapError({ sourceId: "basemap" }), false);
  assert.equal(isTerminalMapError({ tile: {} }), false);
  assert.equal(isTerminalMapError({}), true);
});
