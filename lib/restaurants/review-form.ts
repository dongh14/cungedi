import type {
  RestaurantExtractionCandidate,
  RestaurantExtractionResult,
} from "./extraction-types";
import {
  defaultRestaurantCategory,
  isRestaurantCategory,
  type RestaurantCategory,
  type RestaurantPrivacy,
} from "./constants";

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
    error: string;
    message: string;
  }
>;

export type AcceptedCandidateFieldKey = keyof RestaurantExtractionCandidate["fields"];

const REQUIRED_FIELDS: AcceptedCandidateFieldKey[] = ["name", "city"];
const OPTIONAL_FIELDS: AcceptedCandidateFieldKey[] = ["address", "cuisine"];

function getAcceptedFieldValue(
  candidate: RestaurantExtractionCandidate,
  field: AcceptedCandidateFieldKey,
) {
  const extractedField = candidate.fields[field];

  return extractedField.accepted && extractedField.value ? extractedField.value : "";
}

export function getInitialDraftFormValues(
  result: RestaurantExtractionResult,
  overrides: ReviewSearchParams,
): RestaurantDraftFormValues {
  const extractedValues =
    result.status === "success"
      ? {
          name: getAcceptedFieldValue(result.candidate, "name"),
          city: getAcceptedFieldValue(result.candidate, "city"),
          address: getAcceptedFieldValue(result.candidate, "address"),
          cuisine: getAcceptedFieldValue(result.candidate, "cuisine"),
        }
      : {
          name: "",
          city: "",
          address: "",
          cuisine: "",
        };

  return {
    name: overrides.name ?? extractedValues.name,
    city: overrides.city ?? extractedValues.city,
    source_input: overrides.source_input ?? result.sourceUrl,
    privacy: overrides.privacy === "public" ? "public" : "private",
    category:
      overrides.category !== undefined && isRestaurantCategory(overrides.category)
        ? overrides.category
        : defaultRestaurantCategory,
    address: overrides.address ?? extractedValues.address,
    cuisine: overrides.cuisine ?? extractedValues.cuisine,
    note: overrides.note ?? "",
  };
}

export function getMissingCandidateFields(
  result: RestaurantExtractionResult,
): Array<{
  key: AcceptedCandidateFieldKey;
  label: string;
  required: boolean;
}> {
  if (result.status !== "success") {
    return [
      { key: "name", label: "餐厅名称", required: true },
      { key: "city", label: "城市", required: true },
      { key: "address", label: "地址", required: false },
      { key: "cuisine", label: "菜系或类型", required: false },
    ];
  }

  const requiredMissing = REQUIRED_FIELDS.filter(
    (field) => !result.candidate.fields[field].accepted,
  ).map((field) => ({
    key: field,
    label: field === "name" ? "餐厅名称" : "城市",
    required: true,
  }));

  const optionalMissing = OPTIONAL_FIELDS.filter(
    (field) => !result.candidate.fields[field].accepted,
  ).map((field) => ({
    key: field,
    label: field === "address" ? "地址" : "菜系或类型",
    required: false,
  }));

  return [...requiredMissing, ...optionalMissing];
}
