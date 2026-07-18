import { buildCompactAIContext } from "./ai-prompt.ts";
import { evaluateAIEnrichmentEligibility } from "./ai-eligibility.ts";
import {
  buildAIEnrichmentCacheDescriptor,
  defaultAIEnrichmentCacheTtlMs,
  defaultAIEnrichmentModel,
  defaultAIEnrichmentPromptVersion,
  hashAIExtractionContent,
  type AIEnrichmentCacheStore,
} from "./ai-cache.ts";
import { createSupabaseAIEnrichmentCacheStore } from "./ai-cache-store.ts";
import type {
  AIEnrichmentConfidence,
  AIEnrichmentProvider,
  AIEnrichmentRequest,
  AIEnrichmentResult,
  AIProposedField,
} from "./ai-enrichment.ts";
import {
  isValidCachedAIEnrichmentResult,
  normalizeAIEnrichmentResult,
  sanitizeFactualAIEnrichment,
} from "./ai-enrichment.ts";
import {
  logDeepSeekDiagnostic,
  serializeSafeError,
} from "./deepseek-diagnostics.ts";

export const deepSeekApiEndpoint = "https://api.deepseek.com/chat/completions";
export const defaultDeepSeekModel = defaultAIEnrichmentModel;
export const defaultDeepSeekTimeoutMs = 12000;
export const defaultDeepSeekMaxOutputTokens = 600;

export type DeepSeekProviderOptions = {
  apiKey?: string;
  model?: string;
  endpoint?: string;
  timeoutMs?: number;
  maxOutputTokens?: number;
  fetchImpl?: typeof fetch;
  cacheStore?: AIEnrichmentCacheStore;
  cacheTtlMs?: number;
  promptVersion?: string;
  thinkingMode?: boolean;
};

type DeepSeekWireResponse = {
  status: "suggestions_available" | "no_changes" | "failed";
  factualSuggestions: {
    address: string;
    phone: string;
    city: string;
    country: string;
  };
  understandingSuggestions: {
    category: string;
    cuisine: string;
    tags: string[];
    summary: string;
    placeType: string;
  };
  confidence: unknown;
  reason: unknown;
};

const responseKeys = ["status", "factualSuggestions", "understandingSuggestions", "confidence", "reason"] as const;
const factualKeys = ["address", "phone", "city", "country"] as const;
const understandingKeys = ["category", "cuisine", "tags", "summary", "placeType"] as const;

const inFlightRequests = new Map<string, Promise<AIEnrichmentResult>>();

function getConfig(options: DeepSeekProviderOptions) {
  return {
    apiKey: options.apiKey ?? process.env.DEEPSEEK_API_KEY ?? "",
    model: options.model ?? process.env.DEEPSEEK_MODEL ?? defaultDeepSeekModel,
    endpoint: options.endpoint ?? deepSeekApiEndpoint,
    timeoutMs: options.timeoutMs ?? defaultDeepSeekTimeoutMs,
    maxOutputTokens: options.maxOutputTokens ?? defaultDeepSeekMaxOutputTokens,
    cacheTtlMs: options.cacheTtlMs ?? defaultAIEnrichmentCacheTtlMs,
    promptVersion: options.promptVersion ?? defaultAIEnrichmentPromptVersion,
    thinkingMode: options.thinkingMode ?? false,
    cacheStore: options.cacheStore,
    fetchImpl: options.fetchImpl ?? fetch,
  };
}

function isConfidence(value: unknown): value is AIEnrichmentConfidence {
  return value === "low" || value === "medium" || value === "high";
}

function getString(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function hasExactKeys(value: Record<string, unknown>, expectedKeys: readonly string[]) {
  const keys = Object.keys(value);

  return keys.length === expectedKeys.length && expectedKeys.every((key) => keys.includes(key));
}

function failedResult(message: string): AIEnrichmentResult {
  return {
    status: "failed",
    message,
    proposal: null,
  };
}

export function cleanDeepSeekJsonText(content: string) {
  const trimmed = content.trim();
  const fencedMatch = trimmed.match(/^```json\s*([\s\S]*?)\s*```$/i);

  return fencedMatch ? fencedMatch[1].trim() : trimmed;
}

function parseDeepSeekResponse(content: string): AIEnrichmentResult {
  let parsed: DeepSeekWireResponse;

  try {
    const candidate = JSON.parse(cleanDeepSeekJsonText(content)) as unknown;

    if (!isRecord(candidate) || !hasExactKeys(candidate, responseKeys)) {
      return failedResult("DeepSeek returned an invalid JSON object.");
    }

    const factualSuggestions = candidate.factualSuggestions;
    const understandingSuggestions = candidate.understandingSuggestions;

    if (
      !["suggestions_available", "no_changes", "failed"].includes(String(candidate.status)) ||
      !isConfidence(candidate.confidence) ||
      typeof candidate.reason !== "string" ||
      !isRecord(factualSuggestions) ||
      !isRecord(understandingSuggestions)
    ) {
      return failedResult("DeepSeek returned an invalid enrichment shape.");
    }

    if (
      !hasExactKeys(factualSuggestions, factualKeys) ||
      !factualKeys.every((key) => typeof factualSuggestions[key] === "string") ||
      !hasExactKeys(understandingSuggestions, understandingKeys) ||
      !understandingKeys.every((key) =>
        key === "tags"
          ? Array.isArray(understandingSuggestions[key]) &&
            understandingSuggestions[key].every((tag) => typeof tag === "string")
          : typeof understandingSuggestions[key] === "string",
      )
    ) {
      return failedResult("DeepSeek returned an invalid enrichment shape.");
    }

    parsed = candidate as unknown as DeepSeekWireResponse;
  } catch {
    return failedResult("DeepSeek returned invalid JSON; no suggestions were applied.");
  }

  if (parsed.status === "no_changes") {
    return {
      status: "no_changes",
      message: "DeepSeek found no safe improvements for this draft.",
      proposal: null,
    };
  }

  if (parsed.status === "failed") {
    return failedResult(getString(parsed.reason) ?? "DeepSeek could not enrich this draft.");
  }

  const proposedFields: AIProposedField[] = [
    ...factualKeys.flatMap((field) => {
      const value = getString(parsed.factualSuggestions[field]);
      return value
        ? [{ field, group: "factual" as const, value, confidence: parsed.confidence as AIEnrichmentConfidence }]
        : [];
    }),
    ...understandingKeys.flatMap((field) => {
      const value = field === "tags"
        ? parsed.understandingSuggestions.tags.join(", ")
        : getString(parsed.understandingSuggestions[field]);
      return value
        ? [{ field, group: "understanding" as const, value, confidence: parsed.confidence as AIEnrichmentConfidence }]
        : [];
    }),
  ];

  if (proposedFields.length === 0) {
    return {
      status: "no_changes",
      message: "DeepSeek found no safe improvements for this draft.",
      proposal: null,
    };
  }

  return {
    status: "suggestions_available",
    message: "AI improvement available.",
    proposal: {
      factualSuggestions: {
        address: parsed.factualSuggestions.address || null,
        phone: parsed.factualSuggestions.phone || null,
        city: parsed.factualSuggestions.city || null,
        country: parsed.factualSuggestions.country || null,
      },
      understandingSuggestions: {
        category: parsed.understandingSuggestions.category || null,
        cuisine: parsed.understandingSuggestions.cuisine || null,
        tags: parsed.understandingSuggestions.tags,
        summary: parsed.understandingSuggestions.summary || null,
        placeType: parsed.understandingSuggestions.placeType || null,
      },
      confidence: parsed.confidence as AIEnrichmentConfidence,
      reasoningSummary: getString(parsed.reason) ?? "",
      proposedFields,
    },
  };
}

export function createDeepSeekAIEnrichmentProvider(
  options: DeepSeekProviderOptions = {},
): AIEnrichmentProvider {
  return {
    id: "deepseek",
    async enrich(request) {
      const eligibility = evaluateAIEnrichmentEligibility({
        draft: request.mergedPlaceDraft,
        extractedSourceData: request.extractedSourceData,
        missingFields: request.missingFields,
      });

      if (!eligibility.shouldRun) {
        return {
          status: "no_changes",
          message: "No meaningful AI enrichment is needed for this draft.",
          proposal: null,
        };
      }

      const config = getConfig(options);

      const sourceTypes = Array.from(new Set(request.extractedSourceData.map((result) => result.sourceType))).sort();
      const sourceUrls = Array.from(new Set(request.sourceUrls)).sort();
      const descriptor = buildAIEnrichmentCacheDescriptor({
        provider: "deepseek",
        model: config.model,
        promptVersion: config.promptVersion,
        sourceType: sourceTypes.join(","),
        sourceUrl: sourceUrls.join("|"),
        evidenceHash: hashAIExtractionContent(request.extractedSourceData),
        missingFields: request.missingFields,
        thinkingMode: config.thinkingMode,
      });

      const work = async (): Promise<AIEnrichmentResult> => {
        let cacheStore = config.cacheStore;

        if (!cacheStore && request.userId) {
          try {
            cacheStore = createSupabaseAIEnrichmentCacheStore(request.userId);
          } catch (error) {
            logDeepSeekDiagnostic({
              event: "cache_read_failed",
              cacheKey: descriptor.cacheKey,
              model: config.model,
              promptVersion: config.promptVersion,
              error: serializeSafeError({
                operation: "cache_store_init",
                error,
                safeMessage: "Cache store unavailable.",
                retryable: true,
              }),
            });
          }
        }

        if (cacheStore && !request.forceRefresh) {
          const cacheReadStartedAt = Date.now();

          try {
            const cached = await cacheStore.get(descriptor.cacheKey);
            const durationMs = Date.now() - cacheReadStartedAt;

            if (cached) {
              if (isValidCachedAIEnrichmentResult(cached.responseJson)) {
                logDeepSeekDiagnostic({
                  event: "cache_hit",
                  cacheKey: descriptor.cacheKey,
                  model: config.model,
                  promptVersion: config.promptVersion,
                  durationMs,
                });
                return {
                  ...sanitizeFactualAIEnrichment(
                    normalizeAIEnrichmentResult(cached.responseJson),
                    request.extractedSourceData,
                  ),
                  cacheStatus: "hit",
                };
              }

              logDeepSeekDiagnostic({
                event: "cache_invalid",
                cacheKey: descriptor.cacheKey,
                model: config.model,
                promptVersion: config.promptVersion,
                durationMs,
                responseValidation: "invalid",
              });
              if (cacheStore.delete) {
                await cacheStore.delete(descriptor.cacheKey).catch(() => undefined);
              }
            } else {
              logDeepSeekDiagnostic({
                event: "cache_miss",
                cacheKey: descriptor.cacheKey,
                model: config.model,
                promptVersion: config.promptVersion,
                durationMs,
              });
            }
          } catch (error) {
            logDeepSeekDiagnostic({
              event: "cache_read_failed",
              cacheKey: descriptor.cacheKey,
              model: config.model,
              promptVersion: config.promptVersion,
              durationMs: Date.now() - cacheReadStartedAt,
              error: serializeSafeError({
                operation: "cache_read",
                error,
                safeMessage: "Cache read failed.",
                retryable: true,
              }),
            });
          }
        } else if (request.forceRefresh) {
          logDeepSeekDiagnostic({
            event: "cache_bypass",
            cacheKey: descriptor.cacheKey,
            model: config.model,
            promptVersion: config.promptVersion,
            durationMs: 0,
          });
        }

        if (!config.apiKey) {
          logDeepSeekDiagnostic({
            event: "provider_failure",
            cacheKey: descriptor.cacheKey,
            model: config.model,
            promptVersion: config.promptVersion,
            sourceUrls,
            responseValidation: "unavailable",
            error: serializeSafeError({
              operation: "provider_config",
              safeMessage: "DeepSeek provider is not configured.",
              retryable: false,
            }),
          });
          return {
            status: "unavailable",
            message: "AI enrichment unavailable: DEEPSEEK_API_KEY is not configured.",
            proposal: null,
          };
        }

        logDeepSeekDiagnostic({
          event: "provider_call",
          cacheKey: descriptor.cacheKey,
          model: config.model,
          promptVersion: config.promptVersion,
          sourceUrls,
          durationMs: 0,
        });

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), config.timeoutMs);
        const providerStartedAt = Date.now();
        let responseStatus: number | undefined;
        let finishReason: unknown;

        try {
          const response = await config.fetchImpl(config.endpoint, {
            method: "POST",
            headers: {
              Accept: "application/json",
              Authorization: `Bearer ${config.apiKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              model: config.model,
              temperature: 0.1,
              max_tokens: config.maxOutputTokens,
              response_format: { type: "json_object" },
              messages: [
                {
                  role: "system",
                  content:
                    "Return only one valid JSON object. Do not wrap JSON in markdown or code fences. Do not include explanations before or after JSON. Follow the provided schema exactly. Use only the allowed status and confidence strings. Never use numeric confidence. Do not return additional fields. Use only the provided evidence. Extract factual fields only when explicitly supported. Leave factual fields empty when evidence is absent. You may classify understanding fields from the provided name and description, but never invent addresses, phone numbers, ratings, or opening hours. Suggest only safe, explicit improvements.",
                },
                {
                  role: "user",
                  content: `${buildCompactAIContext(request)}\n\nReturn exactly this JSON shape and no other fields: {"status":"suggestions_available | no_changes | failed","factualSuggestions":{"address":"","phone":"","city":"","country":""},"understandingSuggestions":{"category":"","cuisine":"","tags":[],"summary":"","placeType":""},"confidence":"low | medium | high","reason":""}. Keep factualSuggestions evidence-only. Understanding suggestions may classify the provided name and description. Never return numeric confidence, markdown, or explanatory text.`,
                },
              ],
            }),
            signal: controller.signal,
          });
          responseStatus = response.status;

          if (!response.ok) {
            logDeepSeekDiagnostic({
              event: "provider_failure",
              cacheKey: descriptor.cacheKey,
              model: config.model,
              promptVersion: config.promptVersion,
              sourceUrls,
              httpStatus: response.status,
              durationMs: Date.now() - providerStartedAt,
              responseValidation: "http_error",
              error: serializeSafeError({
                operation: "provider_request",
                safeMessage: "DeepSeek request failed.",
                httpStatus: response.status,
                retryable: response.status === 429 || response.status >= 500,
              }),
            });
            return failedResult(`DeepSeek request failed with status ${response.status}.`);
          }

          const payload = (await response.json()) as {
            choices?: Array<{
              finish_reason?: unknown;
              message?: { content?: unknown };
            }>;
          };
          finishReason = payload.choices?.[0]?.finish_reason;
          const content = payload.choices?.[0]?.message?.content;
          const rawResponseText = typeof content === "string"
            ? content
            : JSON.stringify(content ?? null);

          logDeepSeekDiagnostic({
            event: "raw_response",
            rawResponseText,
          });

          if (typeof content !== "string") {
            logDeepSeekDiagnostic({
              event: "provider_failure",
              cacheKey: descriptor.cacheKey,
              model: config.model,
              promptVersion: config.promptVersion,
              sourceUrls,
              httpStatus: response.status,
              finishReason,
              durationMs: Date.now() - providerStartedAt,
              responseValidation: "invalid",
              error: serializeSafeError({
                operation: "response_validation",
                safeMessage: "DeepSeek returned no JSON content.",
                httpStatus: response.status,
                retryable: false,
              }),
            });
            return failedResult("DeepSeek returned no JSON content.");
          }

          const normalizedResult = sanitizeFactualAIEnrichment(
            parseDeepSeekResponse(content),
            request.extractedSourceData,
          );

          const responseValidation = normalizedResult.status === "failed"
            ? "invalid"
            : normalizedResult.status;

          logDeepSeekDiagnostic({
            event: normalizedResult.status === "failed" ? "provider_failure" : "provider_success",
            cacheKey: descriptor.cacheKey,
            model: config.model,
            promptVersion: config.promptVersion,
            sourceUrls,
            httpStatus: response.status,
            finishReason,
            durationMs: Date.now() - providerStartedAt,
            responseValidation,
            ...(normalizedResult.status === "failed"
              ? {
                  error: serializeSafeError({
                    operation: "response_validation",
                    safeMessage: "DeepSeek response validation failed.",
                    httpStatus: response.status,
                    retryable: false,
                  }),
                }
              : {}),
          });

          if (
            cacheStore &&
            request.userId &&
            isValidCachedAIEnrichmentResult(normalizedResult)
          ) {
            const cacheWriteStartedAt = Date.now();

            try {
              await cacheStore.set({
                descriptor,
                userId: request.userId,
                responseJson: normalizedResult,
                expiresAt: new Date(Date.now() + config.cacheTtlMs).toISOString(),
              });
              logDeepSeekDiagnostic({
                event: "cache_write",
                cacheKey: descriptor.cacheKey,
                model: config.model,
                promptVersion: config.promptVersion,
                durationMs: Date.now() - cacheWriteStartedAt,
              });
            } catch (error) {
              logDeepSeekDiagnostic({
                event: "cache_write_failed",
                cacheKey: descriptor.cacheKey,
                model: config.model,
                promptVersion: config.promptVersion,
                durationMs: Date.now() - cacheWriteStartedAt,
                error: serializeSafeError({
                  operation: "cache_write",
                  error,
                  safeMessage: "Cache write failed.",
                  retryable: true,
                }),
              });
            }

            return {
              ...normalizedResult,
              cacheStatus: request.forceRefresh ? "bypass" : "miss",
            };
          }

          return normalizedResult;
        } catch (error) {
          const timedOut = error instanceof Error && error.name === "AbortError";
          const message = timedOut
            ? "DeepSeek request timed out."
            : "DeepSeek request failed without changing the current draft.";

          logDeepSeekDiagnostic({
            event: "provider_failure",
            cacheKey: descriptor.cacheKey,
            model: config.model,
            promptVersion: config.promptVersion,
            sourceUrls,
            ...(responseStatus !== undefined ? { httpStatus: responseStatus } : {}),
            finishReason,
            durationMs: Date.now() - providerStartedAt,
            responseValidation: timedOut ? "timeout" : "failed",
            error: serializeSafeError({
              operation: "provider_request",
              error,
              safeMessage: message,
              httpStatus: responseStatus,
              retryable: true,
            }),
          });

          return failedResult(message);
        } finally {
          clearTimeout(timeoutId);
        }
      };

      const inFlightKey = request.userId ? `${request.userId}:${descriptor.cacheKey}` : null;
      const existing = inFlightKey ? inFlightRequests.get(inFlightKey) : undefined;

      if (existing) {
        return existing;
      }

      const pending = work();

      if (inFlightKey) {
        inFlightRequests.set(inFlightKey, pending);
      }

      try {
        return await pending;
      } finally {
        if (inFlightKey && inFlightRequests.get(inFlightKey) === pending) {
          inFlightRequests.delete(inFlightKey);
        }
      }
    },
  };
}

export const deepSeekAIEnrichmentProvider = createDeepSeekAIEnrichmentProvider();

export { parseDeepSeekResponse };
