import assert from "node:assert/strict";
import test from "node:test";
import type { AIEnrichmentRequest } from "./ai-enrichment.ts";
import {
  cleanDeepSeekJsonText,
  createDeepSeekAIEnrichmentProvider,
  parseDeepSeekResponse,
} from "./deepseek-provider.ts";
import type { MergedPlaceDraft } from "./place-draft-merge.ts";
import type { NormalizedExtractionResult } from "./extraction-architecture.ts";
import type { AIEnrichmentCacheEntry, AIEnrichmentCacheStore } from "./ai-cache.ts";

function createDraft(overrides: Partial<MergedPlaceDraft> = {}): MergedPlaceDraft {
  return {
    name: "Place",
    category: null,
    cuisine: null,
    city: null,
    address: null,
    latitude: null,
    longitude: null,
    description: null,
    notes: null,
    phone: null,
    websiteUrl: null,
    imageUrl: null,
    sourceUrl: "https://example.com/place",
    sourceUrls: ["https://example.com/place"],
    fieldSources: { name: "website" },
    ...overrides,
  };
}

function createResult(
  overrides: Partial<NormalizedExtractionResult> = {},
): NormalizedExtractionResult {
  return {
    name: "Place",
    description: null,
    category: null,
    city: "Shanghai",
    district: null,
    address: null,
    phone: null,
    latitude: null,
    longitude: null,
    websiteUrl: "https://example.com/place",
    imageUrl: null,
    sourceUrl: "https://example.com/place",
    notes: null,
    confidence: "medium",
    extractionStatus: "partial",
    extractedFields: ["name"],
    fieldOrigins: { name: "metadata" },
    sourceType: "website",
    message: "Partially extracted.",
    ...overrides,
  };
}

function createRequest(overrides: Partial<AIEnrichmentRequest> = {}): AIEnrichmentRequest {
  return {
    mergedPlaceDraft: createDraft(),
    extractedSourceData: [createResult()],
    sourceUrls: ["https://example.com/place"],
    missingFields: ["city", "category", "address"],
    ...overrides,
  };
}

function createMemoryCache(initial: AIEnrichmentCacheEntry | null = null) {
  let entry = initial;
  let getCalls = 0;
  let setCalls = 0;
  let deleteCalls = 0;
  const store: AIEnrichmentCacheStore = {
    async get() {
      getCalls += 1;
      return entry;
    },
    async set(input) {
      setCalls += 1;
      entry = { responseJson: input.responseJson, expiresAt: input.expiresAt };
    },
    async delete() {
      deleteCalls += 1;
      entry = null;
    },
  };

  return {
    store,
    getEntry: () => entry,
    getCalls: () => getCalls,
    setCalls: () => setCalls,
    deleteCalls: () => deleteCalls,
  };
}

function jsonResponse(content: string, status = 200, finishReason = "stop") {
  return new Response(JSON.stringify({ choices: [{ finish_reason: finishReason, message: { content } }] }), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function validFactualSuggestions(overrides: Record<string, unknown> = {}) {
  return {
    address: "",
    phone: "",
    city: "Shanghai",
    country: "",
    district: "",
    ...overrides,
  };
}

function validUnderstandingSuggestions(overrides: Record<string, unknown> = {}) {
  return {
    category: "",
    cuisine: "",
    tags: [],
    summary: "",
    placeType: "",
    ...overrides,
  };
}

function validWireResponse(overrides: Record<string, unknown> = {}) {
  return JSON.stringify({
    status: "suggestions_available",
    factualSuggestions: validFactualSuggestions(),
    understandingSuggestions: validUnderstandingSuggestions(),
    confidence: "medium",
    reason: "The city is explicitly present in the supplied source context.",
    ...overrides,
  });
}

test("provider is unavailable without an API key and makes no request", async () => {
  let called = false;
  const provider = createDeepSeekAIEnrichmentProvider({
    apiKey: "",
    fetchImpl: async () => {
      called = true;
      return jsonResponse("{}");
    },
  });

  const result = await provider.enrich(createRequest());

  assert.equal(result.status, "unavailable");
  assert.equal(called, false);
  assert.match(result.message, /DEEPSEEK_API_KEY/);
});

test("provider reads the configured model and sends a compact server-side request", async () => {
  const originalKey = process.env.DEEPSEEK_API_KEY;
  const originalModel = process.env.DEEPSEEK_MODEL;
  let requestBody: Record<string, unknown> | null = null;
  let authorization = "";

  process.env.DEEPSEEK_API_KEY = "test-key";
  process.env.DEEPSEEK_MODEL = "test-model";

  try {
    const provider = createDeepSeekAIEnrichmentProvider({
      endpoint: "https://deepseek.test/chat/completions",
      fetchImpl: async (_input, init) => {
        requestBody = JSON.parse(String(init?.body)) as Record<string, unknown>;
        authorization = String((init?.headers as Record<string, string>).Authorization);
        return jsonResponse(validWireResponse());
      },
    });

    const result = await provider.enrich(createRequest());
    assert.ok(requestBody);
    const capturedBody = requestBody as Record<string, unknown>;
    const messages = capturedBody.messages as Array<{ content: string }>;

    assert.equal(result.status, "suggestions_available");
    assert.equal(result.proposal?.factualSuggestions.city, "Shanghai");
    assert.equal(capturedBody.model, "test-model");
    assert.equal(capturedBody.max_tokens, 600);
    assert.equal(capturedBody.temperature, 0.1);
    assert.deepEqual(capturedBody.response_format, { type: "json_object" });
    assert.equal(authorization, "Bearer test-key");
    assert.ok(messages[1].content.length < 6000 + 300);
  } finally {
    if (originalKey === undefined) delete process.env.DEEPSEEK_API_KEY;
    else process.env.DEEPSEEK_API_KEY = originalKey;
    if (originalModel === undefined) delete process.env.DEEPSEEK_MODEL;
    else process.env.DEEPSEEK_MODEL = originalModel;
  }
});

test("evidence-supported fields remain available as explicit suggestions", async () => {
  let userPrompt = "";
  const provider = createDeepSeekAIEnrichmentProvider({
    apiKey: "test-key",
    fetchImpl: async (_input, init) => {
      const body = JSON.parse(String(init?.body)) as {
        messages: Array<{ role: string; content: string }>;
      };
      userPrompt = body.messages[1].content;
      return jsonResponse(validWireResponse({
        factualSuggestions: validFactualSuggestions({ address: "88 Yongjia Road, Shanghai" }),
      }));
    },
  });

  const result = await provider.enrich(createRequest({
    extractedSourceData: [createResult({
      evidence: {
        metadata: { description: "Official restaurant page." },
        structuredData: [{
          types: ["restaurant"],
          name: "Place",
          description: "Official restaurant page.",
          category: "Restaurant",
          address: "88 Yongjia Road, Shanghai",
          phone: "",
          websiteUrl: "https://example.com/place",
          imageUrl: null,
        }],
      },
    })],
  }));

  assert.equal(result.status, "suggestions_available");
  assert.equal(result.proposal?.factualSuggestions.address, "88 Yongjia Road, Shanghai");
  assert.match(userPrompt, /88 Yongjia Road, Shanghai/);
});

test("unsupported factual suggestions are removed while understanding suggestions remain reviewable", async () => {
  const provider = createDeepSeekAIEnrichmentProvider({
    apiKey: "test-key",
    fetchImpl: async () => jsonResponse(validWireResponse({
      factualSuggestions: validFactualSuggestions({ address: "Invented Address" }),
      understandingSuggestions: validUnderstandingSuggestions({ category: "Restaurant" }),
    })),
  });

  const result = await provider.enrich(createRequest());

  assert.equal(result.status, "suggestions_available");
  assert.equal(result.proposal?.factualSuggestions.address, null);
  assert.equal(result.proposal?.understandingSuggestions.category, "Restaurant");
  assert.equal(result.proposal?.proposedFields.some((field) => field.field === "address"), false);
});

test("development diagnostics are concise and omit raw content by default", async () => {
  const mutableEnv = process.env as unknown as Record<string, string | undefined>;
  const originalNodeEnv = mutableEnv.NODE_ENV;
  const originalDebugLogs = mutableEnv.DEEPSEEK_DEBUG_LOGS;
  const originalRawResponse = mutableEnv.DEEPSEEK_DEBUG_RAW_RESPONSE;
  const originalDebug = console.debug;
  const debugCalls: unknown[][] = [];
  mutableEnv.NODE_ENV = "development";
  delete mutableEnv.DEEPSEEK_DEBUG_LOGS;
  delete mutableEnv.DEEPSEEK_DEBUG_RAW_RESPONSE;
  console.debug = (...args) => {
    debugCalls.push(args);
  };

  try {
    const provider = createDeepSeekAIEnrichmentProvider({
      apiKey: "test-key",
      model: "test-model",
      fetchImpl: async () => jsonResponse(validWireResponse({
        status: "no_changes",
        factualSuggestions: validFactualSuggestions({ city: "" }),
      }), 200, "stop"),
    });

    const result = await provider.enrich(createRequest());
    const diagnosticCall = debugCalls.find((call) => call[0] === "[deepseek] provider_success");
    const diagnostic = diagnosticCall?.[1] as Record<string, unknown>;

    assert.equal(result.status, "no_changes");
    assert.ok(diagnosticCall);
    assert.equal(diagnostic.httpStatus, 200);
    assert.equal(diagnostic.model, "test-model");
    assert.equal(diagnostic.finishReason, "stop");
    assert.equal(diagnostic.responseValidation, "no_changes");
    assert.equal(typeof diagnostic.durationMs, "number");
    assert.equal(debugCalls.some((call) => call[0] === "[deepseek] raw_response"), false);
    assert.doesNotMatch(JSON.stringify(debugCalls), /test-key/);
  } finally {
    console.debug = originalDebug;
    if (originalNodeEnv === undefined) delete mutableEnv.NODE_ENV;
    else mutableEnv.NODE_ENV = originalNodeEnv;
    if (originalDebugLogs === undefined) delete mutableEnv.DEEPSEEK_DEBUG_LOGS;
    else mutableEnv.DEEPSEEK_DEBUG_LOGS = originalDebugLogs;
    if (originalRawResponse === undefined) delete mutableEnv.DEEPSEEK_DEBUG_RAW_RESPONSE;
    else mutableEnv.DEEPSEEK_DEBUG_RAW_RESPONSE = originalRawResponse;
  }
});

test("raw response logging requires explicit development opt-in", async () => {
  const mutableEnv = process.env as unknown as Record<string, string | undefined>;
  const originalNodeEnv = mutableEnv.NODE_ENV;
  const originalRawResponse = mutableEnv.DEEPSEEK_DEBUG_RAW_RESPONSE;
  const originalDebug = console.debug;
  const debugCalls: unknown[][] = [];
  mutableEnv.NODE_ENV = "development";
  mutableEnv.DEEPSEEK_DEBUG_RAW_RESPONSE = "true";
  console.debug = (...args) => {
    debugCalls.push(args);
  };

  try {
    const responseText = validWireResponse({
      status: "no_changes",
      factualSuggestions: validFactualSuggestions({ city: "" }),
    });
    const provider = createDeepSeekAIEnrichmentProvider({
      apiKey: "test-key",
      fetchImpl: async () => jsonResponse(responseText),
    });

    await provider.enrich(createRequest());

    const rawCall = debugCalls.find((call) => call[0] === "[deepseek] raw_response");
    assert.ok(rawCall);
    assert.equal((rawCall?.[1] as Record<string, unknown> | undefined)?.rawResponseText, responseText);
  } finally {
    console.debug = originalDebug;
    if (originalNodeEnv === undefined) delete mutableEnv.NODE_ENV;
    else mutableEnv.NODE_ENV = originalNodeEnv;
    if (originalRawResponse === undefined) delete mutableEnv.DEEPSEEK_DEBUG_RAW_RESPONSE;
    else mutableEnv.DEEPSEEK_DEBUG_RAW_RESPONSE = originalRawResponse;
  }
});

test("pasted evidence is not included in provider diagnostics", async () => {
  const mutableEnv = process.env as unknown as Record<string, string | undefined>;
  const originalNodeEnv = mutableEnv.NODE_ENV;
  const originalDebugLogs = mutableEnv.DEEPSEEK_DEBUG_LOGS;
  const originalDebug = console.debug;
  const debugCalls: unknown[][] = [];
  mutableEnv.NODE_ENV = "development";
  delete mutableEnv.DEEPSEEK_DEBUG_LOGS;
  console.debug = (...args) => {
    debugCalls.push(args);
  };

  try {
    const provider = createDeepSeekAIEnrichmentProvider({
      apiKey: "test-key",
      fetchImpl: async () => jsonResponse(validWireResponse()),
    });

    await provider.enrich(createRequest({
      extractedSourceData: [createResult({
        evidence: { manualText: "PRIVATE_PASTED_EVIDENCE_123" },
      })],
    }));

    assert.doesNotMatch(JSON.stringify(debugCalls), /PRIVATE_PASTED_EVIDENCE_123/);
  } finally {
    console.debug = originalDebug;
    if (originalNodeEnv === undefined) delete mutableEnv.NODE_ENV;
    else mutableEnv.NODE_ENV = originalNodeEnv;
    if (originalDebugLogs === undefined) delete mutableEnv.DEEPSEEK_DEBUG_LOGS;
    else mutableEnv.DEEPSEEK_DEBUG_LOGS = originalDebugLogs;
  }
});

test("development cache miss and hit diagnostics stay concise", async () => {
  const mutableEnv = process.env as unknown as Record<string, string | undefined>;
  const originalNodeEnv = mutableEnv.NODE_ENV;
  const originalDebugLogs = mutableEnv.DEEPSEEK_DEBUG_LOGS;
  const originalDebug = console.debug;
  const debugCalls: unknown[][] = [];
  mutableEnv.NODE_ENV = "development";
  delete mutableEnv.DEEPSEEK_DEBUG_LOGS;
  console.debug = (...args) => {
    debugCalls.push(args);
  };

  try {
    const memoryCache = createMemoryCache();
    const provider = createDeepSeekAIEnrichmentProvider({
      apiKey: "test-key",
      cacheStore: memoryCache.store,
      fetchImpl: async () => jsonResponse(validWireResponse()),
    });
    const request = createRequest({ userId: "user-private" });

    await provider.enrich(request);
    await provider.enrich(request);

    const eventNames = debugCalls.map((call) => call[0]);
    assert.equal(eventNames.includes("[deepseek] cache_miss"), true);
    assert.equal(eventNames.includes("[deepseek] cache_hit"), true);
    assert.doesNotMatch(JSON.stringify(debugCalls), /user-private/);
    assert.doesNotMatch(JSON.stringify(debugCalls), /test-key/);
    assert.doesNotMatch(JSON.stringify(debugCalls), /rawResponseText/);
  } finally {
    console.debug = originalDebug;
    if (originalNodeEnv === undefined) delete mutableEnv.NODE_ENV;
    else mutableEnv.NODE_ENV = originalNodeEnv;
    if (originalDebugLogs === undefined) delete mutableEnv.DEEPSEEK_DEBUG_LOGS;
    else mutableEnv.DEEPSEEK_DEBUG_LOGS = originalDebugLogs;
  }
});

test("provider avoids calling DeepSeek when enrichment is not eligible", async () => {
  let called = false;
  const provider = createDeepSeekAIEnrichmentProvider({
    apiKey: "test-key",
    fetchImpl: async () => {
      called = true;
      return jsonResponse("{}");
    },
  });

  const completeDraft = createDraft({
    category: "Restaurant",
    city: "Shanghai",
    address: "1 Example Road",
    phone: "123456",
    notes: "Notes",
  });
  const result = await provider.enrich(createRequest({
    mergedPlaceDraft: completeDraft,
    extractedSourceData: [createResult({
      category: "Restaurant",
      city: "Shanghai",
      address: "1 Example Road",
      phone: "123456",
      confidence: "high",
      extractionStatus: "success",
    })],
    missingFields: [],
  }));

  assert.equal(result.status, "no_changes");
  assert.equal(called, false);
});

test("invalid DeepSeek JSON is rejected without a proposal", () => {
  const result = parseDeepSeekResponse("not-json");

  assert.equal(result.status, "failed");
  assert.equal(result.proposal, null);
});

test("truncated JSON returns failed safely", () => {
  const result = parseDeepSeekResponse(
    '{"status":"suggestions_available","factualSuggestions":{"address":"Place"',
  );

  assert.equal(result.status, "failed");
  assert.equal(result.proposal, null);
});

test("valid allowed status and confidence produce suggestions", () => {
  const result = parseDeepSeekResponse(validWireResponse());

  assert.equal(result.status, "suggestions_available");
  assert.equal(result.proposal?.factualSuggestions.city, "Shanghai");
});

test("invalid status is rejected", () => {
  const result = parseDeepSeekResponse(validWireResponse({ status: "maybe" }));

  assert.equal(result.status, "failed");
  assert.equal(result.proposal, null);
});

test("numeric confidence is rejected", () => {
  const result = parseDeepSeekResponse(validWireResponse({ confidence: 0.8 }));

  assert.equal(result.status, "failed");
  assert.equal(result.proposal, null);
});

test("additional response fields are rejected", () => {
  const result = parseDeepSeekResponse(validWireResponse({
    extra: "not allowed",
  }));

  assert.equal(result.status, "failed");
  assert.equal(result.proposal, null);
});

test("normal JSON response succeeds without cleanup", () => {
  const response = validWireResponse({
    understandingSuggestions: validUnderstandingSuggestions({ category: "Restaurant" }),
  });
  const result = parseDeepSeekResponse(response);

  assert.equal(result.status, "suggestions_available");
  assert.equal(result.proposal?.understandingSuggestions.category, "Restaurant");
});

test("all-empty suggestions remain no_changes when evidence is absent", () => {
  const result = parseDeepSeekResponse(validWireResponse({
    status: "suggestions_available",
    factualSuggestions: validFactualSuggestions({ city: "" }),
    understandingSuggestions: validUnderstandingSuggestions(),
  }));

  assert.equal(result.status, "no_changes");
  assert.equal(result.proposal, null);
});

test("removes only a surrounding markdown JSON fence before parsing", () => {
  const fencedJson = [
    "```json",
    validWireResponse({
      status: "no_changes",
      factualSuggestions: validFactualSuggestions({ city: "" }),
      understandingSuggestions: validUnderstandingSuggestions(),
    }),
    "```",
  ].join("\n");
  const result = parseDeepSeekResponse(fencedJson);

  assert.equal(
    cleanDeepSeekJsonText(`  ${fencedJson}  `),
    validWireResponse({
      status: "no_changes",
    factualSuggestions: validFactualSuggestions({ city: "" }),
    understandingSuggestions: validUnderstandingSuggestions(),
    }),
  );
  assert.equal(result.status, "no_changes");
  assert.equal(result.proposal, null);
});

test("does not accept explanations outside a JSON fence", () => {
  const result = parseDeepSeekResponse([
    "Here is the JSON:",
    "```json",
    validWireResponse({
      status: "no_changes",
      factualSuggestions: validFactualSuggestions({ city: "" }),
      understandingSuggestions: validUnderstandingSuggestions(),
    }),
    "```",
  ].join("\n"));

  assert.equal(result.status, "failed");
  assert.equal(result.proposal, null);
  assert.match(result.message, /invalid JSON/i);
});

test("API failures return a safe failed result", async () => {
  const provider = createDeepSeekAIEnrichmentProvider({
    apiKey: "test-key",
    fetchImpl: async () => jsonResponse("", 503),
  });

  const result = await provider.enrich(createRequest());

  assert.equal(result.status, "failed");
  assert.equal(result.proposal, null);
  assert.match(result.message, /503/);
});

test("durable cache hit avoids a second DeepSeek request", async () => {
  let providerCalls = 0;
  const cache = createMemoryCache();
  const provider = createDeepSeekAIEnrichmentProvider({
    apiKey: "test-key",
    cacheStore: cache.store,
    fetchImpl: async () => {
      providerCalls += 1;
      return jsonResponse(validWireResponse());
    },
  });
  const request = createRequest({ userId: "user-1" });

  const first = await provider.enrich(request);
  const second = await provider.enrich(request);

  assert.equal(first.status, "suggestions_available");
  assert.equal(first.cacheStatus, "miss");
  assert.equal(second.cacheStatus, "hit");
  assert.equal(providerCalls, 1);
  assert.equal(cache.getCalls(), 2);
  assert.equal(cache.setCalls(), 1);
});

test("forced reanalysis bypasses a valid cache row once", async () => {
  let providerCalls = 0;
  const cache = createMemoryCache();
  const provider = createDeepSeekAIEnrichmentProvider({
    apiKey: "test-key",
    cacheStore: cache.store,
    fetchImpl: async () => {
      providerCalls += 1;
      return jsonResponse(validWireResponse({
        understandingSuggestions: validUnderstandingSuggestions({ category: "Museum" }),
      }));
    },
  });
  const request = createRequest({ userId: "user-2" });

  await provider.enrich(request);
  const refreshed = await provider.enrich({ ...request, forceRefresh: true });

  assert.equal(refreshed.cacheStatus, "bypass");
  assert.equal(providerCalls, 2);
  assert.equal(cache.setCalls(), 2);
});

test("invalid cached data is discarded and triggers one fresh request", async () => {
  let providerCalls = 0;
  const cache = createMemoryCache({
    responseJson: { status: "suggestions_available", proposal: "unsafe" },
    expiresAt: new Date(Date.now() + 1000).toISOString(),
  });
  const provider = createDeepSeekAIEnrichmentProvider({
    apiKey: "test-key",
    cacheStore: cache.store,
    fetchImpl: async () => {
      providerCalls += 1;
      return jsonResponse(validWireResponse());
    },
  });

  const result = await provider.enrich(createRequest({ userId: "user-3" }));

  assert.equal(result.status, "suggestions_available");
  assert.equal(providerCalls, 1);
  assert.equal(cache.deleteCalls(), 1);
  assert.equal(cache.setCalls(), 1);
});

test("valid no_changes results are cached but failed results are not", async () => {
  const noChangesCache = createMemoryCache();
  let noChangesCalls = 0;
  const noChangesProvider = createDeepSeekAIEnrichmentProvider({
    apiKey: "test-key",
    cacheStore: noChangesCache.store,
    fetchImpl: async () => {
      noChangesCalls += 1;
      return jsonResponse(validWireResponse({
        status: "no_changes",
        factualSuggestions: validFactualSuggestions({ city: "" }),
      }));
    },
  });
  const noChangesRequest = createRequest({ userId: "user-4" });
  const noChangesFirst = await noChangesProvider.enrich(noChangesRequest);
  const noChangesSecond = await noChangesProvider.enrich(noChangesRequest);

  assert.equal(noChangesFirst.status, "no_changes");
  assert.equal(noChangesSecond.cacheStatus, "hit");
  assert.equal(noChangesCalls, 1);

  const failedCache = createMemoryCache();
  const failedProvider = createDeepSeekAIEnrichmentProvider({
    apiKey: "test-key",
    cacheStore: failedCache.store,
    fetchImpl: async () => jsonResponse("not-json"),
  });
  const failed = await failedProvider.enrich(createRequest({ userId: "user-5" }));

  assert.equal(failed.status, "failed");
  assert.equal(failedCache.setCalls(), 0);
});

test("cache read and write failures do not change provider results", async () => {
  let providerCalls = 0;
  const failingCache: AIEnrichmentCacheStore = {
    async get() {
      throw new Error("read failed");
    },
    async set() {
      throw new Error("write failed");
    },
  };
  const provider = createDeepSeekAIEnrichmentProvider({
    apiKey: "test-key",
    cacheStore: failingCache,
    fetchImpl: async () => {
      providerCalls += 1;
      return jsonResponse(validWireResponse());
    },
  });

  const result = await provider.enrich(createRequest({ userId: "user-6" }));

  assert.equal(result.status, "suggestions_available");
  assert.equal(providerCalls, 1);
});

test("concurrent duplicate requests share one provider call", async () => {
  let providerCalls = 0;
  const cache = createMemoryCache();
  const provider = createDeepSeekAIEnrichmentProvider({
    apiKey: "test-key",
    cacheStore: cache.store,
    fetchImpl: async () => {
      providerCalls += 1;
      await new Promise((resolve) => setTimeout(resolve, 10));
      return jsonResponse(validWireResponse());
    },
  });
  const request = createRequest({ userId: "user-7" });

  const results = await Promise.all([provider.enrich(request), provider.enrich(request)]);

  assert.equal(results[0].status, "suggestions_available");
  assert.equal(results[1].status, "suggestions_available");
  assert.equal(providerCalls, 1);
});
