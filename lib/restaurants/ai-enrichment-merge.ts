import {
  normalizeAIEnrichmentResult,
  type AIEnrichmentResult,
  type AIProposedFieldName,
} from "./ai-enrichment.ts";
import type { MergedPlaceDraft, PlaceDraftField } from "./place-draft-merge.ts";

export type AcceptedAIFields = AIProposedFieldName[];

const proposedFieldMap: Partial<Record<AIProposedFieldName, PlaceDraftField>> = {
  city: "city",
  category: "category",
  address: "address",
  phone: "phone",
  cuisine: "cuisine",
  summary: "notes",
};

function hasValue(value: string | number | null) {
  return typeof value === "number"
    ? Number.isFinite(value)
    : typeof value === "string"
      ? Boolean(value.trim())
      : false;
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

    if (draft.fieldSources[draftField] === "manual" || !hasValue(proposedField.value)) {
      continue;
    }

    nextValues[draftField] = proposedField.value;
    nextFieldSources[draftField] = "ai_suggestion";
  }

  return nextDraft;
}
