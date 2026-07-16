import type { NormalizedExtractionResult } from "./extraction-architecture.ts";
import type { MergedPlaceDraft, PlaceDraftField, PlaceDraftSource } from "./place-draft-merge.ts";

const reviewComparisonFields: PlaceDraftField[] = [
  "name",
  "category",
  "city",
  "address",
  "phone",
  "notes",
];

function normalizeComparisonValue(value: string | number | null | undefined) {
  return typeof value === "string" ? value.trim().toLocaleLowerCase() : value;
}

export function getConflictingReviewFields(results: NormalizedExtractionResult[]) {
  return reviewComparisonFields.filter((field) => {
    const distinctValues = new Set(
      results
        .map((result) => normalizeComparisonValue(result[field]))
        .filter((value): value is string | number => value !== null && value !== ""),
    );

    return distinctValues.size > 1;
  });
}

export function getReviewSourceBadges(draft: MergedPlaceDraft): PlaceDraftSource[] {
  return Array.from(new Set(Object.values(draft.fieldSources).filter(Boolean))) as PlaceDraftSource[];
}
