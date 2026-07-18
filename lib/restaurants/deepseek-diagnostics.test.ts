import assert from "node:assert/strict";
import test from "node:test";
import {
  logDeepSeekDiagnostic,
  sanitizeSourceHostname,
  serializeSafeError,
} from "./deepseek-diagnostics.ts";

function captureLogs() {
  const debugCalls: unknown[][] = [];
  const errorCalls: unknown[][] = [];
  const originalDebug = console.debug;
  const originalError = console.error;

  console.debug = (...args) => {
    debugCalls.push(args);
  };
  console.error = (...args) => {
    errorCalls.push(args);
  };

  return {
    debugCalls,
    errorCalls,
    restore() {
      console.debug = originalDebug;
      console.error = originalError;
    },
  };
}

test("source diagnostics keep only hostnames", () => {
  assert.equal(
    sanitizeSourceHostname("https://example.com/private/path?token=secret#fragment"),
    "example.com",
  );
  assert.equal(sanitizeSourceHostname("not a url"), "unknown-host");
  assert.equal(sanitizeSourceHostname("https://User:password@Example.com/"), "example.com");
});

test("safe errors redact credentials, URLs, and response-like text", () => {
  const serialized = serializeSafeError({
    operation: "provider_request",
    error: new Error(
      "Bearer test-secret https://example.com/path?private=evidence response={name:secret}",
    ),
    safeMessage: "Provider request failed.",
    httpStatus: 500,
    providerCode: "upstream_error",
    retryable: true,
  });

  assert.deepEqual(serialized, {
    operation: "provider_request",
    name: "Error",
    message: "Provider request failed.",
    providerCode: "upstream_error",
    httpStatus: 500,
    retryable: true,
  });
});

test("debug logs omit raw responses, evidence, keys, and full cache keys by default", () => {
  const logs = captureLogs();

  try {
    logDeepSeekDiagnostic(
      {
        event: "provider_call",
        cacheKey: "ai-enrichment:1234567890abcdef1234567890abcdef",
        model: "deepseek-v4-flash",
        promptVersion: "place-enrichment-v2",
        sourceUrls: ["https://example.com/path?evidence=private"],
        rawResponseText: "private evidence and secret response",
      },
      {
        NODE_ENV: "development",
        DEEPSEEK_DEBUG_LOGS: "true",
        DEEPSEEK_DEBUG_RAW_RESPONSE: "false",
      },
    );

    const output = JSON.stringify(logs.debugCalls);
    assert.match(output, /example\.com/);
    assert.doesNotMatch(output, /\/path/);
    assert.doesNotMatch(output, /evidence=private/);
    assert.doesNotMatch(output, /private evidence/);
    assert.doesNotMatch(output, /1234567890abcdef1234567890abcdef/);
  } finally {
    logs.restore();
  }
});

test("production omits successful events but emits sanitized actionable errors", () => {
  const logs = captureLogs();

  try {
    const env: NodeJS.ProcessEnv = { NODE_ENV: "production", DEEPSEEK_DEBUG_LOGS: "true" };
    logDeepSeekDiagnostic({ event: "cache_hit", model: "test-model" }, env);
    logDeepSeekDiagnostic(
      {
        event: "provider_failure",
        model: "test-model",
        sourceUrls: ["https://example.com/path?private=evidence"],
        error: serializeSafeError({
          operation: "provider_request",
          error: new Error("Bearer test-key https://example.com/private?x=1"),
          safeMessage: "DeepSeek request failed.",
          httpStatus: 503,
          retryable: true,
        }),
      },
      env,
    );

    assert.equal(logs.debugCalls.length, 0);
    assert.equal(logs.errorCalls.length, 1);
    const output = JSON.stringify(logs.errorCalls);
    assert.match(output, /DeepSeek request failed/);
    assert.match(output, /example\.com/);
    assert.doesNotMatch(output, /test-key/);
    assert.doesNotMatch(output, /\/private/);
    assert.doesNotMatch(output, /x=1/);
  } finally {
    logs.restore();
  }
});

test("raw responses remain disabled in production even when the flag is set", () => {
  const logs = captureLogs();

  try {
    logDeepSeekDiagnostic(
      { event: "raw_response", rawResponseText: "private response" },
      { NODE_ENV: "production", DEEPSEEK_DEBUG_RAW_RESPONSE: "true" },
    );

    assert.equal(logs.debugCalls.length, 0);
    assert.equal(logs.errorCalls.length, 0);
  } finally {
    logs.restore();
  }
});
