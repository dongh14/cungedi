export type SafeErrorLog = {
  operation: string;
  name: string;
  message: string;
  providerCode?: string;
  httpStatus?: number;
  retryable: boolean;
};

export type DeepSeekDiagnosticEvent =
  | "cache_hit"
  | "cache_miss"
  | "cache_bypass"
  | "cache_invalid"
  | "cache_read_failed"
  | "cache_write"
  | "cache_write_failed"
  | "provider_call"
  | "provider_success"
  | "provider_failure"
  | "raw_response";

type DiagnosticInput = {
  event: DeepSeekDiagnosticEvent;
  cacheKey?: string;
  model?: string;
  promptVersion?: string;
  sourceUrls?: string[];
  durationMs?: number;
  httpStatus?: number;
  finishReason?: unknown;
  responseValidation?: string;
  error?: SafeErrorLog;
  rawResponseText?: string;
};

function isEnabled(value: string | undefined) {
  return value?.trim().toLowerCase() === "true";
}

export function sanitizeSourceHostname(value: string | null | undefined) {
  if (!value) {
    return "unknown-host";
  }

  try {
    const url = new URL(value);
    return url.hostname.replace(/\.$/u, "").toLowerCase() || "unknown-host";
  } catch {
    return "unknown-host";
  }
}

function sanitizeMessage(value: string) {
  return value
    .replace(/https?:\/\/[^\s"'<>]+/giu, (url) => sanitizeSourceHostname(url))
    .replace(/\b(?:bearer|basic)\s+[^\s]+/giu, "[redacted authorization]")
    .replace(
      /\b(?:api[_-]?key|access[_-]?token|authorization|cookie|password|secret)\b\s*[:=]\s*[^\s,;]+/giu,
      "$1=[redacted]",
    )
    .replace(/\b(?:sk|pk)_[A-Za-z0-9_-]{8,}\b/gu, "[redacted token]")
    .replace(/[\r\n]+/gu, " ")
    .slice(0, 240);
}

function safeName(error: unknown) {
  if (!error || typeof error !== "object") {
    return "UnknownError";
  }

  const name = (error as { name?: unknown }).name;
  return typeof name === "string" && /^[A-Za-z][A-Za-z0-9_.-]{0,79}$/u.test(name)
    ? name
    : "Error";
}

export function serializeSafeError(input: {
  operation: string;
  error?: unknown;
  safeMessage?: string;
  providerCode?: unknown;
  httpStatus?: number;
  retryable?: boolean;
}): SafeErrorLog {
  const errorMessage = input.error instanceof Error ? input.error.message : "Operation failed.";
  const providerCode = typeof input.providerCode === "string" || typeof input.providerCode === "number"
    ? String(input.providerCode).replace(/[^A-Za-z0-9_.-]/gu, "").slice(0, 64)
    : undefined;

  return {
    operation: input.operation,
    name: safeName(input.error),
    message: sanitizeMessage(input.safeMessage ?? errorMessage),
    ...(providerCode ? { providerCode } : {}),
    ...(typeof input.httpStatus === "number" ? { httpStatus: input.httpStatus } : {}),
    retryable: Boolean(input.retryable),
  };
}

function shortCacheKey(cacheKey: string) {
  const hashPart = cacheKey.split(":").at(-1) ?? cacheKey;
  return hashPart.slice(0, 12);
}

function sanitizeDiagnostic(input: DiagnosticInput) {
  return {
    ...(input.cacheKey ? { cacheKeyPrefix: shortCacheKey(input.cacheKey) } : {}),
    ...(input.model ? { model: input.model } : {}),
    ...(input.promptVersion ? { promptVersion: input.promptVersion } : {}),
    ...(input.sourceUrls
      ? { sourceHosts: Array.from(new Set(input.sourceUrls.map(sanitizeSourceHostname))) }
      : {}),
    ...(typeof input.durationMs === "number" ? { durationMs: input.durationMs } : {}),
    ...(typeof input.httpStatus === "number" ? { httpStatus: input.httpStatus } : {}),
    ...(typeof input.finishReason === "string" ? { finishReason: input.finishReason } : {}),
    ...(input.responseValidation ? { responseValidation: input.responseValidation } : {}),
    ...(input.error ? { error: input.error } : {}),
  };
}

export function logDeepSeekDiagnostic(
  input: DiagnosticInput,
  env: NodeJS.ProcessEnv = process.env,
) {
  const isDevelopment = env.NODE_ENV === "development";
  const debugLogsEnabled = isDevelopment && env.DEEPSEEK_DEBUG_LOGS !== "false";
  const isRawResponse = input.event === "raw_response";
  const rawResponseEnabled = isDevelopment && isEnabled(env.DEEPSEEK_DEBUG_RAW_RESPONSE);
  const isActionable = input.event === "cache_read_failed" || input.event === "cache_write_failed" || input.event === "provider_failure";

  if (isRawResponse && !rawResponseEnabled) {
    return;
  }

  if (!debugLogsEnabled && !(env.NODE_ENV === "production" && isActionable)) {
    return;
  }

  const payload = isRawResponse
    ? { rawResponseText: input.rawResponseText ?? "" }
    : sanitizeDiagnostic(input);
  const prefix = `[deepseek] ${input.event}`;

  if (env.NODE_ENV === "production") {
    console.error(prefix, payload);
  } else {
    console.debug(prefix, payload);
  }
}
