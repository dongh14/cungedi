import type { RestaurantCategory } from "./constants";

export type RestaurantSourceKind =
  | "public-web"
  | "google-maps"
  | "xiaohongshu"
  | "douyin"
  | "unsupported-social";

export type RestaurantSourceSupportLevel = "official" | "best-effort" | "unsupported";

export type RestaurantPageType =
  | "single_restaurant"
  | "restaurant_list"
  | "generic_page"
  | "unknown";

export type RestaurantFieldEvidenceSource =
  | "structured_data"
  | "open_graph"
  | "meta_description"
  | "page_title"
  | "visible_text";

export type RestaurantFieldConfidence = "none" | "low" | "medium" | "high";

export type ExtractedRestaurantField = {
  value: string | null;
  confidence: RestaurantFieldConfidence;
  evidenceSource: RestaurantFieldEvidenceSource | null;
  accepted: boolean;
  rejectionReason?: string | null;
};

export type RestaurantExtractionCandidate = {
  sourceUrl: string;
  category: RestaurantCategory;
  fields: {
    name: ExtractedRestaurantField;
    city: ExtractedRestaurantField;
    address: ExtractedRestaurantField;
    cuisine: ExtractedRestaurantField;
  };
};

export type RestaurantExtractionDiagnostics = {
  finalFetchedUrl: string | null;
  sourceKind: RestaurantSourceKind;
  httpStatus: number | null;
  contentType: string | null;
  pageType: RestaurantPageType;
  structuredDataTypes: string[];
  hasRestaurantOrLocalBusiness: boolean;
  hasPostalAddress: boolean;
  hasRawGenericPlaceEvidence?: boolean;
  hasGenericPlaceEvidence?: boolean;
  finalCategory?: RestaurantCategory | null;
  fallbackReason?: string | null;
  acceptedFieldEvidence: Partial<
    Record<"name" | "city" | "address" | "cuisine", RestaurantFieldEvidenceSource>
  >;
  rejectedFieldCandidates: Array<{
    field: "name" | "city" | "address" | "cuisine";
    value: string | null;
    evidenceSource: RestaurantFieldEvidenceSource;
    reason: string;
  }>;
  finalDecision: string;
};

export type RestaurantExtractionResult =
  | {
      status: "success";
      sourceUrl: string;
      sourceKind: RestaurantSourceKind;
      supportLevel: RestaurantSourceSupportLevel;
      pageType: RestaurantPageType;
      candidate: RestaurantExtractionCandidate;
      fetchedUrl: string;
      httpStatus: number;
      contentType: string;
      notes: string[];
      acceptanceReasons: string[];
      diagnostics?: RestaurantExtractionDiagnostics;
    }
  | {
      status: "fallback";
      sourceUrl: string;
      sourceKind: RestaurantSourceKind;
      supportLevel: RestaurantSourceSupportLevel;
      pageType: RestaurantPageType;
      fetchedUrl: string | null;
      httpStatus: number | null;
      contentType: string | null;
      reason: string;
      notes: string[];
      diagnostics?: RestaurantExtractionDiagnostics;
    };

export type SourceDocumentMetadata = {
  title: string | null;
  description: string | null;
  ogTitle: string | null;
  ogDescription: string | null;
  ogSiteName: string | null;
};

export type SourceDocumentContent = {
  url: string;
  metadata: SourceDocumentMetadata;
  visibleText: string;
  visibleTextSegments: string[];
  structuredData: StructuredDataNode[];
};

export type StructuredDataPostalAddress = {
  streetAddress: string | null;
  addressLocality: string | null;
  addressRegion: string | null;
  postalCode: string | null;
  addressCountry: string | null;
};

export type StructuredDataNode = {
  types: string[];
  name: string | null;
  description: string | null;
  url: string | null;
  servesCuisine: string[];
  address: StructuredDataPostalAddress | null;
};

export type SourceFetchSuccess = {
  ok: true;
  url: string;
  status: number;
  contentType: string;
  body: string;
};

export type SourceFetchFailure = {
  ok: false;
  url: string | null;
  errorCode:
    | "timeout"
    | "http-error"
    | "network-error"
    | "response-too-large"
    | "unsupported-content-type"
    | "empty-body";
  message: string;
  status?: number;
};

export type SourceFetchResult = SourceFetchSuccess | SourceFetchFailure;
