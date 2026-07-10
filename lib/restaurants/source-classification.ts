import type {
  RestaurantSourceKind,
  RestaurantSourceSupportLevel,
} from "./extraction-types";

export function classifyRestaurantSource(url: string): RestaurantSourceKind {
  try {
    const parsedUrl = new URL(url);
    const hostname = parsedUrl.hostname.replace(/^www\./, "").toLowerCase();
    const pathname = parsedUrl.pathname.toLowerCase();

    if (hostname === "google.com" && pathname.startsWith("/maps")) {
      return "google-maps";
    }

    if (hostname.endsWith("google.com") && pathname.startsWith("/maps")) {
      return "google-maps";
    }

    if (
      hostname === "xhslink.com" ||
      hostname.endsWith("xiaohongshu.com") ||
      hostname.endsWith("rednote.com")
    ) {
      return "xiaohongshu";
    }

    if (hostname === "v.douyin.com" || hostname.endsWith("douyin.com")) {
      return "douyin";
    }

    if (
      hostname.endsWith("instagram.com") ||
      hostname.endsWith("tiktok.com") ||
      hostname.endsWith("facebook.com")
    ) {
      return "unsupported-social";
    }

    return "public-web";
  } catch {
    return "public-web";
  }
}

export function getSourceSupportLevel(
  sourceKind: RestaurantSourceKind,
): RestaurantSourceSupportLevel {
  if (sourceKind === "google-maps" || sourceKind === "public-web") {
    return "official";
  }

  if (sourceKind === "xiaohongshu" || sourceKind === "douyin") {
    return "best-effort";
  }

  return "unsupported";
}
