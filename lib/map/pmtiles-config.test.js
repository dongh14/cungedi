import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  getPmtilesUrl,
  resolvePmtilesBasemapConfig,
} from "./pmtiles-config.ts";
import { preflightPmtilesArchive } from "./pmtiles-preflight.ts";

const root = process.cwd();
const read = (path) => readFileSync(`${root}/${path}`, "utf8");

test("local development falls back to the same-origin base PMTiles path", () => {
  assert.equal(getPmtilesUrl({ environment: "development" }), "/maps/base.pmtiles");
  assert.equal(
    getPmtilesUrl({ environment: "development", origin: "https://app.example" }),
    "https://app.example/maps/base.pmtiles",
  );
});

test("configured public PMTiles URL is shared by the map and preflight", async () => {
  const config = resolvePmtilesBasemapConfig({
    configuredUrl: "https://store.public.blob.vercel-storage.com/maps/base-v1.pmtiles",
    environment: "production",
    origin: "https://app.example",
  });

  assert.equal(config.status, "ready");
  if (config.status !== "ready") {
    return;
  }

  assert.equal(config.storage, "remote");
  assert.equal(config.requestUrl, "https://store.public.blob.vercel-storage.com/maps/base-v1.pmtiles");
  assert.equal(config.sourceUrl, `pmtiles://${config.requestUrl}`);

  let requestedUrl = "";
  const result = await preflightPmtilesArchive(config.requestUrl, {
    fetchImpl: async (input, init) => {
      requestedUrl = String(input);
      assert.equal(init?.headers?.Range, "bytes=0-126");
      return new Response(new Uint8Array([1, 2, 3]), {
        status: 206,
        headers: { "content-range": "bytes 0-2/3" },
      });
    },
  });

  assert.equal(requestedUrl, config.requestUrl);
  assert.equal(result.status, "ready");
});

test("malformed and insecure production URLs fail clearly", () => {
  assert.throws(
    () => getPmtilesUrl({ configuredUrl: "not-a-url", environment: "production" }),
    /must be a valid URL/u,
  );
  assert.throws(
    () => getPmtilesUrl({
      configuredUrl: "http://store.example/maps/base-v1.pmtiles",
      environment: "production",
    }),
    /must use HTTPS/u,
  );

  const missing = resolvePmtilesBasemapConfig({ environment: "production" });
  assert.equal(missing.status, "config-error");
  assert.equal(missing.reason, "missing-production-url");

  const invalidLocalPath = resolvePmtilesBasemapConfig({
    configuredUrl: "",
    localPath: "maps/base.pmtiles",
    environment: "development",
  });
  assert.equal(invalidLocalPath.status, "config-error");
  assert.equal(invalidLocalPath.reason, "invalid-public-path");
});

test("the resolver does not hardcode local network origins or Blob write tokens", () => {
  const resolver = read("lib/map/pmtiles-config.ts");
  const browserMap = read("components/maplibre-foundation.tsx");

  assert.doesNotMatch(resolver, /localhost|192\.168\./u);
  assert.doesNotMatch(browserMap, /BLOB_READ_WRITE_TOKEN|BLOB_STORE_ID/u);
});

test("deployment docs require the immutable versioned Blob pathname", () => {
  const checklist = read("memory-bank/deployment-checklist.md");

  assert.match(checklist, /NEXT_PUBLIC_PMTILES_URL/u);
  assert.match(checklist, /maps\/base-v1\.pmtiles/u);
  assert.match(checklist, /vercel blob put/u);
  assert.match(checklist, /Range/u);
});
