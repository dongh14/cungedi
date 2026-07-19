export type PmtilesPreflightResult =
  | {
      status: "ready";
      httpStatus: number;
      byteLength: number;
      rangeSupported: boolean;
    }
  | {
      status: "error";
      reason: "invalid_response" | "empty_response" | "timeout" | "network_error";
      httpStatus?: number;
    };

type FetchLike = typeof fetch;

function getByteLength(response: Response, firstChunkLength: number) {
  if (firstChunkLength > 0) {
    return firstChunkLength;
  }

  const contentLength = Number(response.headers.get("content-length"));
  return Number.isFinite(contentLength) && contentLength > 0 ? contentLength : 0;
}

export async function preflightPmtilesArchive(
  publicPath: string,
  options: { fetchImpl?: FetchLike; timeoutMs?: number } = {},
): Promise<PmtilesPreflightResult> {
  const fetchImpl = options.fetchImpl ?? fetch;
  const timeoutMs = options.timeoutMs ?? 5000;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetchImpl(publicPath, {
      headers: { Range: "bytes=0-126" },
      signal: controller.signal,
    });

    if (response.status !== 200 && response.status !== 206) {
      return { status: "error", reason: "invalid_response", httpStatus: response.status };
    }

    let firstChunkLength = 0;
    const reader = response.body?.getReader();

    if (reader) {
      const firstChunk = await reader.read();
      firstChunkLength = firstChunk.value?.byteLength ?? 0;
      await reader.cancel();
    }

    const byteLength = getByteLength(response, firstChunkLength);

    if (byteLength === 0) {
      return { status: "error", reason: "empty_response", httpStatus: response.status };
    }

    return {
      status: "ready",
      httpStatus: response.status,
      byteLength,
      rangeSupported: response.status === 206 || Boolean(response.headers.get("content-range")),
    };
  } catch (error) {
    return {
      status: "error",
      reason: error instanceof DOMException && error.name === "AbortError"
        ? "timeout"
        : "network_error",
    };
  } finally {
    clearTimeout(timeout);
  }
}
