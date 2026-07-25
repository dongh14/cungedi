import type { CanonicalPlaceCategory } from "@/lib/restaurants/constants";
import type { SourcePostPlatform } from "./types";

export type SourcePostPlaceCandidate = {
  id: string;
  name: string | null;
  country: string | null;
  city: string | null;
  district: string | null;
  address: string | null;
  category: CanonicalPlaceCategory | null;
  subcategory: string | null;
  note: string | null;
  confidence: "high" | "medium" | "low";
  evidence: string[];
  warnings: string[];
};

export type SourcePostExtractionResult = {
  candidates: SourcePostPlaceCandidate[];
  summary: string | null;
  extractionStatus: "success" | "partial" | "insufficient_evidence" | "failed";
};

export type SourcePostExtractionInput = {
  sourcePostId: string;
  platform: SourcePostPlatform;
  originalText: string | null;
  originalUrl: string | null;
  resolvedUrl: string | null;
  accessibleMetadata?: {
    title?: string | null;
    description?: string | null;
    siteName?: string | null;
  };
};
