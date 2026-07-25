import { normalizePlaceCategory, normalizePlaceSubtype } from "@/lib/restaurants/constants";
import type { CanonicalPlaceCategory } from "@/lib/restaurants/constants";
import type { SourcePostPlaceCandidate, SourcePostExtractionResult } from "./extraction-types";

const extractionStatuses = new Set(["success", "partial", "insufficient_evidence", "failed"]);
const confidences = new Set(["high", "medium", "low"]);
const candidateKeys = [
  "id",
  "name",
  "country",
  "city",
  "district",
  "address",
  "category",
  "subcategory",
  "note",
  "confidence",
  "evidence",
  "warnings",
] as const;

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function normalizeNullableString(value: unknown, maxLength: number) {
  if (value === null || value === undefined) return null;
  if (typeof value !== "string") return undefined;
  const normalized = value.trim().replace(/\s+/gu, " ");
  return normalized ? normalized.slice(0, maxLength) : null;
}

function normalizeStringList(value: unknown, maxItems: number, maxLength: number) {
  if (!Array.isArray(value) || value.length > maxItems) return null;
  const items = value.map((entry) => normalizeNullableString(entry, maxLength));
  return items.every((entry): entry is string => typeof entry === "string" && Boolean(entry))
    ? items
    : null;
}

function hasExactKeys(value: Record<string, unknown>, keys: readonly string[]) {
  const actual = Object.keys(value).sort();
  return actual.length === keys.length && actual.every((key, index) => key === [...keys].sort()[index]);
}

function normalizeCandidate(
  value: unknown,
  idFactory: () => string,
): SourcePostPlaceCandidate | null {
  if (!isRecord(value) || !hasExactKeys(value, candidateKeys)) return null;

  const confidence = value.confidence;
  const name = normalizeNullableString(value.name, 160);
  const categoryValue = normalizeNullableString(value.category, 40);
  const category = categoryValue ? normalizePlaceCategory(categoryValue) : null;

  if (!confidences.has(String(confidence)) || (categoryValue && !category)) return null;

  const subcategoryValue = normalizeNullableString(value.subcategory, 80);
  const subcategory = subcategoryValue && category
    ? normalizePlaceSubtype(subcategoryValue, category)
    : null;
  const evidence = normalizeStringList(value.evidence, 6, 240);
  const warnings = normalizeStringList(value.warnings, 6, 240);

  if (!evidence || evidence.length === 0) return null;

  return {
    id: idFactory(),
    name: name ?? null,
    country: normalizeNullableString(value.country, 80) ?? null,
    city: normalizeNullableString(value.city, 100) ?? null,
    district: normalizeNullableString(value.district, 100) ?? null,
    address: normalizeNullableString(value.address, 240) ?? null,
    category: category as CanonicalPlaceCategory | null,
    subcategory,
    note: normalizeNullableString(value.note, 600) ?? null,
    confidence: confidence as "high" | "medium" | "low",
    evidence,
    warnings: warnings ?? [],
  };
}

export function validateSourcePostExtractionResult(
  value: unknown,
  idFactory: () => string = () => crypto.randomUUID(),
): SourcePostExtractionResult | null {
  if (!isRecord(value) || !hasExactKeys(value, ["candidates", "summary", "extractionStatus"])) return null;
  if (!Array.isArray(value.candidates) || value.candidates.length > 8 || !extractionStatuses.has(String(value.extractionStatus))) return null;

  const candidates = value.candidates.map((candidate) => normalizeCandidate(candidate, idFactory));
  if (candidates.some((candidate) => candidate === null)) return null;

  const summary = normalizeNullableString(value.summary, 600);
  return {
    candidates: candidates as SourcePostPlaceCandidate[],
    summary: summary ?? null,
    extractionStatus: value.extractionStatus as SourcePostExtractionResult["extractionStatus"],
  };
}

export function getValidatedSourcePostCandidates(value: unknown) {
  if (!Array.isArray(value)) return [];

  return value
    .map((candidate) => normalizeCandidate(candidate, () => typeof (candidate as { id?: unknown })?.id === "string" ? String((candidate as { id: string }).id) : crypto.randomUUID()))
    .filter((candidate): candidate is SourcePostPlaceCandidate => candidate !== null);
}
