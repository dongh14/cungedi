import type {
  ExtractedRestaurantField,
  RestaurantFieldConfidence,
  RestaurantFieldEvidenceSource,
  StructuredDataPostalAddress,
} from "./extraction-types";

const genericRestaurantNames = new Set([
  "locations",
  "location",
  "menu",
  "home",
  "restaurants",
  "restaurant",
  "contact",
  "about",
  "order online",
  "reservations",
  "reserve",
]);

const navigationLikePattern =
  /\b(newsletter|subscribe|privacy|cookie|terms|careers|careers|gift card|sign up|sign-up|follow us|locations|location finder|store locator)\b/i;

const addressPattern =
  /(?:路|街|道|大道|巷|号|广场|商场|里|弄|floor|fl\.|street|st\b|road|rd\b|avenue|ave\b|boulevard|blvd\b|lane|ln\b|drive|dr\b|suite|ste\b|building|bldg\b)/i;

function normalizeWhitespace(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function createField(
  value: string | null,
  confidence: RestaurantFieldConfidence = "none",
  evidenceSource: RestaurantFieldEvidenceSource | null = null,
  accepted = false,
  rejectionReason: string | null = null,
): ExtractedRestaurantField {
  return {
    value,
    confidence,
    evidenceSource,
    accepted,
    rejectionReason,
  };
}

export function buildEmptyField() {
  return createField(null);
}

export function validateRestaurantName(input: {
  value: string | null;
  confidence: RestaurantFieldConfidence;
  evidenceSource: RestaurantFieldEvidenceSource;
}) {
  const value = input.value ? normalizeWhitespace(input.value) : null;

  if (!value) {
    return createField(null, "none", null, false, "empty");
  }

  const normalizedValue = value.toLowerCase();

  if (value.length < 2 || value.length > 80) {
    return createField(null, "none", input.evidenceSource, false, "invalid_length");
  }

  if (genericRestaurantNames.has(normalizedValue)) {
    return createField(null, "none", input.evidenceSource, false, "generic_value");
  }

  if (navigationLikePattern.test(normalizedValue)) {
    return createField(null, "none", input.evidenceSource, false, "navigation_like");
  }

  if ((value.match(/[|｜/]/g) ?? []).length >= 3) {
    return createField(null, "none", input.evidenceSource, false, "multi_segment_navigation");
  }

  if (normalizedValue.split(/\s+/).filter(Boolean).length > 8) {
    return createField(null, "none", input.evidenceSource, false, "too_many_words");
  }

  return createField(value, input.confidence, input.evidenceSource, true, null);
}

export function formatStructuredAddress(address: StructuredDataPostalAddress | null) {
  if (!address) {
    return null;
  }

  const pieces = [
    address.streetAddress,
    address.addressLocality,
    address.addressRegion,
    address.postalCode,
    address.addressCountry,
  ]
    .filter(Boolean)
    .map((piece) => normalizeWhitespace(piece!));

  if (pieces.length === 0) {
    return null;
  }

  return normalizeWhitespace(pieces.join(", "));
}

export function validateAddress(input: {
  value: string | null;
  confidence: RestaurantFieldConfidence;
  evidenceSource: RestaurantFieldEvidenceSource;
}) {
  const value = input.value ? normalizeWhitespace(input.value) : null;

  if (!value) {
    return createField(null, "none", null, false, "empty");
  }

  if (value.length < 6 || value.length > 120) {
    return createField(null, "none", input.evidenceSource, false, "invalid_length");
  }

  if (navigationLikePattern.test(value)) {
    return createField(null, "none", input.evidenceSource, false, "navigation_like");
  }

  if ((value.match(/[.!?。！？]/g) ?? []).length > 1) {
    return createField(null, "none", input.evidenceSource, false, "long_sentence_like");
  }

  if (!addressPattern.test(value) && !/\d{1,5}\s+[a-z]/i.test(value)) {
    return createField(null, "none", input.evidenceSource, false, "missing_address_signal");
  }

  return createField(value, input.confidence, input.evidenceSource, true, null);
}

export function validateCity(input: {
  value: string | null;
  confidence: RestaurantFieldConfidence;
  evidenceSource: RestaurantFieldEvidenceSource;
}) {
  const value = input.value ? normalizeWhitespace(input.value) : null;

  if (!value) {
    return createField(null, "none", null, false, "empty");
  }

  if (value.length < 2 || value.length > 40) {
    return createField(null, "none", input.evidenceSource, false, "invalid_length");
  }

  if (navigationLikePattern.test(value)) {
    return createField(null, "none", input.evidenceSource, false, "navigation_like");
  }

  return createField(value, input.confidence, input.evidenceSource, true, null);
}

export function validateCuisine(input: {
  value: string | null;
  confidence: RestaurantFieldConfidence;
  evidenceSource: RestaurantFieldEvidenceSource;
}) {
  const value = input.value ? normalizeWhitespace(input.value) : null;

  if (!value) {
    return createField(null, "none", null, false, "empty");
  }

  if (value.length < 2 || value.length > 40) {
    return createField(null, "none", input.evidenceSource, false, "invalid_length");
  }

  if (navigationLikePattern.test(value)) {
    return createField(null, "none", input.evidenceSource, false, "navigation_like");
  }

  if (input.confidence === "low") {
    return createField(null, "none", input.evidenceSource, false, "low_confidence");
  }

  return createField(value, input.confidence, input.evidenceSource, true, null);
}
