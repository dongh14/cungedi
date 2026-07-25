import { isIP } from "node:net";
import type { SourcePageMetadata, SourceMetadataStatus } from "./metadata-types";
import type { SourcePostPlatform } from "./types";

export const maxSourceMetadataStringLength = 1200;
export const maxSourceMetadataWarnings = 4;
const metadataStatuses = new Set<SourceMetadataStatus>([
  "success",
  "partial",
  "unavailable",
  "blocked",
  "timeout",
  "invalid",
  "failed",
]);
const platforms = new Set<SourcePostPlatform>(["xiaohongshu", "douyin", "web", "unknown"]);

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function normalizeString(value: unknown, maxLength = maxSourceMetadataStringLength) {
  if (typeof value !== "string") return null;
  const normalized = value.replace(/\s+/gu, " ").trim();
  return normalized ? normalized.slice(0, maxLength) : null;
}

function isPrivateIpv4(hostname: string) {
  const octets = hostname.split(".").map(Number);
  if (octets.length !== 4 || octets.some((octet) => !Number.isInteger(octet) || octet < 0 || octet > 255)) return false;
  const [first, second] = octets;
  return first === 0 || first === 10 || first === 127 ||
    (first === 100 && second >= 64 && second <= 127) ||
    (first === 169 && second === 254) ||
    (first === 172 && second >= 16 && second <= 31) ||
    (first === 192 && second === 0) ||
    (first === 192 && second === 168) ||
    (first === 198 && (second === 18 || second === 19)) ||
    (first === 198 && second === 51) ||
    (first === 203 && second === 0) || first >= 224;
}

function isPrivateIpv6(hostname: string) {
  const value = hostname.toLowerCase();
  return value === "::" || value === "::1" || value.startsWith("fc") || value.startsWith("fd") ||
    value.startsWith("fe8") || value.startsWith("fe9") || value.startsWith("fea") ||
    value.startsWith("feb") || value.startsWith("ff") || value.startsWith("2001:db8") ||
    value.startsWith("::ffff:");
}

export function isSafePublicUrl(value: unknown) {
  if (typeof value !== "string" || !value.trim()) return false;

  try {
    const url = new URL(value);
    if (url.protocol !== "http:" && url.protocol !== "https:") return false;
    if (url.username || url.password) return false;

    const hostname = url.hostname.toLowerCase().replace(/^\[|\]$/gu, "").replace(/\.$/u, "");
    if (!hostname || hostname === "localhost" || hostname.endsWith(".localhost") || hostname.endsWith(".local")) return false;

    const version = isIP(hostname);
    if (version === 4 && isPrivateIpv4(hostname)) return false;
    if (version === 6 && isPrivateIpv6(hostname)) return false;
    return true;
  } catch {
    return false;
  }
}

export function resolveSafeMetadataUrl(value: unknown, baseUrl: string) {
  if (typeof value !== "string" || !value.trim()) return null;

  try {
    const resolved = new URL(value, baseUrl);
    return isSafePublicUrl(resolved.toString()) ? resolved.toString() : null;
  } catch {
    return null;
  }
}

export function validateSourcePageMetadata(value: unknown): SourcePageMetadata | null {
  if (!isRecord(value) || !metadataStatuses.has(value.status as SourceMetadataStatus) || !platforms.has(value.platform as SourcePostPlatform)) {
    return null;
  }

  const requestedUrl = normalizeString(value.requestedUrl);
  if (!requestedUrl || !isSafePublicUrl(requestedUrl)) return null;

  const finalUrl = value.finalUrl === null ? null : normalizeString(value.finalUrl);
  const canonicalUrl = value.canonicalUrl === null ? null : normalizeString(value.canonicalUrl);
  const ogImageUrl = value.ogImageUrl === null ? null : normalizeString(value.ogImageUrl);

  if ((finalUrl && !isSafePublicUrl(finalUrl)) || (canonicalUrl && !isSafePublicUrl(canonicalUrl)) || (ogImageUrl && !isSafePublicUrl(ogImageUrl))) {
    return null;
  }

  const warnings = Array.isArray(value.warnings)
    ? value.warnings.map((warning) => normalizeString(warning, 240)).filter((warning): warning is string => Boolean(warning)).slice(0, maxSourceMetadataWarnings)
    : [];

  return {
    requestedUrl,
    finalUrl,
    platform: value.platform as SourcePostPlatform,
    title: normalizeString(value.title),
    description: normalizeString(value.description),
    ogTitle: normalizeString(value.ogTitle),
    ogDescription: normalizeString(value.ogDescription),
    ogSiteName: normalizeString(value.ogSiteName),
    ogImageUrl,
    canonicalUrl,
    status: value.status as SourceMetadataStatus,
    warnings,
  };
}
