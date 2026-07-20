import type {
  RestaurantSourceKind,
  RestaurantSourceSupportLevel,
} from "./extraction-types.ts";
import {
  runExtractionPipeline,
  type ExtractionStatus,
  type NormalizedExtractionResult,
  type SourceType,
} from "./extraction-architecture.ts";
import { normalizeIntakeInput } from "../intake/normalize-input.ts";

export type SourceIntake = {
  sourceUrl: string;
  domain: string;
  sourceType: SourceType;
  kind: RestaurantSourceKind;
  supportLevel: RestaurantSourceSupportLevel;
  extractionState: "not-started";
  extractionStatus: ExtractionStatus;
  extractionMessage: string;
  extractionResult: NormalizedExtractionResult;
};

function getLegacySourceKind(sourceType: SourceType): RestaurantSourceKind {
  switch (sourceType) {
    case "google_maps":
      return "google-maps";
    case "xiaohongshu":
      return "xiaohongshu";
    case "douyin":
      return "douyin";
    case "instagram":
    case "tiktok":
      return "unsupported-social";
    case "unknown":
    case "website":
      return "public-web";
  }
}

function getLegacySupportLevel(sourceType: SourceType): RestaurantSourceSupportLevel {
  if (sourceType === "xiaohongshu" || sourceType === "douyin") {
    return "best-effort";
  }

  if (sourceType === "instagram" || sourceType === "tiktok" || sourceType === "unknown") {
    return "unsupported";
  }

  return "official";
}

export function detectSourceDetails(sourceUrl: string) {
  const pipeline = runExtractionPipeline(sourceUrl);

  return {
    domain: pipeline.detection.domain ?? "",
    sourceType: pipeline.detection.sourceType,
    kind: getLegacySourceKind(pipeline.detection.sourceType),
    supportLevel: getLegacySupportLevel(pipeline.detection.sourceType),
    extractionStatus: pipeline.result.extractionStatus,
    extractionMessage: pipeline.result.message,
    extractionResult: pipeline.result,
  };
}

export function buildSourceIntake(sourceUrl: string): SourceIntake {
  const details = detectSourceDetails(sourceUrl);

  return {
    sourceUrl,
    domain: details.domain,
    sourceType: details.sourceType,
    kind: details.kind,
    supportLevel: details.supportLevel,
    extractionState: "not-started",
    extractionStatus: details.extractionStatus,
    extractionMessage: details.extractionMessage,
    extractionResult: details.extractionResult,
  };
}

export function parseSourceIntakeInput(sourceInput: string) {
  const normalizedInput = normalizeIntakeInput(sourceInput);

  if (!normalizedInput.rawInput.trim()) {
    return {
      ok: false as const,
      error: "请先粘贴有效的链接，或包含有效链接的分享文案",
    };
  }

  const sourceUrl = normalizedInput.originalUrl;

  if (!sourceUrl) {
    return {
      ok: false as const,
      error: "请先粘贴有效的链接，或包含有效链接的分享文案",
    };
  }

  return {
    ok: true as const,
    intake: buildSourceIntake(sourceUrl),
    normalizedInput,
  };
}
