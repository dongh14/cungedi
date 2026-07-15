export const defaultWebsiteFetchTimeoutMs = 8000;
export const defaultWebsiteFetchMaxBytes = 1024 * 1024;
export const defaultWebsiteFetchRetries = 1;

export type WebsiteFetchStatus =
  | "success"
  | "timeout"
  | "blocked"
  | "invalid_response";

export type WebsiteFetchErrorCode =
  | "invalid-url"
  | "unsupported-protocol"
  | "timeout"
  | "http-error"
  | "response-too-large"
  | "unsupported-content-type"
  | "invalid-response"
  | "network-error";

export type WebsiteFetchResult =
  | {
      ok: true;
      url: string;
      status: number;
      contentType: string;
      html: string;
      fetchStatus: "success";
  }
  | {
      ok: false;
      url: string;
      errorCode: WebsiteFetchErrorCode;
      fetchStatus: Exclude<WebsiteFetchStatus, "success">;
      message: string;
      status?: number;
    };

export type WebsiteFetchOptions = {
  fetchImpl?: typeof fetch;
  timeoutMs?: number;
  maxBytes?: number;
  maxRetries?: number;
};

const browserUserAgent =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";

function validateUrl(sourceUrl: string) {
  try {
    const parsedUrl = new URL(sourceUrl);

    if (parsedUrl.protocol !== "http:" && parsedUrl.protocol !== "https:") {
      return { errorCode: "unsupported-protocol" as const };
    }

    return { url: parsedUrl.toString() };
  } catch {
    return { errorCode: "invalid-url" as const };
  }
}

function isHtmlContentType(value: string | null) {
  if (!value) {
    return true;
  }

  const normalizedValue = value.toLowerCase();

  return normalizedValue.includes("text/html") || normalizedValue.includes("application/xhtml+xml");
}

function getFailureMessage(errorCode: WebsiteFetchErrorCode) {
  switch (errorCode) {
    case "invalid-url":
      return "Website unavailable. 请输入有效的 http 或 https 网站链接。";
    case "unsupported-protocol":
      return "Website unavailable. 当前只支持通过 http 或 https 获取网站内容。";
    case "timeout":
      return "Website unavailable. 网站响应超时，请先手动补全字段。";
    case "http-error":
      return "Website blocked the request. 请先手动补全字段。";
    case "response-too-large":
      return "Website returned an invalid response. 网站页面过大，当前 V1 不会继续处理。";
    case "unsupported-content-type":
      return "Website returned an invalid response. 该链接没有返回 HTML 页面，当前 V1 不会继续处理。";
    case "invalid-response":
      return "Website returned an invalid response. 当前 V1 不会继续处理。";
    default:
      return "Website unavailable. 当前无法获取网站页面，请先手动补全字段。";
  }
}

async function readHtmlWithLimit(response: Response, maxBytes: number) {
  if (!response.body) {
    const html = await response.text();

    if (new TextEncoder().encode(html).byteLength > maxBytes) {
      return { ok: false as const, errorCode: "response-too-large" as const };
    }

    return { ok: true as const, html };
  }

  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let totalBytes = 0;

  while (true) {
    const { done, value } = await reader.read();

    if (done) {
      break;
    }

    totalBytes += value.byteLength;

    if (totalBytes > maxBytes) {
      await reader.cancel();
      return { ok: false as const, errorCode: "response-too-large" as const };
    }

    chunks.push(value);
  }

  const bytes = new Uint8Array(totalBytes);
  let offset = 0;

  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }

  return { ok: true as const, html: new TextDecoder().decode(bytes) };
}

function isLikelyHtml(html: string) {
  return /<(?:!doctype\s+html|html\b|head\b|body\b|title\b|meta\b|script\b)/i.test(
    html,
  );
}

function getResponseFetchStatus(status: number): Exclude<WebsiteFetchStatus, "success"> {
  return status >= 400 && status < 500 ? "blocked" : "invalid_response";
}

function shouldRetryResponse(status: number) {
  return status === 408 || status === 425 || status === 429 || status >= 500;
}

function getRetryCount(value: number | undefined) {
  if (!Number.isFinite(value)) {
    return defaultWebsiteFetchRetries;
  }

  return Math.max(0, Math.min(2, Math.floor(value ?? defaultWebsiteFetchRetries)));
}

export async function fetchWebsiteHtml(
  sourceUrl: string,
  options: WebsiteFetchOptions = {},
): Promise<WebsiteFetchResult> {
  const validatedUrl = validateUrl(sourceUrl);

  if ("errorCode" in validatedUrl && validatedUrl.errorCode) {
    return {
      ok: false,
      url: sourceUrl,
      errorCode: validatedUrl.errorCode,
      fetchStatus: "invalid_response",
      message: getFailureMessage(validatedUrl.errorCode),
    };
  }

  const fetchImpl = options.fetchImpl ?? fetch;
  const timeoutMs = options.timeoutMs ?? defaultWebsiteFetchTimeoutMs;
  const maxBytes = options.maxBytes ?? defaultWebsiteFetchMaxBytes;
  const maxRetries = getRetryCount(options.maxRetries);

  for (let attempt = 0; attempt <= maxRetries; attempt += 1) {
    const controller = new AbortController();
    let timedOut = false;
    const timeoutId = setTimeout(() => {
      timedOut = true;
      controller.abort();
    }, timeoutMs);

    try {
      const response = await fetchImpl(validatedUrl.url, {
        method: "GET",
        redirect: "follow",
        headers: {
          Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
          "Accept-Language": "en-US,en;q=0.9,zh-CN;q=0.8,zh;q=0.7",
          "User-Agent": browserUserAgent,
        },
        signal: controller.signal,
        cache: "no-store",
      });

      if (!response.ok) {
        if (attempt < maxRetries && shouldRetryResponse(response.status)) {
          continue;
        }

        const fetchStatus = getResponseFetchStatus(response.status);

        return {
          ok: false,
          url: response.url || validatedUrl.url,
          errorCode: "http-error",
          fetchStatus,
          message:
            fetchStatus === "blocked"
              ? "Website blocked the request. 请先手动补全字段。"
              : getFailureMessage("invalid-response"),
          status: response.status,
        };
      }

      const contentType = response.headers.get("content-type");

      if (!isHtmlContentType(contentType)) {
        return {
          ok: false,
          url: response.url || validatedUrl.url,
          errorCode: "unsupported-content-type",
          fetchStatus: "invalid_response",
          message: getFailureMessage("unsupported-content-type"),
        };
      }

      const contentLength = Number(response.headers.get("content-length") ?? "0");

      if (contentLength > maxBytes) {
        return {
          ok: false,
          url: response.url || validatedUrl.url,
          errorCode: "response-too-large",
          fetchStatus: "invalid_response",
          message: getFailureMessage("response-too-large"),
        };
      }

      const body = await readHtmlWithLimit(response, maxBytes);

      if (!body.ok) {
        return {
          ok: false,
          url: response.url || validatedUrl.url,
          errorCode: body.errorCode,
          fetchStatus: "invalid_response",
          message: getFailureMessage(body.errorCode),
        };
      }

      if (!body.html.trim() || !isLikelyHtml(body.html)) {
        return {
          ok: false,
          url: response.url || validatedUrl.url,
          errorCode: "invalid-response",
          fetchStatus: "invalid_response",
          message: getFailureMessage("invalid-response"),
        };
      }

      return {
        ok: true,
        url: response.url || validatedUrl.url,
        status: response.status,
        contentType: contentType ?? "text/html",
        html: body.html,
        fetchStatus: "success",
      };
    } catch (error) {
      const isAbortError = error instanceof Error && error.name === "AbortError";
      const errorCode = timedOut || isAbortError ? "timeout" : "network-error";

      if (attempt < maxRetries) {
        continue;
      }

      return {
        ok: false,
        url: validatedUrl.url,
        errorCode,
        fetchStatus: errorCode === "timeout" ? "timeout" : "invalid_response",
        message: getFailureMessage(errorCode),
      };
    } finally {
      clearTimeout(timeoutId);
    }
  }

  return {
    ok: false,
    url: validatedUrl.url,
    errorCode: "network-error",
    fetchStatus: "invalid_response",
    message: getFailureMessage("network-error"),
  };
}
