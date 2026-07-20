import {
  defaultRestaurantCategory,
  normalizePlaceCategory,
  normalizePlaceSubtype,
  personalOnlyPrivacy,
  type CanonicalPlaceCategory,
  type RestaurantPrivacy,
} from "./constants.ts";
import type { RestaurantInsertInput } from "./types.ts";
import type { NormalizedExtractionResult } from "./extraction-architecture.ts";
import { normalizeSelectedCollectionIds } from "./collection-memberships.ts";
import { resolvePlaceArea } from "../location.ts";
import type { SourceResolutionStatus } from "../intake/types.ts";

export type RestaurantDraftFormValues = {
  name: string;
  city: string;
  district?: string;
  country?: string;
  source_input: string;
  privacy: RestaurantPrivacy;
  category: CanonicalPlaceCategory;
  address: string;
  cuisine: string;
  note: string;
};

export type ReviewSearchParams = Partial<
  RestaurantDraftFormValues & {
    source_url: string;
    resolved_source_url: string;
    source_resolution_status: SourceResolutionStatus;
    source_resolution_redirect_count: string;
    collection_ids: string | string[];
    manual_evidence: string;
    error: string;
    message: string;
    sourcePostError: string;
  }
>;

export function getReviewCollectionIds(value: string | string[] | undefined) {
  const values = Array.isArray(value) ? value : value ? [value] : [];

  return normalizeSelectedCollectionIds(values.flatMap((entry) => entry.split(",")));
}

export function getInitialDraftFormValues(
  searchParams: ReviewSearchParams,
  sourceUrl: string,
  extractionResult?: Partial<Pick<
    NormalizedExtractionResult,
    "name" | "city" | "country" | "district" | "address" | "category" | "notes" | "description"
  >> & { cuisine?: string | null },
): RestaurantDraftFormValues {
  return {
    name: searchParams.name ?? extractionResult?.name ?? "",
    city: searchParams.city ?? extractionResult?.city ?? "",
    country: searchParams.country ?? extractionResult?.country ?? resolvePlaceArea({ city: searchParams.city ?? extractionResult?.city }).country ?? "",
    district: searchParams.district ?? extractionResult?.district ?? "",
    source_input: searchParams.source_input ?? sourceUrl,
    privacy: personalOnlyPrivacy,
    category:
      normalizePlaceCategory(searchParams.category) ??
      normalizePlaceCategory(extractionResult?.category) ??
      defaultRestaurantCategory,
    address: searchParams.address ?? extractionResult?.address ?? "",
    cuisine: normalizePlaceSubtype(searchParams.cuisine ?? extractionResult?.cuisine) ?? "",
    note: searchParams.note ?? extractionResult?.notes ?? extractionResult?.description ?? "",
  };
}

export function getMissingDraftFields(
  values: RestaurantDraftFormValues,
): Array<{
  key: keyof Pick<RestaurantDraftFormValues, "name" | "city" | "address" | "cuisine">;
  label: string;
  required: boolean;
}> {
  const missingFields: Array<{
    key: keyof Pick<RestaurantDraftFormValues, "name" | "city" | "address" | "cuisine">;
    label: string;
    required: boolean;
  }> = [];

  if (!values.name.trim()) {
    missingFields.push({
      key: "name",
      label: "地点名称",
      required: true,
    });
  }

  if (!values.city.trim()) {
    missingFields.push({
      key: "city",
      label: "城市",
      required: true,
    });
  }

  if (!values.address.trim()) {
    missingFields.push({
      key: "address",
      label: "地址",
      required: false,
    });
  }

  if (!values.cuisine.trim()) {
    missingFields.push({
      key: "cuisine",
      label: "子分类",
      required: false,
    });
  }

  return missingFields;
}

function normalizeOptionalField(value: string | undefined) {
  const normalizedValue = value?.trim() ?? "";

  return normalizedValue ? normalizedValue : null;
}

export function buildRestaurantDraftInput(
  overrides: ReviewSearchParams,
  sourceUrl: string,
): RestaurantInsertInput {
  const values = getInitialDraftFormValues(overrides, sourceUrl);

  return {
    name: values.name.trim(),
    city: values.city.trim(),
    country: normalizeOptionalField(values.country),
    district: normalizeOptionalField(values.district),
    sourceUrl: values.source_input.trim(),
    privacy: personalOnlyPrivacy,
    category: values.category,
    address: normalizeOptionalField(values.address),
    cuisine: normalizeOptionalField(values.cuisine),
    note: normalizeOptionalField(values.note),
    returnTo: "review",
    reviewSourceUrl: sourceUrl,
  };
}
