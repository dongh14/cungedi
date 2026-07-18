import { evaluateAIEnrichmentEligibility } from "./ai-eligibility.ts";
import type { AIEnrichmentRequest } from "./ai-enrichment.ts";
import type { PlaceDraftField } from "./place-draft-merge.ts";

export const maxDeepSeekPromptCharacters = 6000;

const compactFields: PlaceDraftField[] = [
  "name",
  "city",
  "category",
  "address",
  "phone",
  "description",
  "notes",
];

const priorityMissingFields: PlaceDraftField[] = [
  "category",
  "city",
  "address",
  "phone",
  "notes",
];

const evidencePolicy = [
  "Use only the provided evidence.",
  "Extract missing fields only when explicitly supported by the evidence.",
  "Leave fields empty when the evidence does not contain the information.",
  "Never invent addresses, phone numbers, ratings, or opening hours.",
];

function trimText(value: string | null | undefined, maxLength: number) {
  const normalized = value?.trim() ?? "";

  return normalized.length > maxLength ? `${normalized.slice(0, maxLength)}...` : normalized;
}

function getDraftSnapshot(request: AIEnrichmentRequest) {
  return Object.fromEntries(
    compactFields
      .map((field) => {
        const value = request.mergedPlaceDraft[field];
        return [field, typeof value === "string" ? trimText(value, 240) : value];
      })
      .filter(([, value]) => typeof value === "number" || Boolean(value)),
  );
}

function compactStringRecord(record: Record<string, unknown>, maxLength: number) {
  return Object.fromEntries(
    Object.entries(record)
      .map(([key, value]) => [key, typeof value === "string" ? trimText(value, maxLength) : value])
      .filter(([, value]) => typeof value === "string" && Boolean(value)),
  );
}

function getEvidenceSnapshot(result: AIEnrichmentRequest["extractedSourceData"][number]) {
  const metadata = compactStringRecord(
    (result.evidence?.metadata ?? {}) as Record<string, unknown>,
    180,
  );
  const structuredData = (result.evidence?.structuredData ?? [])
    .map((entry) => ({
      types: entry.types.slice(0, 4),
      name: trimText(entry.name, 180),
      description: trimText(entry.description, 240),
      category: trimText(entry.category, 180),
      address: trimText(entry.address, 240),
      phone: trimText(entry.phone, 80),
      websiteUrl: trimText(entry.websiteUrl, 240),
    }))
    .filter((entry) =>
      entry.types.length > 0 ||
      Boolean(entry.name || entry.description || entry.category || entry.address || entry.phone || entry.websiteUrl),
    );
  const relevantSnippets = [result.description, result.address, result.phone]
    .map((value) => trimText(value, 240))
    .filter(Boolean);
  const manualText = trimText(result.evidence?.manualText, 1800);

  return {
    metadata,
    structuredData,
    relevantSnippets,
    ...(manualText ? { manualText } : {}),
  };
}

function getSourceSnapshot(request: AIEnrichmentRequest) {
  return request.extractedSourceData.map((result) => ({
    sourceUrl: result.sourceUrl,
    sourceType: result.sourceType,
    extractedFields: result.extractedFields,
    fields: compactFields.reduce<Record<string, { value: string | number | null; origin: string | null }>>(
      (fields, field) => {
        const value = result[field];
        const compactValue = typeof value === "string" ? trimText(value, 240) : value ?? null;

        if (compactValue !== null && compactValue !== "") {
          fields[field] = {
            value: compactValue,
            origin: result.fieldOrigins?.[field] ?? null,
          };
        }

        return fields;
      },
      {},
    ),
    evidence: getEvidenceSnapshot(result),
  }));
}

export function buildCompactAIContext(request: AIEnrichmentRequest) {
  const eligibility = evaluateAIEnrichmentEligibility({
    draft: request.mergedPlaceDraft,
    extractedSourceData: request.extractedSourceData,
    missingFields: request.missingFields,
  });
  const compactContext = {
    evidencePolicy,
    currentDraft: getDraftSnapshot(request),
    missingFields: eligibility.missingFields,
    priorityMissingFields: priorityMissingFields.filter((field) => eligibility.missingFields.includes(field)),
    conflicts: eligibility.conflictFields,
    sourceUrls: request.sourceUrls.slice(0, 4),
    extractedSources: getSourceSnapshot(request),
  };
  const serialized = JSON.stringify(compactContext);

  if (serialized.length <= maxDeepSeekPromptCharacters) {
    return serialized;
  }

  const reducedContext = JSON.stringify({
    ...compactContext,
    sourceUrls: compactContext.sourceUrls.slice(0, 2),
    extractedSources: compactContext.extractedSources.map((source) => ({
      sourceUrl: source.sourceUrl,
      sourceType: source.sourceType,
      extractedFields: source.extractedFields,
      fields: Object.fromEntries(
        Object.entries(source.fields).filter(([field]) => field !== "description" && field !== "notes"),
      ),
      evidence: {
        metadata: source.evidence.metadata,
        structuredData: source.evidence.structuredData.map((entry) => ({
          types: entry.types,
          name: entry.name,
          category: entry.category,
          address: entry.address,
          phone: entry.phone,
        })),
        relevantSnippets: source.evidence.relevantSnippets.slice(0, 2),
        ...(source.evidence.manualText ? { manualText: trimText(source.evidence.manualText, 1800) } : {}),
      },
    })),
  });

  if (reducedContext.length <= maxDeepSeekPromptCharacters) {
    return reducedContext;
  }

  const minimalContext = JSON.stringify({
    currentDraft: Object.fromEntries(
      Object.entries(compactContext.currentDraft).map(([field, value]) => [
        field,
        typeof value === "string" ? trimText(value, 120) : value,
      ]),
    ),
    missingFields: compactContext.missingFields,
    conflicts: compactContext.conflicts,
    sourceUrls: compactContext.sourceUrls.slice(0, 1),
    extractedSources: compactContext.extractedSources.slice(0, 2).map((source) => ({
      sourceUrl: source.sourceUrl,
      sourceType: source.sourceType,
      extractedFields: source.extractedFields,
      fields: Object.fromEntries(
        Object.entries(source.fields).map(([field, value]) => [field, {
          value: typeof value.value === "string" ? trimText(value.value, 120) : value.value,
          origin: value.origin,
        }]),
      ),
      evidence: {
        metadata: source.evidence.metadata,
        structuredData: source.evidence.structuredData.slice(0, 1).map((entry) => ({
          types: entry.types,
          name: trimText(entry.name, 120),
          category: trimText(entry.category, 120),
          address: trimText(entry.address, 160),
          phone: trimText(entry.phone, 80),
        })),
        relevantSnippets: source.evidence.relevantSnippets.slice(0, 1),
        ...(source.evidence.manualText ? { manualText: trimText(source.evidence.manualText, 1200) } : {}),
      },
    })),
  });

  if (minimalContext.length <= maxDeepSeekPromptCharacters) {
    return minimalContext;
  }

  return JSON.stringify({
    missingFields: compactContext.missingFields,
    conflicts: compactContext.conflicts,
    sourceUrls: compactContext.sourceUrls.slice(0, 1),
    manualEvidence: compactContext.extractedSources
      .map((source) => source.evidence.manualText)
      .filter(Boolean)
      .join("\n")
      .slice(0, 1800),
  });
}
