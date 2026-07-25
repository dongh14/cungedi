import type { CanonicalPlaceCategory } from "@/lib/restaurants/constants";
import type { SavedSourcePost } from "./types";
import type { SourcePostPlaceCandidate } from "./extraction-types";

export type SourcePostOrganizationDraft = {
  sourceInput: string;
  sourceUrl: string | null;
  resolvedSourceUrl: string | null;
  name: string | null;
  country: string | null;
  city: string | null;
  district: string | null;
  address: string | null;
  category: CanonicalPlaceCategory | null;
  cuisine: string | null;
  note: string | null;
};

function getNameCandidate(originalText: string | null) {
  const lines = (originalText ?? "")
    .split(/\r?\n/u)
    .map((line) => line.replace(/https?:\/\/\S+/giu, "").trim())
    .filter(Boolean);

  for (const line of lines) {
    const candidate = line
      .split(/(?:在|来自)(?:小红书|抖音)/u, 1)[0]
      .split(/(?:先复制|复制这段|即可阅读)/u, 1)[0]
      .replace(/[，。,、:：;；!！。]+$/u, "")
      .trim();

    if (candidate && candidate.length <= 80 && !/小红书|抖音|复制|阅读/u.test(candidate)) {
      return candidate;
    }
  }

  return null;
}

function getCandidateConfidenceRank(confidence: SourcePostPlaceCandidate["confidence"]) {
  switch (confidence) {
    case "high":
      return 3;
    case "medium":
      return 2;
    case "low":
      return 1;
  }
}

function getCandidateCompletenessScore(candidate: SourcePostPlaceCandidate) {
  return [
    candidate.name,
    candidate.city,
    candidate.country,
    candidate.district,
    candidate.address,
    candidate.category,
    candidate.subcategory,
  ].filter(Boolean).length;
}

export function selectStrongestSourcePostCandidate(
  candidates: SourcePostPlaceCandidate[],
) {
  const ranked = [...candidates].sort((left, right) =>
    getCandidateConfidenceRank(right.confidence) - getCandidateConfidenceRank(left.confidence) ||
    getCandidateCompletenessScore(right) - getCandidateCompletenessScore(left) ||
    right.evidence.length - left.evidence.length,
  );
  const strongest = ranked[0];

  if (!strongest) {
    return null;
  }

  const hasUsableLocation = Boolean(strongest.city || strongest.district || strongest.address);
  const hasUsableClassification = Boolean(strongest.category || strongest.subcategory);
  const confidenceRank = getCandidateConfidenceRank(strongest.confidence);

  if (!strongest.name || confidenceRank < 2 || (!hasUsableLocation && !hasUsableClassification)) {
    return null;
  }

  return strongest;
}

export function buildSourcePostOrganizationDraft(
  post: SavedSourcePost,
  candidate?: SourcePostPlaceCandidate | null,
): SourcePostOrganizationDraft {
  return {
    sourceInput: post.originalText?.trim() || post.originalUrl || post.resolvedUrl || "",
    sourceUrl: post.originalUrl ?? post.resolvedUrl,
    resolvedSourceUrl: post.resolvedUrl,
    name: candidate?.name ?? getNameCandidate(post.originalText),
    country: candidate?.country ?? null,
    city: candidate?.city ?? null,
    district: candidate?.district ?? null,
    address: candidate?.address ?? null,
    category: candidate?.category ?? null,
    cuisine: candidate?.subcategory ?? null,
    note: candidate?.note ?? post.originalText?.trim() ?? null,
  };
}
