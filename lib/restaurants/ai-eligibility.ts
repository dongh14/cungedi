import type { NormalizedExtractionResult } from "./extraction-architecture.ts";
import type { MergedPlaceDraft, PlaceDraftField } from "./place-draft-merge.ts";

export const aiMeaningfulFields: PlaceDraftField[] = [
  "name",
  "city",
  "category",
  "address",
  "phone",
  "notes",
];

export type AIEnrichmentEligibility = {
  shouldRun: boolean;
  missingFields: PlaceDraftField[];
  conflictFields: PlaceDraftField[];
  reasons: string[];
};

function normalizeValue(value: string | number | null | undefined) {
  return typeof value === "string" ? value.trim().toLocaleLowerCase() : value;
}

function hasValue(value: string | number | null | undefined) {
  return typeof value === "number"
    ? Number.isFinite(value)
    : typeof value === "string"
      ? Boolean(value.trim())
      : false;
}

function getConflictFields(results: NormalizedExtractionResult[]) {
  return aiMeaningfulFields.filter((field) => {
    const values = new Set(
      results
        .map((result) => normalizeValue(result[field]))
        .filter((value): value is string | number => value !== null && value !== undefined && value !== ""),
    );

    return values.size > 1;
  });
}

export function evaluateAIEnrichmentEligibility(input: {
  draft: MergedPlaceDraft;
  extractedSourceData: NormalizedExtractionResult[];
  missingFields: PlaceDraftField[];
}): AIEnrichmentEligibility {
  const missingFields = input.missingFields.filter((field) => aiMeaningfulFields.includes(field));
  const conflictFields = getConflictFields(input.extractedSourceData);
  const hasLowConfidence = input.extractedSourceData.some(
    (result) => result.confidence === "low" || result.extractionStatus === "unavailable",
  );
  const hasIncompleteDraft = missingFields.some((field) => !hasValue(input.draft[field]));
  const reasons: string[] = [];

  if (hasIncompleteDraft) {
    reasons.push("meaningful_fields_missing");
  }

  if (conflictFields.length > 0) {
    reasons.push("source_conflict");
  }

  if (hasLowConfidence) {
    reasons.push("low_confidence");
  }

  return {
    shouldRun: reasons.length > 0,
    missingFields,
    conflictFields,
    reasons,
  };
}
