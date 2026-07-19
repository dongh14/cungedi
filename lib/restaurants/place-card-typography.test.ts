import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const root = process.cwd();
const read = (path: string) => readFileSync(`${root}/${path}`, "utf8");

test("saved place cards share title and metadata typography across scripts", () => {
  const placeCard = read("components/place-card.tsx");
  const listCard = read("components/restaurant-list-card.tsx");
  const styles = read("app/globals.css");

  assert.match(placeCard, /className="place-name-title place-card-title"/u);
  assert.match(listCard, /className="place-name-title"/u);
  assert.match(placeCard, /className="place-card-metadata place-card-location mt-1 truncate"/u);
  assert.match(listCard, /className="place-card-metadata"/u);

  const titleStyle = styles.match(/\.place-name-title\s*\{([\s\S]*?)\n\}/u)?.[1] ?? "";
  const metadataStyle = styles.match(/\.place-card-metadata\s*\{([\s\S]*?)\n\}/u)?.[1] ?? "";

  assert.match(titleStyle, /font-size:\s*18px/u);
  assert.match(titleStyle, /font-weight:\s*700/u);
  assert.match(titleStyle, /line-height:\s*1\.25/u);
  assert.match(titleStyle, /letter-spacing:\s*normal/u);
  assert.match(titleStyle, /PingFang SC/u);
  assert.match(titleStyle, /Hiragino Sans GB/u);
  assert.match(metadataStyle, /font-size:\s*16px/u);
  assert.match(metadataStyle, /font-weight:\s*400/u);
  assert.match(metadataStyle, /line-height:\s*1\.4/u);
});
