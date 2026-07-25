import { requestDeepSeekJson } from "@/lib/restaurants/deepseek-provider";
import {
  buildSourcePostExtractionUserPrompt,
  sourcePostExtractionOperation,
  sourcePostExtractionPromptVersion,
  sourcePostExtractionSystemPrompt,
} from "./extraction-prompt";
import { validateSourcePostExtractionResult } from "./extraction-schema";
import type { SourcePostExtractionInput, SourcePostExtractionResult } from "./extraction-types";

export type SourcePostExtractionResponse = {
  status: "success" | "unavailable" | "failed";
  result: SourcePostExtractionResult | null;
  message: string;
  failureReason?: "length" | "invalid_json" | "invalid_response" | "provider_error";
};

function hasUsableEvidence(input: SourcePostExtractionInput) {
  return Boolean(
    input.originalText?.trim() ||
      input.originalUrl?.trim() ||
      input.resolvedUrl?.trim() ||
      input.accessibleMetadata?.title?.trim() ||
      input.accessibleMetadata?.description?.trim(),
  );
}

export async function extractSourcePostPlaces(
  input: SourcePostExtractionInput,
  options: { fetchImpl?: typeof fetch; apiKey?: string; model?: string } = {},
): Promise<SourcePostExtractionResponse> {
  if (!hasUsableEvidence(input)) {
    return {
      status: "success",
      result: { candidates: [], summary: null, extractionStatus: "insufficient_evidence" },
      message: "暂时无法确定具体地点，可手动整理",
    };
  }

  const response = await requestDeepSeekJson({
    operation: sourcePostExtractionOperation,
    promptVersion: sourcePostExtractionPromptVersion,
    systemPrompt: sourcePostExtractionSystemPrompt,
    userPrompt: buildSourcePostExtractionUserPrompt(input),
    sourceUrls: [input.originalUrl, input.resolvedUrl].filter((value): value is string => Boolean(value)),
    maxOutputTokens: 900,
    fetchImpl: options.fetchImpl,
    apiKey: options.apiKey,
    model: options.model,
  });

  if (response.status !== "success" || !response.content) {
    return {
      status: response.status,
      result: null,
      message: response.finishReason === "length"
        ? "已读取来源，但部分信息未能自动识别，请检查后补充。"
        : response.status === "unavailable"
          ? "AI 识别暂未配置"
          : "识别失败，请稍后重试",
      failureReason: response.finishReason === "length" ? "length" : "provider_error",
    };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(response.content);
  } catch {
    return {
      status: "failed",
      result: null,
      message: "已读取来源，但部分信息未能自动识别，请检查后补充。",
      failureReason: "invalid_json",
    };
  }

  const result = validateSourcePostExtractionResult(parsed);
  if (!result) {
    return {
      status: "failed",
      result: null,
      message: "已读取来源，但部分信息未能自动识别，请检查后补充。",
      failureReason: "invalid_response",
    };
  }

  return {
    status: "success",
    result,
    message: result.candidates.length > 0
      ? "已识别候选地点，请确认"
      : "暂时无法确定具体地点，可手动整理",
  };
}
