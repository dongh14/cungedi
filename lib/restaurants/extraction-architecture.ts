export const sourceTypes = [
  "unknown",
  "website",
  "google_maps",
  "xiaohongshu",
  "douyin",
  "instagram",
  "tiktok",
] as const;

export type SourceType = (typeof sourceTypes)[number];

export type ExtractionConfidence = "none" | "low" | "medium" | "high";

export type ExtractionStatus = "not_implemented" | "unavailable" | "success";

export type NormalizedExtractionResult = {
  name: string | null;
  category: string | null;
  city: string | null;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  sourceUrl: string;
  notes: string | null;
  confidence: ExtractionConfidence;
  extractionStatus: ExtractionStatus;
  sourceType: SourceType;
  message: string;
};

export type SourceDetection = {
  sourceType: SourceType;
  sourceUrl: string;
  domain: string | null;
};

export type Extractor = {
  sourceType: Exclude<SourceType, "unknown">;
  canHandle: (sourceType: SourceType) => boolean;
  extract: (sourceUrl: string) => NormalizedExtractionResult;
};

function getHostname(sourceUrl: string) {
  try {
    return new URL(sourceUrl).hostname.replace(/^www\./, "").toLowerCase();
  } catch {
    return null;
  }
}

function isHttpUrl(sourceUrl: string) {
  try {
    const url = new URL(sourceUrl);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function isDomainOrSubdomain(hostname: string, domain: string) {
  return hostname === domain || hostname.endsWith(`.${domain}`);
}

export function detectSource(sourceUrl: string): SourceDetection {
  const domain = getHostname(sourceUrl);

  if (!domain || !isHttpUrl(sourceUrl)) {
    return {
      sourceType: "unknown",
      sourceUrl,
      domain,
    };
  }

  let sourceType: SourceType = "website";
  const parsedUrl = new URL(sourceUrl);
  const pathname = parsedUrl.pathname.toLowerCase();

  if (
    domain === "maps.google.com" ||
    (isDomainOrSubdomain(domain, "google.com") && pathname.startsWith("/maps"))
  ) {
    sourceType = "google_maps";
  } else if (
    isDomainOrSubdomain(domain, "xiaohongshu.com") ||
    domain === "xhslink.com"
  ) {
    sourceType = "xiaohongshu";
  } else if (
    isDomainOrSubdomain(domain, "douyin.com") ||
    isDomainOrSubdomain(domain, "iesdouyin.com")
  ) {
    sourceType = "douyin";
  } else if (isDomainOrSubdomain(domain, "instagram.com")) {
    sourceType = "instagram";
  } else if (isDomainOrSubdomain(domain, "tiktok.com")) {
    sourceType = "tiktok";
  }

  return {
    sourceType,
    sourceUrl,
    domain,
  };
}

function buildNotImplementedResult(
  sourceType: Exclude<SourceType, "unknown">,
  sourceUrl: string,
): NormalizedExtractionResult {
  return {
    name: null,
    category: null,
    city: null,
    address: null,
    latitude: null,
    longitude: null,
    sourceUrl,
    notes: null,
    confidence: "none",
    extractionStatus: "not_implemented",
    sourceType,
    message: "Extractor not implemented yet; review fields remain manual.",
  };
}

function createPlaceholderExtractor(
  sourceType: Exclude<SourceType, "unknown">,
): Extractor {
  return {
    sourceType,
    canHandle: (candidateSourceType) => candidateSourceType === sourceType,
    extract: (sourceUrl) => buildNotImplementedResult(sourceType, sourceUrl),
  };
}

export const googleMapsExtractor = createPlaceholderExtractor("google_maps");
export const websiteExtractor = createPlaceholderExtractor("website");
export const xiaohongshuExtractor = createPlaceholderExtractor("xiaohongshu");
export const douyinExtractor = createPlaceholderExtractor("douyin");

const extractors: Extractor[] = [
  googleMapsExtractor,
  websiteExtractor,
  xiaohongshuExtractor,
  douyinExtractor,
];

export function selectExtractor(sourceType: SourceType) {
  return extractors.find((extractor) => extractor.canHandle(sourceType)) ?? null;
}

export function runExtractionPipeline(sourceUrl: string) {
  const detection = detectSource(sourceUrl);
  const extractor = selectExtractor(detection.sourceType);

  if (!extractor) {
    return {
      detection,
      extractor: null,
      result: {
        ...buildNotImplementedResult("website", sourceUrl),
        sourceType: detection.sourceType,
        extractionStatus: "unavailable" as const,
        message: "No extractor is available for this source yet.",
      },
    };
  }

  return {
    detection,
    extractor,
    result: extractor.extract(sourceUrl),
  };
}
