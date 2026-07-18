import assert from "node:assert/strict";
import test from "node:test";
import {
  buildManualEvidenceExtractionResult,
  extractManualEvidenceFields,
  isWebsiteRecoveryRequired,
  maxManualEvidenceCharacters,
  normalizeManualEvidenceText,
} from "./manual-evidence.ts";
import { mergePlaceDraftSources } from "./place-draft-merge.ts";
import { runAIEnrichment } from "./ai-enrichment.ts";

test("normalizes visible text, rejects empty or HTML input, and bounds URL-backed evidence", () => {
  assert.deepEqual(normalizeManualEvidenceText("  Place\n\n Shanghai  "), {
    ok: true,
    text: "Place\nShanghai",
  });
  assert.equal(normalizeManualEvidenceText("   ").ok, false);
  assert.equal(normalizeManualEvidenceText("<script>alert(1)</script>").ok, false);

  const longText = normalizeManualEvidenceText("x".repeat(maxManualEvidenceCharacters + 200));
  assert.equal(longText.ok, true);
  assert.equal(longText.ok && longText.text.length, maxManualEvidenceCharacters);
});

test("offers recovery for blocked, timed out, invalid, or metadata-empty websites only", () => {
  for (const fetchStatus of ["blocked", "timeout", "invalid_response"]) {
    assert.equal(isWebsiteRecoveryRequired({
      sourceType: "website",
      extractionStatus: "unavailable",
      fetchStatus,
    }), true);
  }

  assert.equal(isWebsiteRecoveryRequired({
    sourceType: "website",
    extractionStatus: "partial",
    fetchStatus: "success",
  }), false);
  assert.equal(isWebsiteRecoveryRequired({
    sourceType: "google_maps",
    extractionStatus: "unavailable",
    fetchStatus: null,
  }), false);
});

test("extracts only obvious phone, address, known city, category, and labeled description evidence", () => {
  const fields = extractManualEvidenceFields([
    "City Art Gallery",
    "Shanghai",
    "地址：上海市静安区愚园路 88 号",
    "电话：021-5555-6666",
    "Art Gallery",
    "简介：适合慢慢参观的城市空间。",
  ].join("\n"));

  assert.deepEqual(fields, {
    name: "City Art Gallery",
    city: "上海",
    address: "上海市静安区愚园路 88 号",
    phone: "021-5555-6666",
    category: "景点",
    description: "适合慢慢参观的城市空间。",
  });
});

test("unknown locations and unsupported terms remain empty", () => {
  const result = buildManualEvidenceExtractionResult(
    "https://example.com/place",
    "A useful heading\nUnknownville\nA phrase without a supported category",
  );

  assert.equal(result.name, "A useful heading");
  assert.equal(result.city, null);
  assert.equal(result.category, null);
  assert.equal(result.address, null);
  assert.equal(result.phone, null);
  assert.equal(result.evidence?.manualText, "A useful heading\nUnknownville\nA phrase without a supported category");
});

test("manual evidence is attributed and deterministic completeness skips DeepSeek", async () => {
  const result = buildManualEvidenceExtractionResult(
    "https://example.com/place",
    [
      "Known Place",
      "Shanghai",
      "地址：上海市静安区愚园路 88 号",
      "电话：021-5555-6666",
      "Restaurant",
      "简介：A concise place description.",
    ].join("\n"),
  );
  const draft = mergePlaceDraftSources([result]);
  let called = false;

  const enrichment = await runAIEnrichment(
    {
      mergedPlaceDraft: draft,
      extractedSourceData: [result],
      sourceUrls: [result.sourceUrl],
      missingFields: [],
    },
    {
      id: "test-provider",
      enrich: async () => {
        called = true;
        return { status: "failed", message: "should not run", proposal: null };
      },
    },
  );

  assert.equal(draft.fieldSources.name, "manual_evidence");
  assert.equal(draft.fieldSources.address, "manual_evidence");
  assert.equal(draft.notes, "A concise place description.");
  assert.equal(enrichment.status, "no_changes");
  assert.equal(called, false);
});
