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
  "description",
  "category",
  "cuisine",
  "city",
  "address",
  "phone",
  "latitude",
  "longitude",
  "websiteUrl",
  "imageUrl",
  "notes",
] as const;

export type ExtractedField = (typeof extractionFields)[number];

export type ExtractionFieldOrigin =
  | "structured"
  | "metadata"
  | "url"
  | "manual_evidence";

export type NormalizedExtractionResult = {
  name: string | null;
  description: string | null;
  category: string | null;
  cuisine?: string | null;
  city: string | null;
  address: string | null;
  phone: string | null;
  latitude: number | null;
  longitude: number | null;
  websiteUrl: string | null;
  imageUrl: string | null;
  sourceUrl: string;
  notes: string | null;
  confidence: ExtractionConfidence;
  extractionStatus: ExtractionStatus;
  extractedFields: ExtractedField[];
  fieldOrigins?: Partial<Record<ExtractedField, ExtractionFieldOrigin>>;
  evidence?: ExtractionEvidence;
  sourceType: SourceType;
  message: string;
};

export type ExtractionEvidence = {
  metadata?: Partial<WebsiteMetadataFields>;
  structuredData?: WebsiteStructuredData[];
  manualText?: string;
};

export type SourceDetection = {
  sourceType: SourceType;
  sourceUrl: string;
  domain: string | null;
};

export type Extractor = {
  sourceType: Exclude<SourceType, "unknown">;
  canHandle: (sourceType: SourceType) => boolean;
  extract: (sourceUrl: string, input?: WebsiteExtractionInput) => NormalizedExtractionResult;
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
    description: null,
    category: null,
    city: null,
    address: null,
    phone: null,
    latitude: null,
    longitude: null,
    websiteUrl: null,
    imageUrl: null,
    sourceUrl,
    notes: null,
    confidence: input.confidence,
    extractionStatus: input.extractionStatus,
    extractedFields: [],
    fieldOrigins: {},
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
    fieldOrigins: Object.fromEntries(
      extractedFields.map((field) => [field, "url"]),
    ) as NormalizedExtractionResult["fieldOrigins"],
  };
}

const genericWebsiteTitlePatterns = [
  /^welcome(?:\s+to)?(?:\s+.+)?$/i,
  /^home(?:page)?$/i,
  /^official\s+(?:website|site)$/i,
  /^(?:website|site)$/i,
];

function isGenericWebsiteTitle(value: string) {
  return genericWebsiteTitlePatterns.some((pattern) => pattern.test(value.trim()));
}

function formatUrlName(value: string) {
  const normalizedValue = decodeURIComponent(value)
    .replace(/[._-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (
    !normalizedValue ||
    /^(?:home|homepage|index|page|place|restaurant|restaurants|menu|about|contact|english|en|zh|ja)$/i.test(
      normalizedValue,
    )
  ) {
    return null;
  }

  return normalizedValue.charAt(0).toUpperCase() + normalizedValue.slice(1);
}

function extractWebsiteUrlName(sourceUrl: string) {
  try {
    const parsedUrl = new URL(sourceUrl);
    const pathCandidates = parsedUrl.pathname
      .split("/")
      .map((segment) => {
        try {
          return formatUrlName(decodeURIComponent(segment));
        } catch {
          return null;
        }
      })
      .filter((candidate): candidate is string => Boolean(candidate))
      .reverse();

    const pathName = pathCandidates.find((candidate) => !isGenericWebsiteTitle(candidate));

    if (pathName) {
      return pathName;
    }

    const hostnamePart = parsedUrl.hostname
      .replace(/^www\./i, "")
      .split(".")
      .find(
        (part) =>
          part.length > 1 &&
          !/^(?:com|org|net|co|jp|cn|uk|site|website|example|localhost)$/i.test(part),
      );

    return hostnamePart ? formatUrlName(hostnamePart) : null;
  } catch {
    return null;
  }
}

function chooseWebsiteName(
  sourceUrl: string,
  structuredName: string | null,
  ogTitle: string | null,
  title: string | null,
) {
  if (structuredName) {
    return { name: structuredName, source: "structured" as const };
  }

  if (ogTitle && !isGenericWebsiteTitle(ogTitle)) {
    return { name: ogTitle, source: "open-graph" as const };
  }

  if (title && !isGenericWebsiteTitle(title)) {
    return { name: title, source: "title" as const };
  }

  const urlName = extractWebsiteUrlName(sourceUrl);

  if (urlName) {
    return { name: urlName, source: "url" as const };
  }

  const weakName = ogTitle ?? title;

  return weakName ? { name: weakName, source: "generic" as const } : { name: null, source: null };
}

function extractWebsiteUrl(
  sourceUrl: string,
  input?: WebsiteExtractionInput,
): NormalizedExtractionResult {
  if (!input) {
    return buildEmptyResult("website", sourceUrl, {
      confidence: "low",
      extractionStatus: "unavailable",
      message: "No website document or metadata was provided for extraction.",
    });
  }

  const parsedWebsite = parseWebsiteMetadata(input);
  const structured =
    parsedWebsite.structuredData.find((entry) => Boolean(entry.name)) ??
    parsedWebsite.structuredData[0];
  const selectedName = chooseWebsiteName(
    sourceUrl,
    structured?.name ?? null,
    parsedWebsite.metadata.ogTitle,
    parsedWebsite.metadata.title,
  );
  const name = selectedName.name;
  const description =
    structured?.description ??
    parsedWebsite.metadata.ogDescription ??
    parsedWebsite.metadata.description;
  const category = structured?.category ?? null;
  const address = structured?.address ?? null;
  const phone = structured?.phone ?? null;
  const websiteUrl = structured?.websiteUrl ?? null;
  const imageUrl = structured?.imageUrl ?? parsedWebsite.metadata.ogImage ?? null;
  const extractedFields = [
    ...(name ? (["name"] as const) : []),
    ...(description ? (["description"] as const) : []),
    ...(category ? (["category"] as const) : []),
    ...(address ? (["address"] as const) : []),
    ...(phone ? (["phone"] as const) : []),
    ...(websiteUrl ? (["websiteUrl"] as const) : []),
    ...(imageUrl ? (["imageUrl"] as const) : []),
  ];

  if (extractedFields.length === 0) {
    return buildEmptyResult("website", sourceUrl, {
      confidence: "low",
      extractionStatus: "unavailable",
      message: "Website returned no extractable metadata.",
    });
  }

  const hasStructuredName = Boolean(structured?.name);
  const hasStructuredDetails = Boolean(category || address || phone || websiteUrl);
  const confidence = hasStructuredName
    ? hasStructuredDetails
      ? "high"
      : "medium"
    : selectedName.source === "open-graph" || selectedName.source === "title"
      ? "medium"
      : "low";

  return {
    ...buildEmptyResult("website", sourceUrl, {
      confidence,
      extractionStatus: "partial",
      message: "Extraction completed successfully.",
    }),
    name,
    description,
    category,
    address,
    phone,
    websiteUrl,
    imageUrl,
    extractedFields,
    evidence: {
      metadata: parsedWebsite.metadata,
      structuredData: parsedWebsite.structuredData,
    },
    fieldOrigins: Object.fromEntries(
      extractedFields.map((field) => [
        field,
        field === "name"
          ? selectedName.source === "structured"
            ? "structured"
            : selectedName.source === "url"
              ? "url"
              : "metadata"
          : ["category", "address", "phone", "websiteUrl"].includes(field)
            ? "structured"
            : field === "imageUrl" && structured?.imageUrl
              ? "structured"
            : "metadata",
      ]),
    ) as NormalizedExtractionResult["fieldOrigins"],
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

export const websiteExtractor: Extractor = {
  sourceType: "website",
  canHandle: (candidateSourceType) => candidateSourceType === "website",
  extract: extractWebsiteUrl,
};
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
import {
  parseWebsiteMetadata,
  type WebsiteExtractionInput,
  type WebsiteMetadataFields,
  type WebsiteStructuredData,
} from "./website-metadata.ts";
import {
  fetchWebsiteHtml,
  type WebsiteFetchOptions,
  type WebsiteFetchResult,
} from "./website-fetcher.ts";
import {
  resolveGoogleMapsUrl,
  type GoogleMapsUrlResolution,
  type GoogleMapsUrlResolverOptions,
} from "./google-maps-url-resolver.ts";

export async function runExtractionPipelineWithWebsiteFetch(
  sourceUrl: string,
  options?: WebsiteFetchOptions & GoogleMapsUrlResolverOptions,
) {
  const pipeline = runExtractionPipeline(sourceUrl);

  if (pipeline.detection.sourceType === "google_maps" && pipeline.extractor) {
    const googleMapsResolution = await resolveGoogleMapsUrl(sourceUrl, options);

    if (googleMapsResolution.status !== "resolved" || !googleMapsResolution.resolvedUrl) {
      return {
        ...pipeline,
        fetchResult: null as WebsiteFetchResult | null,
        googleMapsResolution,
        result: {
          ...pipeline.result,
          sourceUrl,
          extractionStatus: "unavailable" as const,
          confidence: "low" as const,
          extractedFields: [],
          fieldOrigins: {},
          message: "Unable to resolve Google Maps link. Please review manually.",
        },
      };
    }

    return {
      ...pipeline,
      fetchResult: null as WebsiteFetchResult | null,
      googleMapsResolution,
      result: {
        ...pipeline.extractor.extract(googleMapsResolution.resolvedUrl),
        sourceUrl,
      },
    };
  }

  if (pipeline.detection.sourceType !== "website" || !pipeline.extractor) {
    return {
      ...pipeline,
      fetchResult: null as WebsiteFetchResult | null,
      googleMapsResolution: null as GoogleMapsUrlResolution | null,
    };
  }

  const fetchResult = await fetchWebsiteHtml(sourceUrl, options);

  if (!fetchResult.ok) {
    return {
      ...pipeline,
      fetchResult,
      googleMapsResolution: null as GoogleMapsUrlResolution | null,
      result: buildEmptyResult("website", sourceUrl, {
        confidence: "low",
        extractionStatus: "unavailable",
        message: fetchResult.message,
      }),
    };
  }

  return {
    ...pipeline,
    fetchResult,
    googleMapsResolution: null as GoogleMapsUrlResolution | null,
    result: pipeline.extractor.extract(sourceUrl, { html: fetchResult.html }),
  };
}
