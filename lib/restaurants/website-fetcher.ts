export const defaultWebsiteFetchTimeoutMs = 8000;
export const defaultWebsiteFetchMaxBytes = 1024 * 1024;

export type WebsiteFetchErrorCode =
  | "invalid-url"
  | "unsupported-protocol"
  | "timeout"
  | "http-error"
  | "response-too-large"
  | "unsupported-content-type"
  | "network-error";

export type WebsiteFetchResult =
  | {
      ok: true;
      url: string;
      status: number;
      contentType: string;
      html: string;
    }
  | {
      ok: false;
      url: string;
      errorCode: WebsiteFetchErrorCode;
      message: string;
      status?: number;
    };

export type WebsiteFetchOptions = {
  fetchImpl?: typeof fetch;
  timeoutMs?: number;
  maxBytes?: number;
};

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
      return "请输入有效的 http 或 https 网站链接。";
    case "unsupported-protocol":
      return "当前只支持通过 http 或 https 获取网站内容。";
    case "timeout":
      return "网站响应超时，请先手动补全字段。";
    case "http-error":
      return "网站没有返回可用页面，请先手动补全字段。";
    case "response-too-large":
      return "网站页面过大，当前 V1 不会继续处理。";
    case "unsupported-content-type":
      return "该链接没有返回 HTML 页面，当前 V1 不会继续处理。";
    default:
      return "当前无法获取网站页面，请先手动补全字段。";
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
      message: getFailureMessage(validatedUrl.errorCode),
    };
  }

  const fetchImpl = options.fetchImpl ?? fetch;
  const timeoutMs = options.timeoutMs ?? defaultWebsiteFetchTimeoutMs;
  const maxBytes = options.maxBytes ?? defaultWebsiteFetchMaxBytes;
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
      headers: { Accept: "text/html,application/xhtml+xml;q=0.9" },
      signal: controller.signal,
      cache: "no-store",
    });

    if (!response.ok) {
      return {
        ok: false,
        url: response.url || validatedUrl.url,
        errorCode: "http-error",
        message: getFailureMessage("http-error"),
        status: response.status,
      };
    }

    const contentType = response.headers.get("content-type");

    if (!isHtmlContentType(contentType)) {
      return {
        ok: false,
        url: response.url || validatedUrl.url,
        errorCode: "unsupported-content-type",
        message: getFailureMessage("unsupported-content-type"),
      };
    }

    const contentLength = Number(response.headers.get("content-length") ?? "0");

    if (contentLength > maxBytes) {
      return {
        ok: false,
        url: response.url || validatedUrl.url,
        errorCode: "response-too-large",
        message: getFailureMessage("response-too-large"),
      };
    }

    const body = await readHtmlWithLimit(response, maxBytes);

    if (!body.ok) {
      return {
        ok: false,
        url: response.url || validatedUrl.url,
        errorCode: body.errorCode,
        message: getFailureMessage(body.errorCode),
      };
    }

    return {
      ok: true,
      url: response.url || validatedUrl.url,
      status: response.status,
      contentType: contentType ?? "text/html",
      html: body.html,
    };
  } catch (error) {
    const isAbortError = error instanceof Error && error.name === "AbortError";
    const errorCode = timedOut || isAbortError ? "timeout" : "network-error";

    return {
      ok: false,
      url: validatedUrl.url,
      errorCode,
      message: getFailureMessage(errorCode),
    };
  } finally {
    clearTimeout(timeoutId);
  }
}
