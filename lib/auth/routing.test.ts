import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const root = process.cwd();
const read = (path: string) => readFileSync(`${root}/${path}`, "utf8");

test("root route redirects users directly into the auth or dashboard flow", () => {
  const rootPage = read("app/page.tsx");

  assert.match(rootPage, /redirect\(user \? "\/dashboard" : "\/login"\)/u);
  assert.doesNotMatch(rootPage, /STEP 6|导航外壳|Supabase 设置|先注册账号|setup/u);
});

test("authentication pages redirect authenticated users without creating a loop", () => {
  assert.match(read("app/login/page.tsx"), /getAuthenticatedUser/u);
  assert.match(read("app/login/page.tsx"), /redirect\("\/dashboard"\)/u);
  assert.match(read("app/sign-up/page.tsx"), /getAuthenticatedUser/u);
  assert.match(read("app/sign-up/page.tsx"), /redirect\("\/dashboard"\)/u);
});

test("login and sign-up keep their direct alternate routes", () => {
  assert.match(read("app/login/page.tsx"), /alternateHref="\/sign-up"/u);
  assert.match(read("app/sign-up/page.tsx"), /alternateHref="\/login"/u);
  assert.doesNotMatch(read("app/login/page.tsx"), /href="\/setup"/u);
  assert.doesNotMatch(read("app/sign-up/page.tsx"), /href="\/setup"/u);
});

test("protected place routes keep the shared authentication guard", () => {
  for (const route of [
    "app/dashboard/page.tsx",
    "app/restaurants/page.tsx",
    "app/collections/page.tsx",
    "app/map/page.tsx",
    "app/settings/page.tsx",
  ]) {
    assert.match(read(route), /requireAuthenticatedUser/u, route);
  }
});

test("setup diagnostics are not exposed in production", () => {
  const setupPage = read("app/setup/page.tsx");

  assert.match(setupPage, /import \{ notFound \} from "next\/navigation"/u);
  assert.match(setupPage, /process\.env\.NODE_ENV === "production"/u);
  assert.match(setupPage, /notFound\(\)/u);
});

test("production config fails clearly when required Supabase variables are missing", () => {
  const nextConfig = read("next.config.ts");

  assert.match(nextConfig, /process\.env\.NODE_ENV === "production"/u);
  assert.match(nextConfig, /NEXT_PUBLIC_SUPABASE_URL/u);
  assert.match(nextConfig, /NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY/u);
  assert.match(nextConfig, /NEXT_PUBLIC_PMTILES_URL/u);
  assert.match(nextConfig, /Missing required production environment variables/u);
});
