import { normalizeIntakeInput } from "@/lib/intake/normalize-input";
import type { ResolvedSourceUrl } from "@/lib/intake/types";
import type { CreateSavedSourcePostInput } from "./types";

export function buildSavedSourcePostCapture(
  rawInput: string,
  resolution?: Pick<ResolvedSourceUrl, "resolvedUrl" | "resolutionStatus">,
): CreateSavedSourcePostInput {
  const normalized = normalizeIntakeInput(rawInput);
  const resolvedUrl = resolution?.resolutionStatus === "resolved"
    ? resolution.resolvedUrl
    : null;

  return {
    platform: normalized.platform,
    originalUrl: normalized.originalUrl,
    resolvedUrl,
    originalText: normalized.rawInput || null,
    processingStatus: "needs_review",
    detectedCandidates: [],
    userNote: null,
  };
}

export function getSourcePostStatusAfterLinkChange(linkedPlaceCount: number) {
  return linkedPlaceCount > 0 ? "saved" as const : "needs_review" as const;
}
