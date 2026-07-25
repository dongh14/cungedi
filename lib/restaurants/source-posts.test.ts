import assert from "node:assert/strict";
import test from "node:test";
import { normalizeIntakeInput } from "../intake/normalize-input.ts";
import {
  buildSourcePostOrganizationDraft,
  selectStrongestSourcePostCandidate,
} from "../source-posts/draft.ts";
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

test("xiaohongshu intake recognizes xhslink.cn as a supported source host", () => {
  const normalized = normalizeIntakeInput("https://xhslink.cn/a/example");

  assert.equal(normalized.platform, "xiaohongshu");
  assert.equal(normalized.originalUrl, "https://xhslink.cn/a/example");
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
    sourceMetadata: null,
    metadataStatus: "unavailable",
    metadataFetchedAt: null,
    userNote: null,
    createdAt: "2026-07-20T00:00:00Z",
    updatedAt: "2026-07-20T00:00:00Z",
  });

  assert.equal(draft.name, "横滨樱木町28道的omakase");
  assert.equal(draft.sourceInput, rawText);
  assert.equal(draft.sourceUrl, "http://xhslink.com/o/example");
  assert.equal(draft.resolvedSourceUrl, "https://www.xiaohongshu.com/explore/example");
  assert.equal(draft.city, null);
  assert.equal(draft.category, null);
  assert.equal(draft.note, rawText);
});

test("source-post organization falls back to compact metadata when no candidate or usable share name exists", () => {
  const draft = buildSourcePostOrganizationDraft({
    id: "post-2",
    userId: "user-1",
    platform: "web",
    originalUrl: "https://example.com/post",
    resolvedUrl: "https://example.com/post",
    originalText: "复制这段内容即可查看详情",
    sourceImagePath: null,
    processingStatus: "needs_review",
    detectedCandidates: [],
    sourceMetadata: {
      requestedUrl: "https://example.com/post",
      finalUrl: "https://example.com/post",
      platform: "web",
      title: "樱木町寿司店 | 官方页面",
      description: "横滨樱木町的一家预约制寿司店。",
      ogTitle: null,
      ogDescription: null,
      ogSiteName: "Example",
      ogImageUrl: null,
      canonicalUrl: null,
      status: "partial",
      warnings: [],
    },
    metadataStatus: "partial",
    metadataFetchedAt: null,
    userNote: null,
    createdAt: "2026-07-20T00:00:00Z",
    updatedAt: "2026-07-20T00:00:00Z",
  });

  assert.equal(draft.name, "樱木町寿司店");
  assert.equal(draft.note, "复制这段内容即可查看详情");
});

test("source-post organization prefers the strongest conservative candidate", () => {
  const strongest = selectStrongestSourcePostCandidate([
    {
      id: "low",
      name: "某个地方",
      country: null,
      city: null,
      district: null,
      address: null,
      category: "美食",
      subcategory: null,
      note: null,
      confidence: "low",
      evidence: ["提到了一家店"],
      warnings: [],
    },
    {
      id: "high",
      name: "樱木町寿司店",
      country: "日本",
      city: "横滨",
      district: "樱木町",
      address: null,
      category: "美食",
      subcategory: "日料",
      note: "适合晚餐",
      confidence: "high",
      evidence: ["横滨樱木町推荐一家寿司店", "适合预约晚餐"],
      warnings: [],
    },
  ]);

  assert.equal(strongest?.id, "high");
  assert.equal(selectStrongestSourcePostCandidate([
    {
      id: "weak",
      name: null,
      country: null,
      city: null,
      district: null,
      address: null,
      category: null,
      subcategory: null,
      note: null,
      confidence: "medium",
      evidence: ["有一家店"],
      warnings: [],
    },
  ]), null);
});
