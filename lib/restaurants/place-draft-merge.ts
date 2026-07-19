import type {
  ExtractedField,
  NormalizedExtractionResult,
  SourceType,
} from "./extraction-architecture.ts";
import { normalizePlaceCategory, normalizePlaceSubtype } from "./constants.ts";

export const placeDraftFields = [
  "name",
  "category",
  "cuisine",
  "city",
  "country",
  "district",
  "address",
  "latitude",
  "longitude",
  "description",
  "notes",
  "phone",
  "websiteUrl",
  "imageUrl",
] as const;

export type PlaceDraftField = (typeof placeDraftFields)[number];
export type PlaceDraftSource =
  | Exclude<SourceType, "unknown">
  | "manual"
  | "manual_evidence"
  | "ai_suggestion";

export type ManualPlaceDraft = Partial<
  Record<PlaceDraftField, string | number | null>
>;

export type MergedPlaceDraft = {
  name: string | null;
  category: string | null;
  cuisine: string | null;
  city: string | null;
  country?: string | null;
  district?: string | null;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  description: string | null;
  notes: string | null;
  phone: string | null;
  websiteUrl: string | null;
  imageUrl: string | null;
  sourceUrl: string | null;
  sourceUrls: string[];
  fieldSources: Partial<Record<PlaceDraftField, PlaceDraftSource>>;
};

function hasValue(value: string | number | null | undefined) {
  return typeof value === "number"
    ? Number.isFinite(value)
    : typeof value === "string"
      ? Boolean(value.trim())
      : false;
}

function normalizeValue(value: string | number | null | undefined) {
  if (!hasValue(value)) {
    return null;
  }

  return typeof value === "string" ? value.trim() : value;
}

function getSource(
  result: NormalizedExtractionResult,
  field?: ExtractedField,
): PlaceDraftSource {
  if (field && result.fieldOrigins?.[field] === "manual_evidence") {
    return "manual_evidence";
  }

  return result.sourceType === "unknown" ? "website" : result.sourceType;
}

function isStructuredField(
  result: NormalizedExtractionResult,
  field: ExtractedField,
) {
  return result.fieldOrigins?.[field] === "structured";
}

function getAutomaticRank(
  result: NormalizedExtractionResult,
  field: PlaceDraftField,
) {
  const source = getSource(result, field);
  const structured = isStructuredField(result, field);

  switch (field) {
    case "name":
      return source === "manual_evidence"
        ? 250
        : structured && source === "website"
        ? 400
        : source === "google_maps"
          ? 300
          : source === "website"
            ? 200
            : 100;
    case "address":
      return source === "manual_evidence"
        ? 250
        : structured && source === "website"
        ? 300
        : source === "google_maps"
          ? 200
          : source === "website"
            ? 100
            : 0;
    case "category":
      return source === "manual_evidence"
        ? 250
        : structured && source === "website"
          ? 300
          : source === "website"
            ? 100
            : 0;
    case "cuisine":
      return 0;
    case "description":
      return source === "manual_evidence" ? 250 : source === "website" ? 200 : 0;
    case "city":
      return source === "manual_evidence"
        ? 150
        : source === "website" || source === "google_maps"
          ? 100
          : 0;
    case "country":
      return source === "manual_evidence"
        ? 150
        : structured && source === "website"
          ? 200
          : source === "website" || source === "google_maps"
            ? 100
            : 0;
    case "district":
      return source === "manual_evidence"
        ? 150
        : structured && source === "website"
          ? 200
          : source === "website" || source === "google_maps"
            ? 100
            : 0;
    case "phone":
    case "websiteUrl":
      return source === "manual_evidence"
        ? 250
        : source === "website"
          ? (structured ? 200 : 100)
          : 0;
    case "imageUrl":
      return source === "website" ? (structured ? 300 : 200) : 0;
    case "latitude":
    case "longitude":
      return source === "google_maps" ? 200 : 0;
    case "notes":
      return source === "manual_evidence" ? 250 : 0;
  }
}

function getResultValue(result: NormalizedExtractionResult, field: PlaceDraftField) {
  return normalizeValue(result[field]);
}

function chooseField(
  field: PlaceDraftField,
  results: NormalizedExtractionResult[],
  manual: ManualPlaceDraft,
) {
  const manualFieldProvided = field === "description"
    ? manual.description !== undefined || manual.notes !== undefined
    : manual[field] !== undefined;
  const manualValue = normalizeValue(
    field === "description" ? manual.description ?? manual.notes : manual[field],
  );

  if (field !== "latitude" && field !== "longitude" && manualFieldProvided) {
    return { value: manualValue, source: "manual" as const };
  }

  const candidates = results
    .map((result, index) => ({
      value: getResultValue(result, field),
      source: getSource(result, field),
      rank: getAutomaticRank(result, field),
      index,
    }))
    .filter((candidate) => candidate.value !== null && candidate.rank > 0)
    .sort((left, right) => right.rank - left.rank || left.index - right.index);

  if (candidates[0]) {
    return {
      value: candidates[0].value,
      source: candidates[0].source,
    };
  }

  return manualValue === null
    ? { value: null, source: undefined }
    : { value: manualValue, source: "manual" as const };
}

export function mergePlaceDraftSources(
  results: NormalizedExtractionResult[],
  manual: ManualPlaceDraft = {},
): MergedPlaceDraft {
  const fieldSources: Partial<Record<PlaceDraftField, PlaceDraftSource>> = {};
  const merged = {} as Pick<
    MergedPlaceDraft,
    Exclude<keyof MergedPlaceDraft, "sourceUrl" | "sourceUrls" | "fieldSources">
  >;

  for (const field of placeDraftFields) {
    const selected = chooseField(field, results, manual);
    const normalizedValue = field === "category"
      ? normalizePlaceCategory(typeof selected.value === "string" ? selected.value : null)
      : field === "cuisine"
        ? normalizePlaceSubtype(
            typeof selected.value === "string" ? selected.value : null,
            typeof merged.category === "string" ? merged.category : null,
          )
        : selected.value;
    merged[field] = normalizedValue as never;

    if (selected.source && (normalizedValue !== null && normalizedValue !== undefined || selected.source === "manual")) {
      fieldSources[field] = selected.source;
    }
  }

  const sourceUrls = Array.from(
    new Set(results.map((result) => result.sourceUrl).filter(Boolean)),
  );
  const manualSourceUrl = normalizeValue(manual.websiteUrl);

  return {
    ...merged,
    sourceUrl: sourceUrls[0] ?? (typeof manualSourceUrl === "string" ? manualSourceUrl : null),
    sourceUrls,
    fieldSources,
  };
}
