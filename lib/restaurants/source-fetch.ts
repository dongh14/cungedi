import type { SourceFetchResult } from "./extraction-types";

const defaultTimeoutMs = 6000;
const defaultMaxBytes = 512 * 1024;
const acceptedContentTypes = ["text/html", "text/plain", "application/xhtml+xml"];

type FetchSourceDocumentOptions = {
  fetchImpl?: typeof fetch;
  timeoutMs?: number;
  maxBytes?: number;
};

function isAcceptedContentType(value: string | null) {
  if (!value) {
    return true;
  }

  const normalizedValue = value.toLowerCase();

  return acceptedContentTypes.some((contentType) =>
    normalizedValue.includes(contentType),
  );
}

async function readResponseBodyWithLimit(
  response: Response,
  maxBytes: number,
): Promise<
  | { ok: true; body: string }
  | { ok: false; errorCode: "response-too-large" | "empty-body" }
> {
  if (!response.body) {
    const text = await response.text();

    if (!text) {
      return { ok: false, errorCode: "empty-body" };
    }

    if (Buffer.byteLength(text) > maxBytes) {
      return { ok: false, errorCode: "response-too-large" };
    }

    return { ok: true, body: text };
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let totalBytes = 0;
  let body = "";

  while (true) {
    const { done, value } = await reader.read();

    if (done) {
      break;
    }

    totalBytes += value.byteLength;

    if (totalBytes > maxBytes) {
      return { ok: false, errorCode: "response-too-large" };
    }

    body += decoder.decode(value, { stream: true });
  }

  body += decoder.decode();

  if (!body.trim()) {
    return { ok: false, errorCode: "empty-body" };
  }

  return { ok: true, body };
}

export async function fetchSourceDocument(
  sourceUrl: string,
  options: FetchSourceDocumentOptions = {},
): Promise<SourceFetchResult> {
  const fetchImpl = options.fetchImpl ?? fetch;
  const timeoutMs = options.timeoutMs ?? defaultTimeoutMs;
  const maxBytes = options.maxBytes ?? defaultMaxBytes;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetchImpl(sourceUrl, {
      method: "GET",
      redirect: "follow",
      headers: {
        Accept: "text/html,application/xhtml+xml,text/plain;q=0.9,*/*;q=0.1",
        "User-Agent":
          "Mozilla/5.0 (compatible; RestaurantInfoCollector/0.1; +https://localhost)",
      },
      signal: controller.signal,
      cache: "no-store",
    });

    if (!response.ok) {
      return {
        ok: false,
        url: response.url || sourceUrl,
        errorCode: "http-error",
        message: `来源页面返回了 ${response.status} 状态码。`,
        status: response.status,
      };
    }

    const contentType = response.headers.get("content-type");

    if (!isAcceptedContentType(contentType)) {
      return {
        ok: false,
        url: response.url || sourceUrl,
        errorCode: "unsupported-content-type",
        message: "该来源返回的内容类型不适合当前的 V1 提取流程。",
      };
    }

    const contentLength = Number(response.headers.get("content-length") ?? "0");

    if (contentLength > maxBytes) {
      return {
        ok: false,
        url: response.url || sourceUrl,
        errorCode: "response-too-large",
        message: "来源页面内容过大，当前的 V1 提取流程不会继续处理。",
      };
    }

    const bodyResult = await readResponseBodyWithLimit(response, maxBytes);

    if (bodyResult.ok === false) {
      return {
        ok: false,
        url: response.url || sourceUrl,
        errorCode: bodyResult.errorCode,
        message:
          bodyResult.errorCode === "response-too-large"
            ? "来源页面内容过大，当前的 V1 提取流程不会继续处理。"
            : "来源页面没有返回可提取的正文内容。",
      };
    }

    return {
      ok: true,
      url: response.url || sourceUrl,
      status: response.status,
      contentType: contentType ?? "text/html",
      body: bodyResult.body,
    };
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      return {
        ok: false,
        url: sourceUrl,
        errorCode: "timeout",
        message: "来源页面响应超时，当前请先改为手动补全。",
      };
    }

    return {
      ok: false,
      url: sourceUrl,
      errorCode: "network-error",
      message: "当前无法抓取该来源页面，请先改为手动补全。",
    };
  } finally {
    clearTimeout(timeoutId);
  }
}
