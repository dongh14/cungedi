import type {
  AIEnrichmentConfidence,
  AIEnrichmentResult,
  AIEnrichmentSnapshotField,
  AIProposedFieldGroup,
  AIProposedFieldName,
} from "./ai-enrichment.ts";

export type AIReviewDraftState = {
  snapshot: AIEnrichmentSnapshotField[];
  confidence: AIEnrichmentConfidence;
  reasoningSummary: string;
  acceptedFields: AIProposedFieldName[];
  rejectedGroups: AIProposedFieldGroup[];
};

const factualFields = new Set<AIProposedFieldName>(["address", "phone", "city", "country", "district"]);
const understandingFields = new Set<AIProposedFieldName>([
  "category",
  "cuisine",
  "tags",
  "summary",
  "placeType",
]);
const persistableFields = new Set<AIProposedFieldName>([
  "address",
  "phone",
  "city",
  "country",
  "district",
  "category",
  "cuisine",
  "summary",
]);

function normalizeValues(value: string | string[] | undefined) {
  return Array.isArray(value) ? value : value ? [value] : [];
}

export function getAIReviewDraftState(
  result: AIEnrichmentResult,
  acceptedFields: AIProposedFieldName[] = [],
  rejectedGroups: AIProposedFieldGroup[] = [],
): AIReviewDraftState | null {
  if (result.status !== "suggestions_available" || !result.proposal) {
    return null;
  }

  return {
    snapshot: result.proposal.proposedFields.map(({ field, group, value, confidence }) => ({
      field,
      group,
      value,
      confidence,
    })),
    confidence: result.proposal.confidence,
    reasoningSummary: result.proposal.reasoningSummary,
    acceptedFields: Array.from(new Set(acceptedFields)).filter((field) =>
      persistableFields.has(field),
    ),
    rejectedGroups: [...rejectedGroups],
  };
}

export function parseAIReviewDraftState(params: {
  ai_snapshot?: string | string[];
  ai_snapshot_confidence?: string;
  ai_snapshot_reason?: string;
  ai_accepted?: string | string[];
  ai_accept_factual?: string | string[];
  ai_accept_understanding?: string | string[];
  ai_reject?: string;
  ai_reject_factual?: string;
  ai_reject_understanding?: string;
}): AIReviewDraftState | null {
  const snapshot = normalizeValues(params.ai_snapshot).flatMap((entry) => {
    try {
      const parsed = JSON.parse(entry) as Partial<AIEnrichmentSnapshotField>;

      if (
        typeof parsed.field !== "string" ||
        typeof parsed.group !== "string" ||
        typeof parsed.value !== "string" ||
        !parsed.value.trim() ||
        (parsed.group !== "factual" && parsed.group !== "understanding")
      ) {
        return [];
      }

      const fields = parsed.group === "factual" ? factualFields : understandingFields;
      const confidence = parsed.confidence === "low" || parsed.confidence === "medium" || parsed.confidence === "high"
        ? parsed.confidence
        : undefined;

      return fields.has(parsed.field as AIProposedFieldName)
        ? [{
            field: parsed.field as AIProposedFieldName,
            group: parsed.group as AIProposedFieldGroup,
            value: parsed.value,
            ...(confidence ? { confidence } : {}),
          }]
        : [];
    } catch {
      return [];
    }
  });

  if (snapshot.length === 0) {
    return null;
  }

  const acceptedFields = [
    ...normalizeValues(params.ai_accepted),
    ...normalizeValues(params.ai_accept_factual),
    ...normalizeValues(params.ai_accept_understanding),
  ].filter(
    (field): field is AIProposedFieldName => persistableFields.has(field as AIProposedFieldName),
  );
  const rejectedGroups: AIProposedFieldGroup[] = [];

  if (params.ai_reject === "1" || params.ai_reject_factual === "1") {
    rejectedGroups.push("factual");
  }

  if (params.ai_reject === "1" || params.ai_reject_understanding === "1") {
    rejectedGroups.push("understanding");
  }

  return {
    snapshot,
    confidence:
      params.ai_snapshot_confidence === "high" || params.ai_snapshot_confidence === "low"
        ? params.ai_snapshot_confidence
        : "medium",
    reasoningSummary: params.ai_snapshot_reason?.trim() || "Previously generated suggestions are ready for review.",
    acceptedFields,
    rejectedGroups,
  };
}

export function appendAIReviewDraftState(
  searchParams: URLSearchParams,
  state: AIReviewDraftState,
) {
  const next = new URLSearchParams(searchParams);

  next.delete("ai_snapshot");
  next.delete("ai_snapshot_confidence");
  next.delete("ai_snapshot_reason");
  next.delete("ai_accepted");
  next.delete("ai_accept");
  next.delete("ai_accept_factual");
  next.delete("ai_accept_understanding");
  next.delete("ai_reject");
  next.delete("ai_reject_factual");
  next.delete("ai_reject_understanding");

  for (const field of state.snapshot) {
    next.append("ai_snapshot", JSON.stringify(field));
  }

  next.set("ai_snapshot_confidence", state.confidence);
  next.set("ai_snapshot_reason", state.reasoningSummary);

  for (const field of state.acceptedFields) {
    next.append("ai_accepted", field);
  }

  if (state.rejectedGroups.includes("factual")) {
    next.set("ai_reject_factual", "1");
  }

  if (state.rejectedGroups.includes("understanding")) {
    next.set("ai_reject_understanding", "1");
  }

  return next;
}

export function clearAIReviewDraftState(searchParams: URLSearchParams) {
  const next = new URLSearchParams(searchParams);

  [
    "ai_snapshot",
    "ai_snapshot_confidence",
    "ai_snapshot_reason",
    "ai_accepted",
    "ai_accept",
    "ai_accept_factual",
    "ai_accept_understanding",
    "ai_reject",
    "ai_reject_factual",
    "ai_reject_understanding",
  ].forEach((key) => next.delete(key));

  return next;
}
