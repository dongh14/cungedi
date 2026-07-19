export type SafeRestaurantQueryDiagnostic = {
  operation: string;
  name: string;
  message: string;
  code?: string;
  details?: string;
  hint?: string;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object";
}

function sanitizeText(value: unknown, fallback: string) {
  if (typeof value !== "string" || !value.trim()) {
    return fallback;
  }

  return value
    .replace(/https?:\/\/[^\s"'<>]+/giu, "[redacted-url]")
    .replace(/\b(?:bearer|basic)\s+[^\s]+/giu, "[redacted-authorization]")
    .replace(
      /\b(api[_-]?key|access[_-]?token|authorization|cookie|password|secret)\b\s*[:=]\s*(?:(?:bearer|basic)\s+)?[^\s,;]+/giu,
      "$1=[redacted]",
    )
    .replace(/\b(?:sk|pk)_[A-Za-z0-9_-]{8,}\b/gu, "[redacted-token]")
    .replace(/[\r\n]+/gu, " ")
    .slice(0, 240);
}

function sanitizeCode(value: unknown) {
  if (typeof value !== "string" && typeof value !== "number") {
    return undefined;
  }

  const code = String(value).replace(/[^A-Za-z0-9_.-]/gu, "").slice(0, 64);
  return code || undefined;
}

function getErrorName(error: unknown) {
  const name = isRecord(error) ? error.name : undefined;
  return typeof name === "string" && /^[A-Za-z][A-Za-z0-9_.-]{0,79}$/u.test(name)
    ? name
    : error instanceof Error
      ? "Error"
      : "QueryError";
}

export function normalizeRestaurantQueryError(
  operation: string,
  error: unknown,
): SafeRestaurantQueryDiagnostic {
  const source = isRecord(error) ? error : {};

  return {
    operation,
    name: getErrorName(error),
    message: sanitizeText(
      source.message ?? (error instanceof Error ? error.message : undefined),
      "Restaurant query failed.",
    ),
    ...(sanitizeCode(source.code) ? { code: sanitizeCode(source.code) } : {}),
    ...(typeof source.details === "string" && source.details.trim()
      ? { details: sanitizeText(source.details, "") }
      : {}),
    ...(typeof source.hint === "string" && source.hint.trim()
      ? { hint: sanitizeText(source.hint, "") }
      : {}),
  };
}

export function logRestaurantQueryError(
  operation: string,
  error: unknown,
  env: NodeJS.ProcessEnv = process.env,
) {
  if (env.NODE_ENV !== "development" && env.NODE_ENV !== "production") {
    return;
  }

  const diagnostic = normalizeRestaurantQueryError(operation, error);
  const log = env.NODE_ENV === "production" ? console.error : console.warn;
  log("[restaurants] query_failed", diagnostic);
}
