import { isIP } from "node:net";
import { isDouyinUrl } from "./platforms/douyin.ts";
import { isHttpUrl } from "./platforms/web.ts";
import { isXiaohongshuUrl } from "./platforms/xiaohongshu.ts";
import type { IntakePlatform, ResolvedSourceUrl, SourceResolutionStatus } from "./types.ts";

export const defaultSourceResolutionTimeoutMs = 5_000;
export const defaultSourceResolutionMaxRedirects = 4;

export type SourceUrlResolverOptions = {
  fetchImpl?: typeof fetch;
  timeoutMs?: number;
  maxRedirects?: number;
};

type ShortPlatform = "xiaohongshu" | "douyin";

const shortPlatformHosts: Record<ShortPlatform, string> = {
  xiaohongshu: "xhslink.com",
  douyin: "v.douyin.com",
};

const resolutionUserAgent = "CunGeDi/1.1 source-link-resolver";

class RequestTimeoutError extends Error {
  constructor() {
    super("source URL resolution timed out");
    this.name = "RequestTimeoutError";
  }
}

function parseUrl(value: string) {
  try {
    const url = new URL(value);

    if (!isHttpUrl(value) || url.username || url.password) {
      return null;
    }

    return url;
  } catch {
    return null;
  }
}

function normalizedHostname(url: URL) {
  return url.hostname.toLowerCase().replace(/^\[|\]$/gu, "").replace(/\.$/u, "");
}

function isPrivateIpv4(hostname: string) {
  const octets = hostname.split(".").map(Number);

  if (octets.length !== 4 || octets.some((octet) => !Number.isInteger(octet) || octet < 0 || octet > 255)) {
    return false;
  }

  const [first, second] = octets;

  return (
    first === 0 ||
    first === 10 ||
    first === 127 ||
    (first === 100 && second >= 64 && second <= 127) ||
    (first === 169 && second === 254) ||
    (first === 172 && second >= 16 && second <= 31) ||
    (first === 192 && second === 0) ||
    (first === 192 && second === 168) ||
    (first === 198 && (second === 18 || second === 19)) ||
    (first === 198 && second === 51) ||
    (first === 203 && second === 0) ||
    first >= 224
  );
}

function isPrivateIpv6(hostname: string) {
  const value = hostname.toLowerCase();

  return (
    value === "::" ||
    value === "::1" ||
    value.startsWith("fc") ||
    value.startsWith("fd") ||
    value.startsWith("fe8") ||
    value.startsWith("fe9") ||
    value.startsWith("fea") ||
    value.startsWith("feb") ||
    value.startsWith("ff") ||
    value.startsWith("2001:db8") ||
    value.startsWith("::ffff:")
  );
}

function isPrivateOrReservedHostname(hostname: string) {
  const normalized = hostname.toLowerCase().replace(/\.$/u, "");

  if (normalized === "localhost" || normalized.endsWith(".localhost")) {
    return true;
  }

  const ipVersion = isIP(normalized);

  if (ipVersion === 4) {
    return isPrivateIpv4(normalized);
  }

  if (ipVersion === 6) {
    return isPrivateIpv6(normalized);
  }

  return false;
}

function isValidSubdomain(hostname: string, root: string) {
  return hostname.endsWith(`.${root}`) && hostname.length > root.length + 1;
}

function isApprovedXiaohongshuDestination(hostname: string) {
  return (
    hostname === "xhslink.com" ||
    hostname === "xiaohongshu.com" ||
    hostname === "www.xiaohongshu.com" ||
    isValidSubdomain(hostname, "xiaohongshu.com")
  );
}

function isApprovedDouyinDestination(hostname: string) {
  return (
    hostname === "v.douyin.com" ||
    hostname === "douyin.com" ||
    hostname === "www.douyin.com" ||
    isValidSubdomain(hostname, "douyin.com")
  );
}

function getPlatform(url: URL): IntakePlatform {
  const value = url.toString();

  if (isXiaohongshuUrl(value)) {
    return "xiaohongshu";
  }

  if (isDouyinUrl(value)) {
    return "douyin";
  }

  return "web";
}

function getShortPlatform(url: URL): ShortPlatform | null {
  const hostname = normalizedHostname(url);

  if (hostname === shortPlatformHosts.xiaohongshu) {
    return "xiaohongshu";
  }

  if (hostname === shortPlatformHosts.douyin) {
    return "douyin";
  }

  return null;
}

function isApprovedDestination(url: URL, platform: ShortPlatform) {
  const hostname = normalizedHostname(url);

  if (isPrivateOrReservedHostname(hostname)) {
    return false;
  }

  return platform === "xiaohongshu"
    ? isApprovedXiaohongshuDestination(hostname)
    : isApprovedDouyinDestination(hostname);
}

function looksLikePlatformHostname(hostname: string) {
  return /(?:xhslink\.com|xiaohongshu\.com|douyin\.com)/iu.test(hostname);
}

function getMaxRedirects(value: number | undefined) {
  if (!Number.isFinite(value)) {
    return defaultSourceResolutionMaxRedirects;
  }

  return Math.max(0, Math.min(defaultSourceResolutionMaxRedirects, Math.floor(value ?? 0)));
}

function getTimeoutMs(value: number | undefined) {
  if (!Number.isFinite(value)) {
    return defaultSourceResolutionTimeoutMs;
  }

  return Math.max(1, Math.min(defaultSourceResolutionTimeoutMs, Math.floor(value ?? 1)));
}

function cancelResponseBody(response: Response) {
  if (!response.body) {
    return;
  }

  void response.body.cancel().catch(() => undefined);
}

async function requestWithDeadline(
  fetchImpl: typeof fetch,
  url: string,
  method: "HEAD" | "GET",
  deadline: number,
) {
  const remainingMs = deadline - Date.now();

  if (remainingMs <= 0) {
    throw new RequestTimeoutError();
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), remainingMs);
  let timeoutRejectId: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timeoutRejectId = setTimeout(() => reject(new RequestTimeoutError()), remainingMs);
  });

  try {
    return await Promise.race([
      fetchImpl(url, {
        method,
        redirect: "manual",
        headers: {
          Accept: "text/html,application/xhtml+xml",
          "User-Agent": resolutionUserAgent,
        },
        signal: controller.signal,
        cache: "no-store",
      }),
      timeout,
    ]);
  } finally {
    clearTimeout(timeoutId);
    if (timeoutRejectId) {
      clearTimeout(timeoutRejectId);
    }
  }
}

function getRedirectUrl(response: Response, currentUrl: string, platform: ShortPlatform) {
  const location = response.headers.get("location");

  if (!location) {
    return null;
  }

  try {
    const nextUrl = new URL(location, currentUrl);

    return parseUrl(nextUrl.toString()) && isApprovedDestination(nextUrl, platform)
      ? nextUrl
      : null;
  } catch {
    return null;
  }
}

function isBlockedResponse(status: number) {
  return status === 401 || status === 403 || status === 407 || status === 429;
}

function toResult(
  originalUrl: string,
  resolvedUrl: string,
  platform: IntakePlatform,
  resolutionStatus: SourceResolutionStatus,
  redirectCount: number,
): ResolvedSourceUrl {
  return { originalUrl, resolvedUrl, platform, resolutionStatus, redirectCount };
}

export async function resolveSourceUrl(
  originalUrl: string,
  options: SourceUrlResolverOptions = {},
): Promise<ResolvedSourceUrl> {
  const parsedOriginalUrl = parseUrl(originalUrl);
  const fallbackPlatform = parsedOriginalUrl ? getPlatform(parsedOriginalUrl) : "unknown";

  if (!parsedOriginalUrl) {
    return toResult(originalUrl, originalUrl, fallbackPlatform, "invalid", 0);
  }

  const originalHostname = normalizedHostname(parsedOriginalUrl);

  if (isPrivateOrReservedHostname(originalHostname)) {
    return toResult(originalUrl, originalUrl, fallbackPlatform, "blocked", 0);
  }

  const shortPlatform = getShortPlatform(parsedOriginalUrl);

  if (!shortPlatform) {
    if (isXiaohongshuUrl(originalUrl) || isDouyinUrl(originalUrl)) {
      return toResult(originalUrl, originalUrl, fallbackPlatform, "not_required", 0);
    }

    if (looksLikePlatformHostname(originalHostname)) {
      return toResult(originalUrl, originalUrl, fallbackPlatform, "blocked", 0);
    }

    return toResult(originalUrl, originalUrl, fallbackPlatform, "not_required", 0);
  }

  const fetchImpl = options.fetchImpl ?? fetch;
  const timeoutMs = getTimeoutMs(options.timeoutMs);
  const maxRedirects = getMaxRedirects(options.maxRedirects);
  const deadline = Date.now() + timeoutMs;
  let currentUrl = parsedOriginalUrl.toString();
  let redirectCount = 0;

  while (true) {
    let headResponse: Response;

    try {
      headResponse = await requestWithDeadline(fetchImpl, currentUrl, "HEAD", deadline);
    } catch (error) {
      return toResult(
        originalUrl,
        originalUrl,
        shortPlatform,
        error instanceof RequestTimeoutError ? "timeout" : "failed",
        redirectCount,
      );
    }

    if (headResponse.status >= 300 && headResponse.status < 400) {
      const nextUrl = getRedirectUrl(headResponse, currentUrl, shortPlatform);
      cancelResponseBody(headResponse);

      if (!nextUrl) {
        return toResult(originalUrl, originalUrl, shortPlatform, "blocked", redirectCount);
      }

      if (redirectCount >= maxRedirects) {
        return toResult(originalUrl, originalUrl, shortPlatform, "redirect_limit", redirectCount);
      }

      currentUrl = nextUrl.toString();
      redirectCount += 1;
      continue;
    }

    const headFinalUrl = parseUrl(headResponse.url || currentUrl);
    const headResolved = headFinalUrl && isApprovedDestination(headFinalUrl, shortPlatform);
    const headMoved = Boolean(headResponse.url && headResponse.url !== currentUrl);
    const headCanResolve = headResponse.ok && headResolved && (redirectCount > 0 || headMoved);
    cancelResponseBody(headResponse);

    if (headCanResolve && headFinalUrl) {
      return toResult(originalUrl, headFinalUrl.toString(), shortPlatform, "resolved", redirectCount);
    }

    let getResponse: Response;

    try {
      getResponse = await requestWithDeadline(fetchImpl, currentUrl, "GET", deadline);
    } catch (error) {
      return toResult(
        originalUrl,
        originalUrl,
        shortPlatform,
        error instanceof RequestTimeoutError ? "timeout" : "failed",
        redirectCount,
      );
    }

    if (getResponse.status >= 300 && getResponse.status < 400) {
      const nextUrl = getRedirectUrl(getResponse, currentUrl, shortPlatform);
      cancelResponseBody(getResponse);

      if (!nextUrl) {
        return toResult(originalUrl, originalUrl, shortPlatform, "blocked", redirectCount);
      }

      if (redirectCount >= maxRedirects) {
        return toResult(originalUrl, originalUrl, shortPlatform, "redirect_limit", redirectCount);
      }

      currentUrl = nextUrl.toString();
      redirectCount += 1;
      continue;
    }

    const getFinalUrl = parseUrl(getResponse.url || currentUrl);
    const getResolved = getFinalUrl && isApprovedDestination(getFinalUrl, shortPlatform);
    cancelResponseBody(getResponse);

    if (getResponse.ok && getResolved && getFinalUrl) {
      return toResult(originalUrl, getFinalUrl.toString(), shortPlatform, "resolved", redirectCount);
    }

    return toResult(
      originalUrl,
      originalUrl,
      shortPlatform,
      isBlockedResponse(getResponse.status) ? "blocked" : "failed",
      redirectCount,
    );
  }
}
