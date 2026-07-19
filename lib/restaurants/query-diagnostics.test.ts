import assert from "node:assert/strict";
import test from "node:test";
import {
  logRestaurantQueryError,
  normalizeRestaurantQueryError,
} from "./query-diagnostics.ts";

test("restaurant query diagnostics keep useful fields while redacting sensitive content", () => {
  const diagnostic = normalizeRestaurantQueryError("map places", {
    name: "PostgrestError",
    code: "PGRST204",
    message: "column missing https://example.test/private?token=secret",
    details: "authorization=Bearer secret-value",
    hint: "password=secret-value",
  });

  assert.deepEqual(diagnostic, {
    operation: "map places",
    name: "PostgrestError",
    code: "PGRST204",
    message: "column missing [redacted-url]",
    details: "authorization=[redacted]",
    hint: "password=[redacted]",
  });
  assert.doesNotMatch(JSON.stringify(diagnostic), /secret|https?:\/\//u);
});

test("restaurant query diagnostics log only in development or production", () => {
  const originalWarn = console.warn;
  const originalError = console.error;
  const calls: unknown[][] = [];
  console.warn = (...args: unknown[]) => calls.push(args);
  console.error = (...args: unknown[]) => calls.push(args);

  try {
    logRestaurantQueryError("collections", { code: "X", message: "failed" }, { NODE_ENV: "test" });
    assert.equal(calls.length, 0);
    logRestaurantQueryError("collections", { code: "X", message: "failed" }, { NODE_ENV: "development" });
    logRestaurantQueryError("collections", { code: "X", message: "failed" }, { NODE_ENV: "production" });
    assert.equal(calls.length, 2);
    assert.equal(calls[0][0], "[restaurants] query_failed");
    assert.equal(calls[1][0], "[restaurants] query_failed");
  } finally {
    console.warn = originalWarn;
    console.error = originalError;
  }
});
