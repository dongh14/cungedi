import assert from "node:assert/strict";
import test from "node:test";
import {
  buildSourcePostExtractionEvidence,
  buildSourcePostExtractionUserPrompt,
  maxSourcePostExtractionInputCharacters,
} from "@/lib/source-posts/extraction-prompt";
import { extractSourcePostPlaces } from "@/lib/source-posts/extraction-service";
import { validateSourcePostExtractionResult } from "@/lib/source-posts/extraction-schema";
import type { SourcePostExtractionInput } from "@/lib/source-posts/extraction-types";

const input: SourcePostExtractionInput = {
  sourcePostId: "post-private-id",
  platform: "xiaohongshu",
  originalText: "横滨樱木町推荐一家店\n这里有地址和营业信息。",
  originalUrl: "http://xhslink.com/o/example?token=private-token",
  resolvedUrl: "https://www.xiaohongshu.com/discovery/item/example?share_token=private-token",
  accessibleMetadata: {
    title: "横滨地点推荐",
    description: "一段可供识别的公开简介。",
    siteName: "小红书",
  },
};

function candidate(overrides: Record<string, unknown> = {}) {
  return {
    id: "model-id-is-ignored",
    name: "樱木町店",
    country: "日本",
    city: "横滨",
    district: "樱木町",
    address: null,
    category: "美食",
    subcategory: "餐厅",
    note: "适合保存后继续确认。",
    confidence: "medium",
    evidence: ["横滨樱木町推荐一家店"],
    warnings: [],
    ...overrides,
  };
}

function responseBody(overrides: Record<string, unknown> = {}) {
  return JSON.stringify({
    candidates: [candidate()],
    summary: "找到一个可能的地点。",
    extractionStatus: "partial",
    ...overrides,
  });
}

function mockFetch(content: string, status = 200) {
  return async (_url: string | URL | Request, init?: RequestInit) => {
    assert.equal(init?.method, "POST");
    return new Response(JSON.stringify({
      choices: [{ finish_reason: "stop", message: { content } }],
    }), { status });
  };
}

test("strictly validates candidates, requires evidence, and generates server IDs", () => {
  const result = validateSourcePostExtractionResult({
    candidates: [candidate()],
    summary: null,
    extractionStatus: "success",
  }, () => "server-generated-id");

  assert.ok(result);
  assert.equal(result.candidates[0].id, "server-generated-id");
  assert.equal(result.candidates[0].name, "樱木町店");
  assert.equal(validateSourcePostExtractionResult({
    candidates: [candidate({ evidence: [] })],
    summary: null,
    extractionStatus: "success",
  }), null);
  assert.equal(validateSourcePostExtractionResult({
    candidates: Array.from({ length: 9 }, () => candidate()),
    summary: null,
    extractionStatus: "success",
  }), null);
  assert.equal(validateSourcePostExtractionResult({
    candidates: [candidate({ reasoning: "hidden reasoning" })],
    summary: null,
    extractionStatus: "success",
  }), null);
});

test("prompt packages bounded evidence without private source-post IDs or URL queries", () => {
  const evidence = buildSourcePostExtractionEvidence({
    ...input,
    originalText: "x".repeat(10000),
  });
  const prompt = buildSourcePostExtractionUserPrompt(input);

  assert.ok(evidence.length <= maxSourcePostExtractionInputCharacters);
  assert.doesNotMatch(prompt, /post-private-id/u);
  assert.doesNotMatch(prompt, /private-token/u);
  assert.doesNotMatch(prompt, /originalUrl|resolvedUrl/u);
  assert.match(prompt, /supplied input/u);
});

test("valid model output returns validated candidates without creating a place", async () => {
  let requestCount = 0;
  const result = await extractSourcePostPlaces(input, {
    apiKey: "test-key",
    fetchImpl: async (url, init) => {
      requestCount += 1;
      return mockFetch(responseBody())(url, init);
    },
  });

  assert.equal(requestCount, 1);
  assert.equal(result.status, "success");
  assert.equal(result.result?.candidates[0].id.length, 36);
  assert.equal(result.result?.candidates[0].category, "美食");
});

test("validated page metadata is compact AI evidence and images are not sent", async () => {
  let userPrompt = "";
  const result = await extractSourcePostPlaces({
    ...input,
    accessibleMetadata: {
      title: "页面标题",
      description: "页面描述",
      siteName: "网站名称",
    },
  }, {
    apiKey: "test-key",
    fetchImpl: async (url, init) => {
      const body = JSON.parse(String(init?.body)) as { messages: Array<{ content: string }> };
      userPrompt = body.messages[1].content;
      return mockFetch(responseBody())(url, init);
    },
  });

  assert.equal(result.status, "success");
  assert.match(userPrompt, /页面标题/u);
  assert.match(userPrompt, /页面描述/u);
  assert.doesNotMatch(userPrompt, /ogImage|cover\.jpg/u);
});

test("empty evidence skips the provider and returns insufficient evidence", async () => {
  let requestCount = 0;
  const result = await extractSourcePostPlaces({
    ...input,
    originalText: null,
    originalUrl: null,
    resolvedUrl: null,
    accessibleMetadata: undefined,
  }, {
    apiKey: "test-key",
    fetchImpl: async () => {
      requestCount += 1;
      return new Response();
    },
  });

  assert.equal(requestCount, 0);
  assert.equal(result.result?.extractionStatus, "insufficient_evidence");
});

test("invalid JSON and invalid candidates fail safely", async () => {
  const invalidJson = await extractSourcePostPlaces(input, {
    apiKey: "test-key",
    fetchImpl: async (url, init) => mockFetch("{incomplete")(url, init),
  });
  const invalidCandidate = await extractSourcePostPlaces(input, {
    apiKey: "test-key",
    fetchImpl: async (url, init) => mockFetch(responseBody({ candidates: [candidate({ category: "not-a-category" })] }))(url, init),
  });

  assert.equal(invalidJson.status, "failed");
  assert.equal(invalidJson.result, null);
  assert.equal(invalidCandidate.status, "failed");
  assert.equal(invalidCandidate.result, null);
  assert.match(invalidJson.message, /部分信息未能自动识别/u);
});

test("truncated length responses are treated as recoverable failures", async () => {
  const result = await extractSourcePostPlaces(input, {
    apiKey: "test-key",
    fetchImpl: async () => new Response(JSON.stringify({
      choices: [{ finish_reason: "length", message: { content: "{\"candidates\":[" } }],
    }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    }),
  });

  assert.equal(result.status, "failed");
  assert.equal(result.result, null);
  assert.equal(result.failureReason, "length");
  assert.match(result.message, /已读取来源，但部分信息未能自动识别/u);
});

test("provider errors are returned safely and never create candidates", async () => {
  const result = await extractSourcePostPlaces(input, {
    apiKey: "test-key",
    fetchImpl: async () => {
      throw new Error("private source text must not escape");
    },
  });

  assert.equal(result.status, "failed");
  assert.equal(result.result, null);
  assert.doesNotMatch(result.message, /private source/u);
});
