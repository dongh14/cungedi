import type {
  RestaurantSourceKind,
  RestaurantSourceSupportLevel,
} from "./extraction-types";
import { extractFirstHttpUrl } from "./source-url";

export type SourceIntake = {
  sourceUrl: string;
  domain: string;
  kind: RestaurantSourceKind;
  supportLevel: RestaurantSourceSupportLevel;
  extractionState: "not-started";
};

const sourceMatchers: Array<{
  matches: (hostname: string) => boolean;
  kind: RestaurantSourceKind;
  supportLevel: RestaurantSourceSupportLevel;
}> = [
  {
    matches: (hostname) =>
      hostname === "maps.google.com" ||
      hostname === "google.com" ||
      hostname.endsWith(".google.com"),
    kind: "google-maps",
    supportLevel: "official",
  },
  {
    matches: (hostname) =>
      hostname === "xiaohongshu.com" ||
      hostname.endsWith(".xiaohongshu.com") ||
      hostname === "xhslink.com" ||
      hostname.endsWith(".xhslink.com"),
    kind: "xiaohongshu",
    supportLevel: "best-effort",
  },
  {
    matches: (hostname) =>
      hostname === "douyin.com" ||
      hostname.endsWith(".douyin.com") ||
      hostname === "iesdouyin.com" ||
      hostname.endsWith(".iesdouyin.com") ||
      hostname === "v.douyin.com",
    kind: "douyin",
    supportLevel: "best-effort",
  },
  {
    matches: (hostname) =>
      hostname === "tiktok.com" ||
      hostname.endsWith(".tiktok.com") ||
      hostname === "instagram.com" ||
      hostname.endsWith(".instagram.com"),
    kind: "unsupported-social",
    supportLevel: "unsupported",
  },
];

function getHostname(sourceUrl: string) {
  return new URL(sourceUrl).hostname.replace(/^www\./, "").toLowerCase();
}

export function detectSourceDetails(sourceUrl: string) {
  const hostname = getHostname(sourceUrl);
  const matchedSource = sourceMatchers.find(({ matches }) => matches(hostname));

  return {
    domain: hostname,
    kind: matchedSource?.kind ?? "public-web",
    supportLevel: matchedSource?.supportLevel ?? "official",
  };
}

export function buildSourceIntake(sourceUrl: string): SourceIntake {
  const details = detectSourceDetails(sourceUrl);

  return {
    sourceUrl,
    domain: details.domain,
    kind: details.kind,
    supportLevel: details.supportLevel,
    extractionState: "not-started",
  };
}

export function parseSourceIntakeInput(sourceInput: string) {
  const normalizedInput = sourceInput.trim();

  if (!normalizedInput) {
    return {
      ok: false as const,
      error: "请先粘贴有效的链接，或包含有效链接的分享文案",
    };
  }

  const sourceUrl = extractFirstHttpUrl(normalizedInput);

  if (!sourceUrl) {
    return {
      ok: false as const,
      error: "请先粘贴有效的链接，或包含有效链接的分享文案",
    };
  }

  return {
    ok: true as const,
    intake: buildSourceIntake(sourceUrl),
  };
}
