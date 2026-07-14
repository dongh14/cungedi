import assert from "node:assert/strict";
import test from "node:test";
import { buildSourceIntake, parseSourceIntakeInput } from "./source-intake.ts";

test("source intake accepts a valid URL and detects its domain", () => {
  const result = parseSourceIntakeInput("https://www.google.com/maps/place/example");

  assert.equal(result.ok, true);

  if (result.ok) {
    assert.equal(result.intake.sourceUrl, "https://www.google.com/maps/place/example");
    assert.equal(result.intake.domain, "google.com");
    assert.equal(result.intake.sourceType, "google_maps");
    assert.equal(result.intake.kind, "google-maps");
    assert.equal(result.intake.extractionStatus, "partial");
    assert.equal(result.intake.extractionResult.name, "example");
    assert.deepEqual(result.intake.extractionResult.extractedFields, ["name"]);
  }
});

test("source intake handles invalid input", () => {
  const result = parseSourceIntakeInput("not a url");

  assert.equal(result.ok, false);

  if (!result.ok) {
    assert.match(result.error, /有效的链接/);
  }
});

test("source intake preserves manual-review compatible public web sources", () => {
  const intake = buildSourceIntake("https://example.com/restaurants/blue-bottle");

  assert.equal(intake.sourceUrl, "https://example.com/restaurants/blue-bottle");
  assert.equal(intake.domain, "example.com");
  assert.equal(intake.sourceType, "website");
  assert.equal(intake.kind, "public-web");
  assert.equal(intake.supportLevel, "official");
  assert.equal(intake.extractionState, "not-started");
  assert.equal(intake.extractionStatus, "unavailable");
  assert.equal(intake.extractionResult.sourceType, "website");
  assert.equal(intake.extractionResult.name, null);
});
