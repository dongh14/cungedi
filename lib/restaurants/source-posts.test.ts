import assert from "node:assert/strict";
import test from "node:test";
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
