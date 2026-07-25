import type { SourcePostPlatform } from "./types";

export type SourceMetadataStatus =
  | "success"
  | "partial"
  | "unavailable"
  | "blocked"
  | "timeout"
  | "invalid"
  | "failed";

export type SourcePageMetadata = {
  requestedUrl: string;
  finalUrl: string | null;
  platform: SourcePostPlatform;
  title: string | null;
  description: string | null;
  ogTitle: string | null;
  ogDescription: string | null;
  ogSiteName: string | null;
  ogImageUrl: string | null;
  canonicalUrl: string | null;
  status: SourceMetadataStatus;
  warnings: string[];
};
