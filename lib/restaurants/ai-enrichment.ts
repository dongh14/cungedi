import type { NormalizedExtractionResult } from "./extraction-architecture.ts";
import {
  placeDraftFields,
  type MergedPlaceDraft,
  type PlaceDraftField,
} from "./place-draft-merge.ts";

export const aiEnrichmentStatuses = [
  "unavailable",
  "no_changes",
  "suggestions_available",
  "failed",
] as const;

export type AIEnrichmentStatus = (typeof aiEnrichmentStatuses)[number];
export type AIEnrichmentConfidence = "high" | "medium" | "low";

export type AIProposedFieldName =
  | "normalizedName"
  | "city"
  | "category"
  | "address"
  | "notesSummary";

export type AIProposedField = {
  field: AIProposedFieldName;
  value: string;
  confidence: AIEnrichmentConfidence;
  reasoningSummary?: string;
};

export type AIEnrichmentProposal = {
  normalizedName: string | null;
  city: string | null;
  category: string | null;
  address: string | null;
  notesSummary: string | null;
  confidence: AIEnrichmentConfidence;
  reasoningSummary: string;
  proposedFields: AIProposedField[];
};

export type AIEnrichmentRequest = {
  mergedPlaceDraft: MergedPlaceDraft;
  extractedSourceData: NormalizedExtractionResult[];
  sourceUrls: string[];
  missingFields: PlaceDraftField[];
};

export type AIEnrichmentResult = {
  status: AIEnrichmentStatus;
  message: string;
  proposal: AIEnrichmentProposal | null;
};

export type AIEnrichmentProvider = {
  id: string;
  enrich: (request: AIEnrichmentRequest) => Promise<AIEnrichmentResult>;
};

export const placeholderAIEnrichmentProvider: AIEnrichmentProvider = {
  id: "placeholder",
  async enrich() {
    return {
      status: "unavailable",
      message: "AI enrichment is not configured; deterministic extraction remains primary.",
      proposal: null,
    };
  },
};

export function getMissingAIReviewFields(draft: MergedPlaceDraft): PlaceDraftField[] {
  const reviewFields = placeDraftFields.filter((field) =>
    ["name", "city", "category", "address", "notes"].includes(field),
  );

  return reviewFields.filter((field) => {
    const value = draft[field];

    return typeof value === "number" ? !Number.isFinite(value) : !value?.trim();
  });
}

export async function runAIEnrichment(
  request: AIEnrichmentRequest,
  provider: AIEnrichmentProvider = placeholderAIEnrichmentProvider,
) {
  try {
    return await provider.enrich(request);
  } catch {
    return {
      status: "failed" as const,
      message: "AI enrichment failed without changing the current draft.",
      proposal: null,
    };
  }
}
