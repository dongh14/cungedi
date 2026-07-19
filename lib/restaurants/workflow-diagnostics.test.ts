import assert from "node:assert/strict";
import test from "node:test";
import { logWorkflowDiagnostic } from "./workflow-diagnostics.ts";

test("workflow diagnostics keep only source hosts and omit content", () => {
  const messages: unknown[][] = [];
  const originalDebug = console.debug;
  console.debug = (...args: unknown[]) => messages.push(args);

  try {
    logWorkflowDiagnostic(
      {
        event: "extraction_completed",
        sourceUrls: ["https://example.com/private/place?token=secret"],
        sourceType: "website",
        extractionStatus: "partial",
        durationMs: 12,
      },
      { NODE_ENV: "development" },
    );
  } finally {
    console.debug = originalDebug;
  }

  assert.equal(messages.length, 1);
  const serialized = JSON.stringify(messages);
  assert.match(serialized, /example\.com/u);
  assert.doesNotMatch(serialized, /private|token|secret|https:\/\//u);
});

test("workflow diagnostics are disabled in production", () => {
  const messages: unknown[][] = [];
  const originalDebug = console.debug;
  console.debug = (...args: unknown[]) => messages.push(args);

  try {
    logWorkflowDiagnostic(
      { event: "review_ready", sourceUrls: ["https://example.com/place"] },
      { NODE_ENV: "production" },
    );
  } finally {
    console.debug = originalDebug;
  }

  assert.equal(messages.length, 0);
});

