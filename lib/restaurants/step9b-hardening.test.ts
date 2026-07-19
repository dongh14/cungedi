import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const root = process.cwd();
const read = (path: string) => readFileSync(`${root}/${path}`, "utf8");

test("PWA manifest uses the auth-aware root and approved app icon", () => {
  const manifest = read("app/manifest.ts");

  assert.match(manifest, /start_url: "\/"/u);
  assert.match(manifest, /scope: "\/"/u);
  assert.match(manifest, /display: "standalone"/u);
  assert.match(manifest, /src: "\/icon\.svg"/u);
});

test("mobile shell and sticky controls include safe-area handling", () => {
  const css = read("app/globals.css");

  assert.match(css, /\.app-shell[\s\S]*env\(safe-area-inset-bottom/u);
  assert.match(css, /\.app-topbar[\s\S]*env\(safe-area-inset-top/u);
  assert.match(css, /\.login-page[\s\S]*env\(safe-area-inset-top/u);
  assert.match(css, /\.bottom-sheet-overlay[\s\S]*env\(safe-area-inset-bottom/u);
  assert.match(css, /\.review-final-action[\s\S]*env\(safe-area-inset-bottom/u);
});

test("forms keep mobile keyboard actions and focused fields reachable", () => {
  const authCard = read("components/auth-card.tsx");
  const passwordField = read("components/password-field.tsx");
  const css = read("app/globals.css");

  assert.match(authCard, /enterKeyHint="next"/u);
  assert.match(authCard, /enterKeyHint="done"/u);
  assert.match(passwordField, /enterKeyHint/u);
  assert.match(css, /scroll-margin-bottom: max\(120px/u);
});

test("bottom sheets trap focus and restore the original trigger", () => {
  const sheet = read("components/bottom-sheet.tsx");

  assert.match(sheet, /triggerRef\.current = document\.activeElement/u);
  assert.match(sheet, /sheetRef\.current\?\.querySelectorAll/u);
  assert.match(sheet, /aria-modal="true"/u);
  assert.match(sheet, /delete document\.body\.dataset\.sheetOpen/u);
});

test("route errors provide retry and safe navigation without exposing details", () => {
  const errorState = read("components/route-error-state.tsx");

  assert.match(errorState, /重试/u);
  assert.match(errorState, /回到首页/u);
  assert.doesNotMatch(errorState, /error\.message/u);
  assert.match(errorState, /NODE_ENV === "development"/u);
});

test("auth actions sanitize provider errors before redirecting", () => {
  const actions = read("app/auth/actions.ts");

  assert.match(actions, /getSafeLoginErrorMessage\(error\.message\)/u);
  assert.match(actions, /getSafeSignUpErrorMessage\(error\.message\)/u);
  assert.doesNotMatch(actions, /buildRedirect\("\/login", \{ error: error\.message \}\)/u);
  assert.doesNotMatch(actions, /buildRedirect\("\/sign-up", \{ error: error\.message \}\)/u);
});

test("MapLibre cluster updates do not use React zoom state or duplicate map setup", () => {
  const map = read("components/maplibre-foundation.tsx");

  assert.doesNotMatch(map, /const \[renderZoom/u);
  assert.match(map, /mapInstance\.on\("zoomend", refreshClusters\)/u);
  assert.match(map, /mapInstance\.resize\(\)/u);
  assert.match(map, /mapToRemove\.remove\(\)/u);
});

test("MapLibre loading uses multiple readiness events and a real readiness probe", () => {
  const map = read("components/maplibre-foundation.tsx");

  assert.match(map, /\[map-init\]/u);
  assert.match(map, /dynamic MapLibre import started/u);
  assert.match(map, /PMTiles range preflight started/u);
  assert.match(map, /MapLibre constructor called/u);
  assert.match(map, /MapLibre constructor returned/u);
  assert.match(map, /failInitialization/u);
  assert.match(map, /currentStage/u);
  assert.match(map, /mapInstance\.once\("load"/u);
  assert.match(map, /mapInstance\.once\("style\.load"/u);
  assert.match(map, /mapInstance\.once\("idle"/u);
  assert.match(map, /mapInstance\.loaded\(\)/u);
  assert.match(map, /mapInstance\.isStyleLoaded\(\)/u);
  assert.match(map, /setMapStatus\("ready"\)/u);
  assert.match(map, /setMapStatus\("error"\)/u);
  assert.match(map, /重新加载/u);
  assert.match(map, /ResizeObserver/u);
  assert.match(map, /pointer-events-none/u);
});

test("PMTiles registration is global and not removed during map cleanup", () => {
  const protocol = read("lib/map/pmtiles-protocol.ts");

  assert.match(protocol, /Symbol\.for\("cunge-di\.pmtiles\.protocol-state"\)/u);
  assert.match(protocol, /registered: boolean/u);
  assert.doesNotMatch(protocol, /removeProtocol/u);
});
