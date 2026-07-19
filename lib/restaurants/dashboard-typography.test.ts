import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const css = readFileSync(`${process.cwd()}/app/globals.css`, "utf8");

test("homepage typography roles use the approved hierarchy", () => {
  assert.match(css, /\.dashboard-page-heading h1[\s\S]*font-size: 28px;[\s\S]*font-weight: 700;[\s\S]*line-height: 1\.2;/u);
  assert.match(css, /\.dashboard-page-heading p[\s\S]*font-size: 17px;[\s\S]*font-weight: 400;[\s\S]*line-height: 1\.5;/u);
  assert.match(css, /\.app-section-header h2[\s\S]*font-size: 22px;[\s\S]*font-weight: 700;[\s\S]*line-height: 1\.3;/u);
  assert.match(css, /\.category-tile-label[\s\S]*font-size: 17px;[\s\S]*font-weight: 600;[\s\S]*line-height: 1\.3;/u);
  assert.match(css, /\.dashboard-quick-link strong[\s\S]*font-size: 18px;[\s\S]*font-weight: 700;[\s\S]*line-height: 1\.3;/u);
  assert.match(css, /\.dashboard-quick-link small[\s\S]*font-size: 16px;[\s\S]*font-weight: 400;[\s\S]*line-height: 1\.45;/u);
});

test("homepage app brand uses a secondary chevron and 20px title", () => {
  assert.match(css, /\.app-brand-name[\s\S]*font-size: 20px;[\s\S]*font-weight: 700;/u);
  assert.match(css, /\.app-brand-trigger > svg[\s\S]*color: var\(--ink-muted\);/u);
});
