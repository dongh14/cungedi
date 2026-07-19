import type { NormalizedExtractionResult } from "./extraction-architecture.ts";
import { evaluateAIEnrichmentEligibility } from "./ai-eligibility.ts";
import { normalizeAIPlaceUnderstanding } from "./constants.ts";
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
export type AIEnrichmentCacheStatus = "hit" | "miss" | "bypass";

export type AIFactualFieldName = "address" | "phone" | "city" | "country" | "district";
export type AIUnderstandingFieldName =
  | "category"
  | "cuisine"
  | "tags"
  | "summary"
  | "placeType";
export type AIProposedFieldName = AIFactualFieldName | AIUnderstandingFieldName;
export type AIProposedFieldGroup = "factual" | "understanding";

export type AIProposedField = {
  field: AIProposedFieldName;
  group: AIProposedFieldGroup;
  value: string;
  confidence: AIEnrichmentConfidence;
  reasoningSummary?: string;
};

export type AIEnrichmentProposal = {
  factualSuggestions: {
    address: string | null;
    phone: string | null;
    city: string | null;
    country: string | null;
    district: string | null;
  };
  understandingSuggestions: {
    category: string | null;
    cuisine: string | null;
    tags: string[];
    summary: string | null;
    placeType: string | null;
  };
  confidence: AIEnrichmentConfidence;
  reasoningSummary: string;
  proposedFields: AIProposedField[];
};

type AIFactualSuggestions = AIEnrichmentProposal["factualSuggestions"];
type AIUnderstandingSuggestions = AIEnrichmentProposal["understandingSuggestions"];

export type AIEnrichmentRequest = {
  mergedPlaceDraft: MergedPlaceDraft;
  extractedSourceData: NormalizedExtractionResult[];
  sourceUrls: string[];
  missingFields: PlaceDraftField[];
  userId?: string;
  forceRefresh?: boolean;
};

export type AIEnrichmentResult = {
  status: AIEnrichmentStatus;
  message: string;
  proposal: AIEnrichmentProposal | null;
  cacheStatus?: AIEnrichmentCacheStatus;
};

export type AIEnrichmentSnapshotField = {
  field: AIProposedFieldName;
  group: AIProposedFieldGroup;
  value: string;
  confidence?: AIEnrichmentConfidence;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function isConfidence(value: unknown): value is AIEnrichmentConfidence {
  return value === "low" || value === "medium" || value === "high";
}

const factualFieldNames = new Set<AIFactualFieldName>(["address", "phone", "city", "country", "district"]);
const understandingFieldNames = new Set<AIUnderstandingFieldName>([
  "category",
  "cuisine",
  "tags",
  "summary",
  "placeType",
]);

export function isValidCachedAIEnrichmentResult(value: unknown): value is AIEnrichmentResult {
  if (!isRecord(value) || typeof value.status !== "string" || typeof value.message !== "string") {
    return false;
  }

  if (value.status === "no_changes") {
    return value.proposal === null;
  }

  if (value.status !== "suggestions_available" || !isRecord(value.proposal)) {
    return false;
  }

  const factual = value.proposal.factualSuggestions;
  const understanding = value.proposal.understandingSuggestions;
  const proposedFields = value.proposal.proposedFields;

  if (
    !isRecord(factual) ||
    !isRecord(understanding) ||
    !isConfidence(value.proposal.confidence) ||
    typeof value.proposal.reasoningSummary !== "string" ||
    !Array.isArray(proposedFields)
  ) {
    return false;
  }

  if (
    !["address", "phone", "city", "country", "district"].every((field) =>
      typeof factual[field] === "string" || factual[field] === null,
    ) ||
    typeof understanding.category !== "string" && understanding.category !== null ||
    typeof understanding.cuisine !== "string" && understanding.cuisine !== null ||
    typeof understanding.summary !== "string" && understanding.summary !== null ||
    typeof understanding.placeType !== "string" && understanding.placeType !== null ||
    !Array.isArray(understanding.tags) ||
    !understanding.tags.every((tag) => typeof tag === "string")
  ) {
    return false;
  }

  return proposedFields.every((field) => {
    if (!isRecord(field) || typeof field.field !== "string" || typeof field.group !== "string") {
      return false;
    }

    const allowedFields = field.group === "factual" ? factualFieldNames : understandingFieldNames;

    return (
      (field.group === "factual" || field.group === "understanding") &&
      allowedFields.has(field.field as never) &&
      typeof field.value === "string" &&
      Boolean(field.value.trim()) &&
      isConfidence(field.confidence)
    );
  });
}

export function normalizeAIEnrichmentResult(
  result: AIEnrichmentResult,
): AIEnrichmentResult {
  if (result.status !== "suggestions_available" || !result.proposal) {
    return result;
  }

  const normalizedUnderstanding = normalizeAIPlaceUnderstanding(
    result.proposal.understandingSuggestions.category,
    result.proposal.understandingSuggestions.cuisine,
    result.proposal.understandingSuggestions.placeType,
  );
  const categoryField = result.proposal.proposedFields.find((field) => field.field === "category");
  const cuisineField = result.proposal.proposedFields.find((field) => field.field === "cuisine");
  const placeTypeField = result.proposal.proposedFields.find((field) => field.field === "placeType");
  const fallbackField = categoryField ?? cuisineField ?? placeTypeField;
  const understandingFields = result.proposal.proposedFields.filter(
    (field) => field.field !== "category" && field.field !== "cuisine",
  );

  if (normalizedUnderstanding.category) {
    understandingFields.push({
      field: "category",
      group: "understanding",
      value: normalizedUnderstanding.category,
      confidence: categoryField?.confidence ?? fallbackField?.confidence ?? result.proposal.confidence,
      ...(categoryField?.reasoningSummary || fallbackField?.reasoningSummary
        ? { reasoningSummary: categoryField?.reasoningSummary ?? fallbackField?.reasoningSummary }
        : {}),
    });
  }

  if (normalizedUnderstanding.cuisine) {
    understandingFields.push({
      field: "cuisine",
      group: "understanding",
      value: normalizedUnderstanding.cuisine,
      confidence: cuisineField?.confidence ?? fallbackField?.confidence ?? result.proposal.confidence,
      ...(cuisineField?.reasoningSummary || fallbackField?.reasoningSummary
        ? { reasoningSummary: cuisineField?.reasoningSummary ?? fallbackField?.reasoningSummary }
        : {}),
    });
  }

  const understandingFieldOrder: AIUnderstandingFieldName[] = [
    "category",
    "cuisine",
    "tags",
    "summary",
    "placeType",
  ];
  understandingFields.sort(
    (left, right) => understandingFieldOrder.indexOf(left.field as AIUnderstandingFieldName)
      - understandingFieldOrder.indexOf(right.field as AIUnderstandingFieldName),
  );

  return {
    ...result,
    proposal: {
      ...result.proposal,
      understandingSuggestions: {
        ...result.proposal.understandingSuggestions,
        category: normalizedUnderstanding.category,
        cuisine: normalizedUnderstanding.cuisine,
      },
      proposedFields: understandingFields,
    },
  };
}

export function buildAIEnrichmentResultFromSnapshot(
  snapshot: AIEnrichmentSnapshotField[],
  confidence: AIEnrichmentConfidence = "medium",
  reasoningSummary = "Previously generated suggestions are ready for review.",
): AIEnrichmentResult {
  const factualSuggestions: AIFactualSuggestions = {
    address: null,
    phone: null,
    city: null,
    country: null,
    district: null,
  };
  const understandingSuggestions: AIUnderstandingSuggestions = {
    category: null,
    cuisine: null,
    tags: [],
    summary: null,
    placeType: null,
  };
  const proposedFields: AIProposedField[] = [];

  for (const item of snapshot) {
    if (!item.value.trim()) {
      continue;
    }

    if (item.group === "factual" && item.field in factualSuggestions) {
      factualSuggestions[item.field as keyof AIFactualSuggestions] = item.value;
      proposedFields.push({ ...item, confidence: item.confidence ?? confidence });
      continue;
    }

    if (item.group === "understanding") {
      if (item.field === "tags") {
        understandingSuggestions.tags = item.value.split(",").map((tag) => tag.trim()).filter(Boolean);
      } else if (item.field in understandingSuggestions) {
        understandingSuggestions[item.field as Exclude<keyof AIUnderstandingSuggestions, "tags">] = item.value;
      } else {
        continue;
      }

      proposedFields.push({ ...item, confidence: item.confidence ?? confidence });
    }
  }

  return proposedFields.length > 0
    ? {
        status: "suggestions_available",
        message: "AI improvement available.",
        proposal: {
          factualSuggestions,
          understandingSuggestions,
          confidence,
          reasoningSummary,
          proposedFields,
        },
      }
    : {
        status: "no_changes",
        message: "No AI suggestions remain for review.",
        proposal: null,
      };
}

export type AIEnrichmentProvider = {
  id: string;
  enrich: (request: AIEnrichmentRequest) => Promise<AIEnrichmentResult>;
};

const factualSuggestionFields = ["address", "phone", "city", "country", "district"] as const;

function normalizeEvidenceValue(value: string, field: (typeof factualSuggestionFields)[number]) {
  const normalized = value.trim().toLocaleLowerCase();

  return field === "phone"
    ? normalized.replace(/\D/g, "")
    : normalized.replace(/[\s,，、.;:：\-_/]+/g, "");
}

function getFactualEvidenceValues(result: NormalizedExtractionResult) {
  return [
    result.name,
    result.description,
    result.category,
    result.city,
    result.country,
    result.district,
    result.address,
    result.phone,
    ...(result.evidence?.metadata ? Object.values(result.evidence.metadata) : []),
    ...(result.evidence?.structuredData ?? []).flatMap((entry) => [
      entry.name,
      entry.description,
      entry.category,
      entry.city,
      entry.country,
      entry.district,
      entry.address,
      entry.phone,
      entry.websiteUrl,
    ]),
    result.evidence?.manualText,
  ].filter((value): value is string => typeof value === "string" && Boolean(value.trim()));
}

function isFactualSuggestionSupported(
  field: (typeof factualSuggestionFields)[number],
  value: string | null,
  results: NormalizedExtractionResult[],
) {
  if (!value) {
    return false;
  }

  const normalizedValue = normalizeEvidenceValue(value, field);

  if (!normalizedValue) {
    return false;
  }

  return results
    .flatMap(getFactualEvidenceValues)
    .some((evidence) => normalizeEvidenceValue(evidence, field).includes(normalizedValue));
}

export function sanitizeFactualAIEnrichment(
  result: AIEnrichmentResult,
  extractedSourceData: NormalizedExtractionResult[],
): AIEnrichmentResult {
  if (result.status !== "suggestions_available" || !result.proposal) {
    return result;
  }

  const factualSuggestions = { ...result.proposal.factualSuggestions };
  const supportedFields = new Set<string>();

  for (const field of factualSuggestionFields) {
    if (isFactualSuggestionSupported(field, factualSuggestions[field], extractedSourceData)) {
      supportedFields.add(field);
    } else {
      factualSuggestions[field] = null;
    }
  }

  const proposedFields = result.proposal.proposedFields.filter(
    (field) => field.group !== "factual" || supportedFields.has(field.field),
  );

  if (proposedFields.length === 0) {
    return {
      status: "no_changes",
      message: "DeepSeek found no safe improvements supported by the supplied evidence.",
      proposal: null,
    };
  }

  return {
    ...result,
    proposal: {
      ...result.proposal,
      factualSuggestions,
      proposedFields,
    },
  };
}

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
    ["name", "city", "country", "category", "address", "phone", "notes"].includes(field),
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
  const eligibility = evaluateAIEnrichmentEligibility({
    draft: request.mergedPlaceDraft,
    extractedSourceData: request.extractedSourceData,
    missingFields: request.missingFields,
  });

  if (!eligibility.shouldRun) {
    return {
      status: "no_changes" as const,
      message: "No meaningful AI enrichment is needed for this draft.",
      proposal: null,
    };
  }

  try {
    return normalizeAIEnrichmentResult(await provider.enrich(request));
  } catch {
    return {
      status: "failed" as const,
      message: "AI enrichment failed without changing the current draft.",
      proposal: null,
    };
  }
}
