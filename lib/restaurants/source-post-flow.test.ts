import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const root = process.cwd();
const read = (file: string) => readFileSync(`${root}/${file}`, "utf8");

test("review uses formAction for save-for-later instead of nesting a second form", () => {
  const card = read("components/extraction-confirmation-card.tsx");

  assert.match(card, /SaveSourcePostButton/u);
  assert.doesNotMatch(card, /<form action=\{saveSourcePostForLaterAction\}/u);
  assert.match(read("components/save-source-post-button.tsx"), /formAction=\{saveSourcePostForLaterAction\}/u);
});

test("save-for-later has explicit pending UI and never calls restaurant creation", () => {
  const button = read("components/save-source-post-button.tsx");
  const action = read("app/source-posts/actions.ts");

  assert.match(button, /useFormStatus/u);
  assert.match(button, /正在保存/u);
  assert.match(button, /disabled=\{pending\}/u);
  assert.doesNotMatch(action, /createRestaurantAction/u);
  assert.doesNotMatch(action, /from\("restaurants"\)/u);
});

test("save-for-later redirects to the created source-post detail and exposes safe failure state", () => {
  const action = read("app/source-posts/actions.ts");
  const card = read("components/extraction-confirmation-card.tsx");

  assert.match(action, /result\.data\.id/u);
  assert.match(action, /saved=1/u);
  assert.match(action, /sourcePostError/u);
  assert.match(card, /保存失败，请稍后重试/u);
  assert.match(card, /sourcePostError === "invalid_input"/u);
});

test("save-for-later keeps authentication and distinct URL fields", () => {
  const action = read("app/source-posts/actions.ts");
  const repository = read("lib/source-posts/repository.ts");

  assert.match(action, /getAuthenticatedUser/u);
  assert.match(action, /请先登录后再保存帖子/u);
  assert.match(action, /resolved_source_url/u);
  assert.match(action, /source_resolution_status/u);
  assert.match(repository, /original_url: input\.originalUrl/u);
  assert.match(repository, /resolved_url: input\.resolvedUrl/u);
  assert.match(repository, /processing_status: input\.processingStatus \?\? "captured"/u);
  assert.match(repository, /detected_candidates: Array\.isArray/u);
});
