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

test("source-post organization preserves context and uses the existing review form", () => {
  const detail = read("app/source-posts/[id]/page.tsx");
  const review = read("app/restaurants/review/page.tsx");
  const restaurantsAction = read("app/restaurants/actions.ts");

  assert.match(detail, /整理为地点/u);
  assert.match(detail, /关联已有地点/u);
  assert.match(detail, /unlinkSavedSourcePostFromPlaceAction/u);
  assert.match(review, /source_post_id/u);
  assert.match(restaurantsAction, /getSavedSourcePostById/u);
  assert.match(restaurantsAction, /linkSourcePostToPlace/u);
  assert.match(restaurantsAction, /该帖子已关联到此地点/u);
});

test("default paste intake auto-saves source posts, runs bounded extraction, and opens review directly", () => {
  const intakeCard = read("components/source-intake-card.tsx");
  const intakeButton = read("components/source-intake-submit-button.tsx");
  const intakePage = read("app/restaurants/new/source/page.tsx");
  const restaurantActions = read("app/restaurants/actions.ts");
  const extractionService = read("lib/source-posts/extraction-service.ts");
  const intakeActionSection = restaurantActions.split("export async function startSourceIntakeAction")[1] ?? "";

  assert.match(intakeCard, /识别地点/u);
  assert.match(intakeCard, /粘贴小红书、抖音分享文案或网页链接/u);
  assert.match(intakeCard, /粘贴后将自动识别地点信息，你可以在保存前修改/u);
  assert.match(intakeButton, /useFormStatus/u);
  assert.match(intakeButton, /disabled=\{pending\}/u);
  assert.match(intakeButton, /正在识别/u);
  assert.match(intakeButton, /aria-busy=\{pending\}/u);
  assert.match(intakePage, /自动整理出可编辑地点草稿/u);
  assert.match(restaurantActions, /createSavedSourcePost/u);
  assert.match(restaurantActions, /fetchSourcePageMetadata/u);
  assert.match(restaurantActions, /extractSourcePostPlaces/u);
  assert.match(restaurantActions, /updateDetectedCandidates/u);
  assert.match(extractionService, /maxOutputTokens: 900/u);
  assert.match(restaurantActions, /source_post_id/u);
  assert.match(restaurantActions, /candidate_id/u);
  assert.doesNotMatch(intakeActionSection, /buildRestaurantInsertPayload|from\("restaurants"\)/u);
});

test("source intake preserves saved source posts and falls back safely when DeepSeek output is truncated or invalid", () => {
  const restaurantActions = read("app/restaurants/actions.ts");
  const extractionService = read("lib/source-posts/extraction-service.ts");
  const deepSeekProvider = read("lib/restaurants/deepseek-provider.ts");

  assert.match(deepSeekProvider, /finishReason === "length"/u);
  assert.match(deepSeekProvider, /responseValidation: "truncated"/u);
  assert.match(extractionService, /failureReason\?: "length" \| "invalid_json" \| "invalid_response" \| "provider_error"/u);
  assert.match(extractionService, /已读取来源，但部分信息未能自动识别，请检查后补充。/u);
  assert.match(restaurantActions, /processingStatus: extraction\.failureReason === "length" \|\| extraction\.failureReason === "invalid_json" \|\| extraction\.failureReason === "invalid_response"/u);
  assert.match(restaurantActions, /source_post_id: sourcePost\.id/u);
});

test("source-post review reads persisted draft state and does not rerun DeepSeek automatically on refresh", () => {
  const review = read("app/restaurants/review/page.tsx");

  assert.match(review, /const isSourcePostReview = Boolean\(params\.source_post_id\)/u);
  assert.match(review, /const shouldAutoRunAIEnrichment = !isSourcePostReview \|\| manualEvidenceText !== null \|\| isForcedReanalysis/u);
  assert.match(review, /!shouldAutoRunAIEnrichment/u);
  assert.match(review, /来源草稿已就绪，可直接检查并补充后保存。/u);
});

test("source-post organization keeps failure recovery visible and does not add extraction features", () => {
  const actions = read("app/source-posts/actions.ts");
  const restaurantActions = read("app/restaurants/actions.ts");
  const page = read("app/source-posts/[id]/page.tsx");

  assert.match(restaurantActions, /地点已创建，但来源帖子关联失败，请稍后重试/u);
  assert.match(actions, /processingStatus: "needs_review"/u);
  assert.doesNotMatch(page, /OCR|截图上传|视频处理|AI提取/u);
});

test("source-post extraction is explicit, bounded, and review-only", () => {
  const actions = read("app/source-posts/actions.ts");
  const page = read("app/source-posts/[id]/page.tsx");
  const button = read("components/source-post-extraction-button.tsx");
  const service = read("lib/source-posts/extraction-service.ts");

  assert.match(actions, /extractSavedSourcePostPlacesAction/u);
  assert.match(actions, /processingStatus: "processing"/u);
  assert.match(actions, /updateDetectedCandidates/u);
  assert.match(button, /AI 识别地点/u);
  assert.match(page, /编辑并保存为地点/u);
  assert.match(actions, /候选地点已忽略/u);
  assert.match(service, /maxOutputTokens: 900/u);
  assert.doesNotMatch(service, /createRestaurantAction|from\(["']restaurants/u);
});

test("source-post metadata retrieval is explicit and feeds only validated metadata into AI", () => {
  const actions = read("app/source-posts/actions.ts");
  const page = read("app/source-posts/[id]/page.tsx");
  const button = read("components/source-post-metadata-button.tsx");
  const repository = read("lib/source-posts/repository.ts");

  assert.match(actions, /fetchSavedSourcePostMetadataAction/u);
  assert.match(actions, /resolvedUrl \?\? postResult\.data\.originalUrl/u);
  assert.match(actions, /fetchSourcePageMetadata/u);
  assert.match(button, /读取公开信息/u);
  assert.match(button, /正在读取/u);
  assert.match(repository, /source_metadata: metadata/u);
  assert.doesNotMatch(actions, /extractSourcePostPlaces\(.*fetch/u);
});
