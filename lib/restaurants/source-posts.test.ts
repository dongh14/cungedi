import assert from "node:assert/strict";
import test from "node:test";
import { buildSourcePostOrganizationDraft } from "../source-posts/draft.ts";
import { buildSavedSourcePostCapture, getSourcePostStatusAfterLinkChange } from "../source-posts/intake.ts";

test("saved source-post capture preserves raw shared text and separates resolved URLs", () => {
  const rawInput = "推荐这个地方\nhttp://xhslink.com/o/example\n先保存起来";
  const capture = buildSavedSourcePostCapture(rawInput, {
    resolvedUrl: "https://www.xiaohongshu.com/explore/example",
    resolutionStatus: "resolved",
  });

  assert.equal(capture.platform, "xiaohongshu");
  assert.equal(capture.originalUrl, "http://xhslink.com/o/example");
  assert.equal(capture.resolvedUrl, "https://www.xiaohongshu.com/explore/example");
  assert.equal(capture.originalText, rawInput);
  assert.equal(capture.processingStatus, "needs_review");
  assert.deepEqual(capture.detectedCandidates, []);
});

test("failed resolution keeps the original source and does not invent a resolved URL", () => {
  const capture = buildSavedSourcePostCapture("https://v.douyin.com/example", {
    resolvedUrl: "https://www.douyin.com/video/example",
    resolutionStatus: "failed",
  });

  assert.equal(capture.platform, "douyin");
  assert.equal(capture.originalUrl, "https://v.douyin.com/example");
  assert.equal(capture.resolvedUrl, null);
});

test("source-post status reflects whether any place remains linked", () => {
  assert.equal(getSourcePostStatusAfterLinkChange(1), "saved");
  assert.equal(getSourcePostStatusAfterLinkChange(0), "needs_review");
});

test("source-post organization derives a conservative name and keeps raw evidence as a note", () => {
  const rawText = "横滨樱木町28道的omakase 在小红书上看见有人推荐这个...\nhttp://xhslink.com/o/example\n先复制这段内容，再进入【小红书】即可阅读笔记。";
  const draft = buildSourcePostOrganizationDraft({
    id: "post-1",
    userId: "user-1",
    platform: "xiaohongshu",
    originalUrl: "http://xhslink.com/o/example",
    resolvedUrl: "https://www.xiaohongshu.com/explore/example",
    originalText: rawText,
    sourceImagePath: null,
    processingStatus: "needs_review",
    detectedCandidates: [],
    userNote: null,
    createdAt: "2026-07-20T00:00:00Z",
    updatedAt: "2026-07-20T00:00:00Z",
  });

  assert.equal(draft.name, "横滨樱木町28道的omakase");
  assert.equal(draft.sourceInput, rawText);
  assert.equal(draft.sourceUrl, "http://xhslink.com/o/example");
  assert.equal(draft.resolvedSourceUrl, "https://www.xiaohongshu.com/explore/example");
  assert.equal(draft.note, rawText);
});
