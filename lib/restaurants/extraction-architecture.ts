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

export type ExtractionConfidence = "high" | "medium" | "low";

export type ExtractionStatus = "success" | "partial" | "unavailable";

export const extractionFields = [
  "name",
  "category",
  "city",
  "address",
  "latitude",
  "longitude",
  "notes",
] as const;

export type ExtractedField = (typeof extractionFields)[number];

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
  extractedFields: ExtractedField[];
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
    domain === "maps.app.goo.gl" ||
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

function buildEmptyResult(
  sourceType: Exclude<SourceType, "unknown">,
  sourceUrl: string,
  input: Pick<NormalizedExtractionResult, "extractionStatus" | "message" | "confidence">,
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
    confidence: input.confidence,
    extractionStatus: input.extractionStatus,
    extractedFields: [],
    sourceType,
    message: input.message,
  };
}

function buildNotImplementedResult(
  sourceType: Exclude<SourceType, "unknown">,
  sourceUrl: string,
): NormalizedExtractionResult {
  return buildEmptyResult(sourceType, sourceUrl, {
    confidence: "low",
    extractionStatus: "unavailable",
    message: "Extractor not implemented yet; review fields remain manual.",
  });
}

function decodeGoogleMapsPathValue(value: string) {
  try {
    return decodeURIComponent(value.replace(/\+/g, " ")).replace(/\s+/g, " ").trim();
  } catch {
    return value.replace(/\+/g, " ").replace(/\s+/g, " ").trim();
  }
}

function isCoordinateOnlyValue(value: string) {
  return /^[-+]?\d+(?:\.\d+)?\s*,\s*[-+]?\d+(?:\.\d+)?$/.test(value);
}

function parseCoordinate(value: string, minimum: number, maximum: number) {
  const parsedValue = Number(value);

  return Number.isFinite(parsedValue) && parsedValue >= minimum && parsedValue <= maximum
    ? parsedValue
    : null;
}

function extractGoogleMapsCoordinates(sourceUrl: string) {
  const coordinateMatch = sourceUrl.match(
    /@([-+]?\d+(?:\.\d+)?),([-+]?\d+(?:\.\d+)?)(?:[,/]|$)/,
  );

  if (!coordinateMatch) {
    return {
      latitude: null,
      longitude: null,
    };
  }

  const latitude = parseCoordinate(coordinateMatch[1], -90, 90);
  const longitude = parseCoordinate(coordinateMatch[2], -180, 180);

  return {
    latitude,
    longitude,
  };
}

function extractGoogleMapsPlaceName(sourceUrl: string) {
  let parsedUrl: URL;

  try {
    parsedUrl = new URL(sourceUrl);
  } catch {
    return null;
  }

  const queryValue = parsedUrl.searchParams.get("q") ?? parsedUrl.searchParams.get("query");
  const queryName = queryValue?.trim() ?? "";

  if (queryName && !isCoordinateOnlyValue(queryName)) {
    return queryName;
  }

  const pathname = parsedUrl.pathname;
  const pathPrefixes = ["/maps/search/", "/maps/place/"];

  for (const pathPrefix of pathPrefixes) {
    const pathIndex = pathname.toLowerCase().indexOf(pathPrefix);

    if (pathIndex === -1) {
      continue;
    }

    const pathValue = pathname
      .slice(pathIndex + pathPrefix.length)
      .split("/")[0]
      .replace(/\/+$/, "");
    const pathName = decodeGoogleMapsPathValue(pathValue);

    if (pathName && !isCoordinateOnlyValue(pathName)) {
      return pathName;
    }
  }

  return null;
}

function extractGoogleMapsUrl(sourceUrl: string): NormalizedExtractionResult {
  const name = extractGoogleMapsPlaceName(sourceUrl);
  let parsedUrl: URL | null = null;

  try {
    parsedUrl = new URL(sourceUrl);
  } catch {
    parsedUrl = null;
  }

  const address = parsedUrl?.searchParams.get("address")?.trim() || null;
  const { latitude, longitude } = extractGoogleMapsCoordinates(sourceUrl);
  const hasCoordinates = latitude !== null && longitude !== null;
  const extractedFields = [
    ...(name ? (["name"] as const) : []),
    ...(address ? (["address"] as const) : []),
    ...(hasCoordinates ? (["latitude", "longitude"] as const) : []),
  ];

  if (extractedFields.length === 0) {
    return buildEmptyResult("google_maps", sourceUrl, {
      confidence: "low",
      extractionStatus: "unavailable",
      message: "No safely extractable information was found in this Google Maps URL.",
    });
  }

  return {
    ...buildEmptyResult("google_maps", sourceUrl, {
      confidence: hasCoordinates && name ? "high" : "medium",
      extractionStatus: "partial",
      message:
        "Only explicit information from the Google Maps URL was extracted; review the remaining fields.",
    }),
    name: name ?? null,
    address,
    latitude,
    longitude,
    extractedFields: [...extractedFields],
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

export const websiteExtractor = createPlaceholderExtractor("website");
export const xiaohongshuExtractor = createPlaceholderExtractor("xiaohongshu");
export const douyinExtractor = createPlaceholderExtractor("douyin");

export const googleMapsExtractor: Extractor = {
  sourceType: "google_maps",
  canHandle: (candidateSourceType) => candidateSourceType === "google_maps",
  extract: extractGoogleMapsUrl,
};

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
        ...buildEmptyResult("website", sourceUrl, {
          confidence: "low",
          extractionStatus: "unavailable",
          message: "No extractor is available for this source yet.",
        }),
        sourceType: detection.sourceType,
      },
    };
  }

  return {
    detection,
    extractor,
    result: extractor.extract(sourceUrl),
  };
}
