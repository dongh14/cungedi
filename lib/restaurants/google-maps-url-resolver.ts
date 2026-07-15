export const defaultGoogleMapsResolutionTimeoutMs = 8000;
export const defaultGoogleMapsMaxRedirects = 4;

export type GoogleMapsResolutionStatus =
  | "resolved"
  | "invalid_url"
  | "redirect_failed"
  | "unsupported";

export type GoogleMapsUrlResolution = {
  inputUrl: string;
  resolvedUrl: string | null;
  status: GoogleMapsResolutionStatus;
};

export type GoogleMapsUrlResolverOptions = {
  fetchImpl?: typeof fetch;
  timeoutMs?: number;
  maxRedirects?: number;
};

const browserUserAgent =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";

function parseHttpUrl(value: string) {
  try {
    const url = new URL(value);

    if (url.protocol !== "http:" && url.protocol !== "https:") {
      return null;
    }

    return url;
  } catch {
    return null;
  }
}

function isGoogleMapsUrl(url: URL) {
  const hostname = url.hostname.toLowerCase();

  return (
    hostname === "maps.app.goo.gl" ||
    hostname === "maps.google.com" ||
    (hostname === "google.com" || hostname.endsWith(".google.com")) &&
      url.pathname.toLowerCase().startsWith("/maps")
  );
}

function shouldResolveRedirects(url: URL) {
  const hostname = url.hostname.toLowerCase();
  const pathname = url.pathname.toLowerCase().replace(/\/+$/, "") || "/";

  return (
    hostname === "maps.app.goo.gl" ||
    ((hostname === "google.com" || hostname.endsWith(".google.com")) &&
      pathname === "/maps")
  );
}

function getMaxRedirects(value: number | undefined) {
  if (!Number.isFinite(value)) {
    return defaultGoogleMapsMaxRedirects;
  }

  return Math.max(0, Math.min(8, Math.floor(value ?? defaultGoogleMapsMaxRedirects)));
}

function cancelResponseBody(response: Response) {
  if (!response.body) {
    return;
  }

  void response.body.cancel().catch(() => undefined);
}

export async function resolveGoogleMapsUrl(
  inputUrl: string,
  options: GoogleMapsUrlResolverOptions = {},
): Promise<GoogleMapsUrlResolution> {
  const parsedInputUrl = parseHttpUrl(inputUrl);

  if (!parsedInputUrl) {
    return {
      inputUrl,
      resolvedUrl: null,
      status: "invalid_url",
    };
  }

  if (!isGoogleMapsUrl(parsedInputUrl)) {
    return {
      inputUrl,
      resolvedUrl: null,
      status: "unsupported",
    };
  }

  if (!shouldResolveRedirects(parsedInputUrl)) {
    return {
      inputUrl,
      resolvedUrl: parsedInputUrl.toString(),
      status: "resolved",
    };
  }

  const fetchImpl = options.fetchImpl ?? fetch;
  const timeoutMs = options.timeoutMs ?? defaultGoogleMapsResolutionTimeoutMs;
  const maxRedirects = getMaxRedirects(options.maxRedirects);
  let currentUrl = parsedInputUrl.toString();

  for (let redirectCount = 0; redirectCount <= maxRedirects; redirectCount += 1) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetchImpl(currentUrl, {
        method: "GET",
        redirect: "manual",
        headers: {
          Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
          "User-Agent": browserUserAgent,
        },
        signal: controller.signal,
        cache: "no-store",
      });

      if (response.status >= 300 && response.status < 400) {
        const location = response.headers.get("location");
        cancelResponseBody(response);

        if (!location || redirectCount >= maxRedirects) {
          return {
            inputUrl,
            resolvedUrl: null,
            status: "redirect_failed",
          };
        }

        const nextUrl = parseHttpUrl(new URL(location, currentUrl).toString());

        if (!nextUrl || !isGoogleMapsUrl(nextUrl)) {
          return {
            inputUrl,
            resolvedUrl: null,
            status: "unsupported",
          };
        }

        currentUrl = nextUrl.toString();
        continue;
      }

      cancelResponseBody(response);

      if (!response.ok) {
        return {
          inputUrl,
          resolvedUrl: null,
          status: "redirect_failed",
        };
      }

      const finalUrl = parseHttpUrl(response.url || currentUrl);

      return finalUrl && isGoogleMapsUrl(finalUrl)
        ? {
            inputUrl,
            resolvedUrl: finalUrl.toString(),
            status: "resolved",
          }
        : {
            inputUrl,
            resolvedUrl: null,
            status: "unsupported",
          };
    } catch {
      return {
        inputUrl,
        resolvedUrl: null,
        status: "redirect_failed",
      };
    } finally {
      clearTimeout(timeoutId);
    }
  }

  return {
    inputUrl,
    resolvedUrl: null,
    status: "redirect_failed",
  };
}
