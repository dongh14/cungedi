import type { SavedSourcePost } from "./types";
import type { SourcePostPlaceCandidate } from "./extraction-types";

export type SourcePostOrganizationDraft = {
  sourceInput: string;
  sourceUrl: string | null;
  resolvedSourceUrl: string | null;
  name: string | null;
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

export function buildSourcePostOrganizationDraft(
  post: SavedSourcePost,
  candidate?: SourcePostPlaceCandidate | null,
): SourcePostOrganizationDraft {
  return {
    sourceInput: post.originalText?.trim() || post.originalUrl || post.resolvedUrl || "",
    sourceUrl: post.originalUrl ?? post.resolvedUrl,
    resolvedSourceUrl: post.resolvedUrl,
    name: candidate?.name ?? getNameCandidate(post.originalText),
    note: candidate?.note ?? post.originalText?.trim() ?? null,
  };
}
