import assert from "node:assert/strict";
import test from "node:test";
import { preflightPmtilesArchive } from "./pmtiles-preflight.ts";

function response(status, body = new Uint8Array([1, 2, 3]), headers = {}) {
  return new Response(body, { status, headers });
}

test("PMTiles preflight validates a bounded byte-range response", async () => {
  const result = await preflightPmtilesArchive("/maps/base.pmtiles", {
    fetchImpl: async () => response(206, new Uint8Array([1, 2]), { "content-range": "bytes 0-1/53" }),
  });

  assert.deepEqual(result, {
    status: "ready",
    httpStatus: 206,
    byteLength: 2,
    rangeSupported: true,
  });
});

test("PMTiles preflight rejects an empty or invalid response", async () => {
  const empty = await preflightPmtilesArchive("/maps/base.pmtiles", {
    fetchImpl: async () => response(200, new Uint8Array()),
  });
  const invalid = await preflightPmtilesArchive("/maps/base.pmtiles", {
    fetchImpl: async () => response(404),
  });

  assert.equal(empty.status, "error");
  assert.equal(empty.reason, "empty_response");
  assert.equal(invalid.status, "error");
  assert.equal(invalid.reason, "invalid_response");
});

test("PMTiles preflight reports a bounded timeout", async () => {
  const result = await preflightPmtilesArchive("/maps/base.pmtiles", {
    timeoutMs: 1,
    fetchImpl: (_input, init) => new Promise((_resolve, reject) => {
      init?.signal?.addEventListener("abort", () => reject(new DOMException("Aborted", "AbortError")));
    }),
  });

  assert.deepEqual(result, { status: "error", reason: "timeout" });
});
