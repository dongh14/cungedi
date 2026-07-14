import assert from "node:assert/strict";
import test from "node:test";
import { buildSourceIntake, parseSourceIntakeInput } from "./source-intake";

test("source intake accepts a valid URL and detects its domain", () => {
  const result = parseSourceIntakeInput("https://www.google.com/maps/place/example");

  assert.equal(result.ok, true);

  if (result.ok) {
    assert.equal(result.intake.sourceUrl, "https://www.google.com/maps/place/example");
    assert.equal(result.intake.domain, "google.com");
    assert.equal(result.intake.kind, "google-maps");
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

  assert.deepEqual(intake, {
    sourceUrl: "https://example.com/restaurants/blue-bottle",
    domain: "example.com",
    kind: "public-web",
    supportLevel: "official",
    extractionState: "not-started",
  });
});
