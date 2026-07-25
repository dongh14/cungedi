import type { SourcePostPlatform } from "./types";
import {
  isSafePublicUrl,
  maxSourceMetadataStringLength,
  resolveSafeMetadataUrl,
  validateSourcePageMetadata,
} from "./metadata-schema";
import type { SourcePageMetadata, SourceMetadataStatus } from "./metadata-types";

export const defaultSourceMetadataTimeoutMs = 6_000;
export const defaultSourceMetadataMaxBytes = 512 * 1024;
export const defaultSourceMetadataMaxRedirects = 4;

export type SourceMetadataFetcherOptions = {
  fetchImpl?: typeof fetch;
  timeoutMs?: number;
  maxBytes?: number;
  maxRedirects?: number;
};

const metadataUserAgent = "CunGeDi/1.1 public-metadata-reader";

class MetadataTimeoutError extends Error {
  constructor() {
    super("metadata request timed out");
    this.name = "MetadataTimeoutError";
  }
}

function isApprovedPlatformHost(value: string, platform: SourcePostPlatform) {
  const hostname = new URL(value).hostname.toLowerCase().replace(/\.$/u, "");
  if (platform === "xiaohongshu") {
    return hostname === "xhslink.com" || hostname === "xiaohongshu.com" || hostname.endsWith(".xiaohongshu.com");
  }
  if (platform === "douyin") {
    return hostname === "v.douyin.com" || hostname === "douyin.com" || hostname.endsWith(".douyin.com");
  }
  return true;
}

function emptyMetadata(requestedUrl: string, platform: SourcePostPlatform, status: SourceMetadataStatus, warnings: string[] = []): SourcePageMetadata {
  return {
    requestedUrl,
    finalUrl: null,
    platform,
    title: null,
    description: null,
    ogTitle: null,
    ogDescription: null,
    ogSiteName: null,
    ogImageUrl: null,
    canonicalUrl: null,
    status,
    warnings: warnings.slice(0, 4),
  };
}

function normalizeHtmlText(value: string) {
  return value
    .replace(/&nbsp;/giu, " ")
    .replace(/&amp;/giu, "&")
    .replace(/&quot;/giu, '"')
    .replace(/&#39;/giu, "'")
    .replace(/&lt;/giu, "<")
    .replace(/&gt;/giu, ">")
    .replace(/&#x([0-9a-f]+);/giu, (_, hex: string) => String.fromCodePoint(Number.parseInt(hex, 16)))
    .replace(/&#(\d+);/gu, (_, numeric: string) => String.fromCodePoint(Number.parseInt(numeric, 10)))
    .replace(/\s+/gu, " ")
    .trim()
    .slice(0, maxSourceMetadataStringLength) || null;
}

function getAttribute(tag: string, name: string) {
  const match = tag.match(new RegExp(`${name}\\s*=\\s*["']([^"']*)["']`, "iu"));
  return match?.[1] ?? null;
}

function getMetaValue(html: string, attribute: "name" | "property", expected: string) {
  for (const tag of html.match(/<meta\b[^>]*>/giu) ?? []) {
    if (getAttribute(tag, attribute)?.toLowerCase() !== expected) continue;
    const content = getAttribute(tag, "content");
    const normalized = content ? normalizeHtmlText(content) : null;
    if (normalized) return normalized;
  }
  return null;
}

function parseMetadata(html: string, finalUrl: string, requestedUrl: string, platform: SourcePostPlatform): SourcePageMetadata {
  const safeHtml = html.replace(/<script\b[\s\S]*?<\/script>/giu, "").replace(/<style\b[\s\S]*?<\/style>/giu, "");
  const titleMatch = safeHtml.match(/<title\b[^>]*>([\s\S]*?)<\/title>/iu);
  const title = titleMatch?.[1] ? normalizeHtmlText(titleMatch[1]) : null;
  const description = getMetaValue(safeHtml, "name", "description");
  const ogTitle = getMetaValue(safeHtml, "property", "og:title");
  const ogDescription = getMetaValue(safeHtml, "property", "og:description");
  const ogSiteName = getMetaValue(safeHtml, "property", "og:site_name");
  const imageValue = getMetaValue(safeHtml, "property", "og:image");
  const ogImageUrl = imageValue ? resolveSafeMetadataUrl(imageValue, finalUrl) : null;
  const canonicalTag = (safeHtml.match(/<link\b[^>]*>/giu) ?? []).find((tag) =>
    (getAttribute(tag, "rel") ?? "").toLowerCase().split(/\s+/u).includes("canonical"));
  const canonicalValue = canonicalTag ? getAttribute(canonicalTag, "href") : null;
  const canonicalUrl = canonicalValue ? resolveSafeMetadataUrl(canonicalValue, finalUrl) : null;
  const foundCount = [title, description, ogTitle, ogDescription, ogSiteName, ogImageUrl, canonicalUrl].filter(Boolean).length;
  const status: SourceMetadataStatus = foundCount === 0 ? "unavailable" : foundCount >= 3 ? "success" : "partial";

  return validateSourcePageMetadata({
    requestedUrl,
    finalUrl,
    platform,
    title,
    description,
    ogTitle,
    ogDescription,
    ogSiteName,
    ogImageUrl,
    canonicalUrl,
    status,
    warnings: status === "partial" ? ["仅获取到部分公开信息"] : [],
  }) ?? emptyMetadata(requestedUrl, platform, "failed", ["公开信息格式无法验证"]);
}

async function readBodyWithLimit(response: Response, maxBytes: number) {
  if (!response.body) {
    const text = await response.text();
    return new TextEncoder().encode(text).byteLength <= maxBytes ? text : null;
  }

  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > maxBytes) {
      await reader.cancel();
      return null;
    }
    chunks.push(value);
  }

  const bytes = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return new TextDecoder().decode(bytes);
}

function isHtmlContentType(value: string | null) {
  if (!value) return false;
  const normalized = value.toLowerCase();
  return normalized.includes("text/html") || normalized.includes("application/xhtml+xml");
}

function isChallengeOrLoginPage(html: string) {
  const sample = html.slice(0, 12000);
  return /captcha|verify you are human|checking your browser|cloudflare|access denied|登录后继续|请先登录|sign in to continue/iu.test(sample);
}

function statusForHttp(status: number): SourceMetadataStatus {
  return status === 401 || status === 403 || status === 429 ? "blocked" : status >= 400 ? "failed" : "invalid";
}

export async function fetchSourcePageMetadata(
  requestedUrl: string,
  platform: SourcePostPlatform,
  options: SourceMetadataFetcherOptions = {},
): Promise<SourcePageMetadata> {
  if (!isSafePublicUrl(requestedUrl)) return emptyMetadata(requestedUrl, platform, "invalid", ["链接不可读取"]);
  if (!isApprovedPlatformHost(requestedUrl, platform)) return emptyMetadata(requestedUrl, platform, "blocked", ["来源域名不在允许范围内"]);

  const fetchImpl = options.fetchImpl ?? fetch;
  const timeoutMs = Math.max(1, Math.min(defaultSourceMetadataTimeoutMs, options.timeoutMs ?? defaultSourceMetadataTimeoutMs));
  const maxBytes = Math.max(1, Math.min(defaultSourceMetadataMaxBytes, options.maxBytes ?? defaultSourceMetadataMaxBytes));
  const maxRedirects = Math.max(0, Math.min(defaultSourceMetadataMaxRedirects, options.maxRedirects ?? defaultSourceMetadataMaxRedirects));
  const deadline = Date.now() + timeoutMs;
  let currentUrl = new URL(requestedUrl).toString();
  let redirectCount = 0;

  while (true) {
    const remaining = deadline - Date.now();
    if (remaining <= 0) return emptyMetadata(requestedUrl, platform, "timeout", ["读取超时"]);
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), remaining);
    let timeoutRejectId: ReturnType<typeof setTimeout> | undefined;
    try {
      const response = await Promise.race([
        fetchImpl(currentUrl, {
          method: "GET",
          redirect: "manual",
          headers: { Accept: "text/html,application/xhtml+xml;q=0.9", "User-Agent": metadataUserAgent },
          signal: controller.signal,
          cache: "no-store",
        }),
        new Promise<never>((_, reject) => {
          timeoutRejectId = setTimeout(() => reject(new MetadataTimeoutError()), remaining);
        }),
      ]);

      if (response.status >= 300 && response.status < 400) {
        const location = response.headers.get("location");
        if (response.body) void response.body.cancel().catch(() => undefined);
        if (!location || redirectCount >= maxRedirects) return emptyMetadata(requestedUrl, platform, "failed", ["跳转次数超出限制"]);
        const nextUrl = new URL(location, currentUrl).toString();
        if (!isSafePublicUrl(nextUrl)) return emptyMetadata(requestedUrl, platform, "blocked", ["跳转目标不可读取"]);
        if (!isApprovedPlatformHost(nextUrl, platform)) return emptyMetadata(requestedUrl, platform, "blocked", ["跳转目标不在允许范围内"]);
        currentUrl = nextUrl;
        redirectCount += 1;
        continue;
      }

      if (!response.ok) {
        if (response.body) void response.body.cancel().catch(() => undefined);
        return emptyMetadata(requestedUrl, platform, statusForHttp(response.status), [response.status === 401 || response.status === 403 || response.status === 429 ? "网站拒绝了读取请求" : "网站响应异常"]);
      }

      if (!isHtmlContentType(response.headers.get("content-type"))) {
        if (response.body) void response.body.cancel().catch(() => undefined);
        return emptyMetadata(requestedUrl, platform, "invalid", ["返回内容不是 HTML"]);
      }

      const contentLength = Number(response.headers.get("content-length") ?? "0");
      if (contentLength > maxBytes) {
        if (response.body) void response.body.cancel().catch(() => undefined);
        return emptyMetadata(requestedUrl, platform, "invalid", ["页面超过大小限制"]);
      }

      const body = await readBodyWithLimit(response, maxBytes);
      if (body === null) return emptyMetadata(requestedUrl, platform, "invalid", ["页面超过大小限制"]);
      if (!body.trim()) return emptyMetadata(requestedUrl, platform, "unavailable", ["页面没有公开元数据"]);
      if (isChallengeOrLoginPage(body)) return emptyMetadata(requestedUrl, platform, "blocked", ["网站要求验证或登录"]);
      const finalUrl = isSafePublicUrl(response.url || currentUrl) ? new URL(response.url || currentUrl).toString() : currentUrl;
      return parseMetadata(body, finalUrl, requestedUrl, platform);
    } catch (error) {
      const timedOut = error instanceof Error && (error.name === "AbortError" || error.name === "MetadataTimeoutError");
      return emptyMetadata(requestedUrl, platform, timedOut ? "timeout" : "failed", [timedOut ? "读取超时" : "无法读取公开信息"]);
    } finally {
      clearTimeout(timer);
      if (timeoutRejectId) clearTimeout(timeoutRejectId);
    }
  }
}
