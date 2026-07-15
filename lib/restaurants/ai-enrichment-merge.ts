import type { AIEnrichmentResult, AIProposedFieldName } from "./ai-enrichment.ts";
import type { MergedPlaceDraft, PlaceDraftField } from "./place-draft-merge.ts";

export type AcceptedAIFields = AIProposedFieldName[];

const proposedFieldMap: Record<AIProposedFieldName, PlaceDraftField> = {
  normalizedName: "name",
  city: "city",
  category: "category",
  address: "address",
  notesSummary: "notes",
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
  if (result.status !== "suggestions_available" || !result.proposal) {
    return draft;
  }

  const accepted = new Set(acceptedFields);
  const nextFieldSources = { ...draft.fieldSources };
  const nextDraft: MergedPlaceDraft = {
    ...draft,
    fieldSources: nextFieldSources,
  };
  const nextValues = nextDraft as unknown as Record<PlaceDraftField, string | number | null>;

  for (const proposedField of result.proposal.proposedFields) {
    if (!accepted.has(proposedField.field)) {
      continue;
    }

    const draftField = proposedFieldMap[proposedField.field];

    if (draft.fieldSources[draftField] === "manual" || !hasValue(proposedField.value)) {
      continue;
    }

    nextValues[draftField] = proposedField.value;
    nextFieldSources[draftField] = "ai_suggestion";
  }

  return nextDraft;
}
