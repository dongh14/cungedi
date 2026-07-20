import assert from "node:assert/strict";
import test from "node:test";
import { normalizeIntakeInput } from "../intake/normalize-input.ts";

const xiaohongshuUrl = "http://xhslink.com/o/XRRPIValG9";

test("normalizes the supplied Xiaohongshu share message exactly", () => {
  const rawInput =
    "横滨樱木町28道的omakase 在小红书上看见有人推荐这个...\n" +
    `${xiaohongshuUrl}\n` +
    "先复制这段内容，再进入【小红书】即可阅读笔记。";

  assert.deepEqual(normalizeIntakeInput(rawInput), {
    rawInput,
    inputKind: "shared_text",
    platform: "xiaohongshu",
    originalUrl: xiaohongshuUrl,
    detectedUrls: [xiaohongshuUrl],
    surroundingText:
      "横滨樱木町28道的omakase 在小红书上看见有人推荐这个...\n" +
      "先复制这段内容，再进入【小红书】即可阅读笔记。",
  });
});

test("recognizes Xiaohongshu short and full URLs", () => {
  assert.equal(normalizeIntakeInput(xiaohongshuUrl).platform, "xiaohongshu");

  const fullUrl = "https://www.xiaohongshu.com/explore/65f123456789";
  assert.equal(normalizeIntakeInput(fullUrl).platform, "xiaohongshu");
  assert.equal(normalizeIntakeInput(fullUrl).originalUrl, fullUrl);
});

test("recognizes a Douyin short link inside Chinese share text", () => {
  const result = normalizeIntakeInput(
    "看看这个推荐！\nhttps://v.douyin.com/abc123/，再去抖音搜索。",
  );

  assert.equal(result.inputKind, "shared_text");
  assert.equal(result.platform, "douyin");
  assert.equal(result.originalUrl, "https://v.douyin.com/abc123/");
  assert.deepEqual(result.detectedUrls, ["https://v.douyin.com/abc123/"]);
});

test("recognizes a full Douyin URL", () => {
  const url = "https://www.douyin.com/video/123456789";
  const result = normalizeIntakeInput(url);

  assert.equal(result.inputKind, "url");
  assert.equal(result.platform, "douyin");
  assert.equal(result.originalUrl, url);
});

test("recognizes generic web URLs without treating them as social sources", () => {
  const url = "https://example.com/places/blue-bottle";
  const result = normalizeIntakeInput(url);

  assert.equal(result.inputKind, "url");
  assert.equal(result.platform, "web");
  assert.equal(result.originalUrl, url);
});

test("retains every URL and prefers supported platforms over an earlier generic URL", () => {
  const genericUrl = "https://example.com/first";
  const douyinUrl = "https://douyin.com/video/123";
  const xiaohongshuFullUrl = "https://xiaohongshu.com/explore/456";
  const result = normalizeIntakeInput(`${genericUrl} ${douyinUrl} ${xiaohongshuFullUrl}`);

  assert.deepEqual(result.detectedUrls, [genericUrl, douyinUrl, xiaohongshuFullUrl]);
  assert.equal(result.originalUrl, xiaohongshuFullUrl);
  assert.equal(result.platform, "xiaohongshu");
});

test("prefers Douyin when no Xiaohongshu URL exists", () => {
  const genericUrl = "https://example.com/first";
  const douyinUrl = "https://v.douyin.com/abc/";
  const result = normalizeIntakeInput(`${genericUrl}\n${douyinUrl}`);

  assert.equal(result.originalUrl, douyinUrl);
  assert.equal(result.platform, "douyin");
});

test("removes trailing Chinese and English punctuation from URL values", () => {
  const url = "https://xhslink.com/o/example";
  const result = normalizeIntakeInput(`${url}， ${url}. ${url}!`);

  assert.deepEqual(result.detectedUrls, [url, url, url]);
  assert.equal(result.originalUrl, url);
});

test("preserves emojis, hashtags, and surrounding text", () => {
  const result = normalizeIntakeInput(
    "🍜 #东京美食\nhttps://xhslink.com/o/example\n值得收藏！",
  );

  assert.equal(result.inputKind, "shared_text");
  assert.equal(result.surroundingText, "🍜 #东京美食\n值得收藏！");
});

test("classifies non-URL text and empty input safely", () => {
  assert.equal(normalizeIntakeInput("这是一段没有链接的分享文案").inputKind, "text");
  assert.equal(normalizeIntakeInput("   \n  ").inputKind, "unknown");
  assert.equal(normalizeIntakeInput("http://").inputKind, "unknown");
  assert.equal(normalizeIntakeInput("http://").originalUrl, null);
});

test("preserves meaningful line breaks while removing URL text", () => {
  const result = normalizeIntakeInput(
    "第一行介绍\n\nhttps://example.com/place\n\n最后一行地址",
  );

  assert.equal(result.surroundingText, "第一行介绍\n最后一行地址");
});

test("keeps URL-only intake backward compatible", () => {
  const url = "https://www.google.com/maps/place/example";
  const result = normalizeIntakeInput(url);

  assert.deepEqual(result, {
    rawInput: url,
    inputKind: "url",
    platform: "web",
    originalUrl: url,
    detectedUrls: [url],
    surroundingText: "",
  });
});
