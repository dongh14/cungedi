import {
  defaultRestaurantCategory,
  isRestaurantCategory,
  type RestaurantCategory,
  type RestaurantPrivacy,
} from "./constants";
import type { RestaurantInsertInput } from "./types";

export type RestaurantDraftFormValues = {
  name: string;
  city: string;
  source_input: string;
  privacy: RestaurantPrivacy;
  category: RestaurantCategory;
  address: string;
  cuisine: string;
  note: string;
};

export type ReviewSearchParams = Partial<
  RestaurantDraftFormValues & {
    source_url: string;
    error: string;
    message: string;
  }
>;

export function getInitialDraftFormValues(
  searchParams: ReviewSearchParams,
  sourceUrl: string,
): RestaurantDraftFormValues {
  return {
    name: searchParams.name ?? "",
    city: searchParams.city ?? "",
    source_input: searchParams.source_input ?? sourceUrl,
    privacy: searchParams.privacy === "public" ? "public" : "private",
    category:
      searchParams.category !== undefined &&
      isRestaurantCategory(searchParams.category)
        ? searchParams.category
        : defaultRestaurantCategory,
    address: searchParams.address ?? "",
    cuisine: searchParams.cuisine ?? "",
    note: searchParams.note ?? "",
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
      label: "类型细分",
      required: false,
    });
  }

  return missingFields;
}

function normalizeOptionalField(value: string) {
  const normalizedValue = value.trim();

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
    sourceUrl: values.source_input.trim(),
    privacy: values.privacy as RestaurantPrivacy,
    category: values.category as RestaurantCategory,
    address: normalizeOptionalField(values.address),
    cuisine: normalizeOptionalField(values.cuisine),
    note: normalizeOptionalField(values.note),
    returnTo: "review",
    reviewSourceUrl: sourceUrl,
  };
}
