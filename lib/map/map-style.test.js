import assert from "node:assert/strict";
import test from "node:test";
import {
  createLocalPmtilesMapStyle,
  defaultMapCenter,
  defaultMapZoom,
} from "./map-style.ts";
import {
  createPmtilesConfigErrorMessage,
  createPmtilesMissingFileMessage,
  resolvePmtilesBasemapConfig,
} from "./pmtiles-config.ts";

test("creates a local PMTiles MapLibre style without external hosted resources", () => {
  const style = createLocalPmtilesMapStyle("pmtiles:///maps/base.pmtiles");

  assert.equal(style.version, 8);
  assert.equal(style.name, "cunge-di-pmtiles-style");
  assert.deepEqual(style.center, [...defaultMapCenter]);
  assert.equal(style.zoom, defaultMapZoom);
  assert.equal(style.sources.basemap.type, "vector");
  assert.equal(style.sources.basemap.url, "pmtiles:///maps/base.pmtiles");
  assert.equal(style.layers.length, 5);
  assert.equal(style.layers[0]?.type, "background");
  assert.equal(style.layers[0]?.id, "map-background");
  assert.equal(style.layers[0]?.paint["background-color"], "#fff5ed");
  assert.equal("glyphs" in style, false);
  assert.equal("sprite" in style, false);
});

test("returns a fresh style object for each map instance", () => {
  const firstStyle = createLocalPmtilesMapStyle("pmtiles:///maps/base.pmtiles");
  const secondStyle = createLocalPmtilesMapStyle("pmtiles:///maps/base.pmtiles");

  firstStyle.center[0] = 0;
  firstStyle.layers[0].paint["background-color"] = "#000000";
  firstStyle.sources.basemap.url = "pmtiles:///maps/other.pmtiles";

  assert.deepEqual(secondStyle.center, [...defaultMapCenter]);
  assert.equal(secondStyle.layers[0]?.paint["background-color"], "#fff5ed");
  assert.equal(secondStyle.sources.basemap.url, "pmtiles:///maps/base.pmtiles");
});

test("resolves the default local PMTiles path when no env override is present", () => {
  const config = resolvePmtilesBasemapConfig({
    configuredUrl: "",
    environment: "development",
  });

  assert.deepEqual(config, {
    status: "ready",
    publicPath: "/maps/base.pmtiles",
    requestUrl: "/maps/base.pmtiles",
    sourceUrl: "pmtiles:///maps/base.pmtiles",
    storage: "local",
  });
});

test("accepts a same-origin public PMTiles override", () => {
  const config = resolvePmtilesBasemapConfig({
    configuredUrl: "",
    environment: "development",
    localPath: "/maps/china.pmtiles",
  });

  assert.deepEqual(config, {
    status: "ready",
    publicPath: "/maps/china.pmtiles",
    requestUrl: "/maps/china.pmtiles",
    sourceUrl: "pmtiles:///maps/china.pmtiles",
    storage: "local",
  });
});

test("accepts a configured remote PMTiles URL", () => {
  const config = resolvePmtilesBasemapConfig({
    configuredUrl: "https://tiles.example.com/base.pmtiles",
    environment: "production",
  });

  assert.deepEqual(config, {
    status: "ready",
    publicPath: "https://tiles.example.com/base.pmtiles",
    requestUrl: "https://tiles.example.com/base.pmtiles",
    sourceUrl: "pmtiles://https://tiles.example.com/base.pmtiles",
    storage: "remote",
  });
});

test("keeps fallback copy in simplified Chinese for missing files and config problems", () => {
  assert.match(
    createPmtilesMissingFileMessage("/maps/base.pmtiles"),
    /未找到本地 PMTiles 底图文件/u,
  );
  assert.match(
    createPmtilesConfigErrorMessage("tiles/base.pmtiles"),
    /PMTiles 路径配置无效/u,
  );
});

test("style does not reference external tile, sprite, or glyph hosts", () => {
  const style = createLocalPmtilesMapStyle("pmtiles:///maps/base.pmtiles");
  const serializedStyle = JSON.stringify(style);

  assert.equal(serializedStyle.includes("http://"), false);
  assert.equal(serializedStyle.includes("https://"), false);
  assert.equal("glyphs" in style, false);
  assert.equal("sprite" in style, false);
});
