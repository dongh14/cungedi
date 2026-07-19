import {
  normalizeAIEnrichmentResult,
  type AIEnrichmentResult,
  type AIProposedFieldGroup,
  type AIProposedFieldName,
} from "./ai-enrichment.ts";
import type { MergedPlaceDraft, PlaceDraftField } from "./place-draft-merge.ts";

export type AcceptedAIFields = AIProposedFieldName[];

const proposedFieldMap: Partial<Record<AIProposedFieldName, PlaceDraftField>> = {
  city: "city",
  country: "country",
  district: "district",
  category: "category",
  address: "address",
  phone: "phone",
  cuisine: "cuisine",
  summary: "notes",
};

const autoPersistableFields = new Set<AIProposedFieldName>([
  "address",
  "phone",
  "city",
  "country",
  "district",
  "category",
  "cuisine",
  "summary",
]);

function hasValue(value: string | number | null) {
  return typeof value === "number"
    ? Number.isFinite(value)
    : typeof value === "string"
      ? Boolean(value.trim())
      : false;
}

/**
 * Returns only validated, non-preview suggestions that can safely fill an empty field.
 * Manual and deterministic values stay authoritative; low-confidence suggestions stay review-only.
 */
export function getAutoAppliedAIFields(
  draft: MergedPlaceDraft,
  result: AIEnrichmentResult,
  rejectedGroups: AIProposedFieldGroup[] = [],
): AIProposedFieldName[] {
  const normalizedResult = normalizeAIEnrichmentResult(result);

  if (normalizedResult.status !== "suggestions_available" || !normalizedResult.proposal) {
    return [];
  }

  return normalizedResult.proposal.proposedFields
    .filter((field) => {
      const draftField = proposedFieldMap[field.field];

      return Boolean(
        draftField &&
        autoPersistableFields.has(field.field) &&
        !rejectedGroups.includes(field.group) &&
        field.confidence !== "low" &&
        !hasValue(draft[draftField] ?? null) &&
        draft.fieldSources[draftField] !== "manual",
      );
    })
    .map((field) => field.field)
    .filter((field, index, fields) => fields.indexOf(field) === index);
}

export function applyAutoAIEnrichment(
  draft: MergedPlaceDraft,
  result: AIEnrichmentResult,
  rejectedGroups: AIProposedFieldGroup[] = [],
): MergedPlaceDraft {
  return applyAcceptedAIEnrichment(
    draft,
    result,
    getAutoAppliedAIFields(draft, result, rejectedGroups),
  );
}

export function applyAcceptedAIEnrichment(
  draft: MergedPlaceDraft,
  result: AIEnrichmentResult,
  acceptedFields: AcceptedAIFields,
): MergedPlaceDraft {
  const normalizedResult = normalizeAIEnrichmentResult(result);

  if (normalizedResult.status !== "suggestions_available" || !normalizedResult.proposal) {
    return draft;
  }

  const accepted = new Set(acceptedFields);
  const nextFieldSources = { ...draft.fieldSources };
  const nextDraft: MergedPlaceDraft = {
    ...draft,
    fieldSources: nextFieldSources,
  };
  const nextValues = nextDraft as unknown as Record<PlaceDraftField, string | number | null>;

  for (const proposedField of normalizedResult.proposal.proposedFields) {
    if (!accepted.has(proposedField.field)) {
      continue;
    }

    const draftField = proposedFieldMap[proposedField.field];

    if (!draftField) {
      continue;
    }

    if (
      draft.fieldSources[draftField] === "manual" ||
      hasValue(draft[draftField] ?? null) ||
      !hasValue(proposedField.value)
    ) {
      continue;
    }

    nextValues[draftField] = proposedField.value;
    nextFieldSources[draftField] = "ai_suggestion";
  }

  return nextDraft;
}
