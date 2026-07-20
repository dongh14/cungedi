import { isDouyinUrl } from "./platforms/douyin.ts";
import { isGenericWebUrl } from "./platforms/web.ts";
import { isXiaohongshuUrl } from "./platforms/xiaohongshu.ts";
import type { IntakeInputKind, IntakePlatform, NormalizedIntakeInput } from "./types.ts";

const urlPattern = /https?:\/\/[^\s<>"'“”‘’。，！？：；、）】」』》]+/giu;

const trailingUrlPunctuation = new Set([
  ".",
  ",",
  "!",
  "?",
  ":",
  ";",
  ")",
  "]",
  "}",
  ">",
  "\"",
  "'",
  "，",
  "。",
  "！",
  "？",
  "：",
  "；",
  "）",
  "】",
  "」",
  "』",
  "》",
  "、",
  "~",
]);

type UrlMatch = {
  value: string;
  start: number;
  end: number;
};

function trimTrailingUrlPunctuation(value: string) {
  let candidate = value;

  while (candidate.length > 0 && trailingUrlPunctuation.has(candidate.at(-1) ?? "")) {
    candidate = candidate.slice(0, -1);
  }

  return candidate;
}

function cutUrlAtFollowingText(value: string) {
  const chinesePunctuation = new Set(["，", "。", "！", "？", "：", "；", "、", "）", "】", "」", "』", "》"]);
  const englishPunctuation = new Set([",", ".", "!", "?", ";", ":", ")", "]", "}", ">"]);

  for (let index = 0; index < value.length; index += 1) {
    const character = value[index];
    const nextCharacter = value[index + 1] ?? "";

    if (chinesePunctuation.has(character)) {
      return value.slice(0, index);
    }

    if (
      englishPunctuation.has(character) &&
      (!nextCharacter || /\s|[\u3400-\u9fff]/u.test(nextCharacter))
    ) {
      return value.slice(0, index);
    }
  }

  return value;
}

function findUrls(input: string): UrlMatch[] {
  const matches: UrlMatch[] = [];
  const pattern = new RegExp(urlPattern.source, urlPattern.flags);

  for (const match of input.matchAll(pattern)) {
    const rawValue = cutUrlAtFollowingText(match[0]);
    const start = match.index ?? 0;
    const value = trimTrailingUrlPunctuation(rawValue);

    if (!isGenericWebUrl(value)) {
      continue;
    }

    matches.push({
      value,
      start,
      end: start + value.length,
    });
  }

  return matches;
}

function hasMeaningfulText(value: string) {
  return value.replace(/[\s\p{P}\p{S}]+/gu, "").length > 0;
}

function normalizeSurroundingText(input: string, matches: UrlMatch[]) {
  let result = input;

  for (const match of [...matches].reverse()) {
    result = `${result.slice(0, match.start)}${result.slice(match.end)}`;
  }

  return result
    .replace(/[ \t]{2,}/g, " ")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n[ \t]+/g, "\n")
    .replace(/\n{2,}/g, "\n")
    .trim();
}

function getPlatform(value: string): IntakePlatform {
  if (isXiaohongshuUrl(value)) {
    return "xiaohongshu";
  }

  if (isDouyinUrl(value)) {
    return "douyin";
  }

  if (isGenericWebUrl(value)) {
    return "web";
  }

  return "unknown";
}

function chooseOriginalUrl(matches: UrlMatch[]) {
  return (
    matches.find((match) => isXiaohongshuUrl(match.value))?.value ??
    matches.find((match) => isDouyinUrl(match.value))?.value ??
    matches[0]?.value ??
    null
  );
}

function getInputKind(rawInput: string, detectedUrls: string[], surroundingText: string): IntakeInputKind {
  const looksLikeUrl = /(?:https?:\/\/|www\.)\S*/iu.test(rawInput);

  if (
    !rawInput.trim() ||
    (detectedUrls.length === 0 && (!hasMeaningfulText(rawInput) || looksLikeUrl))
  ) {
    return "unknown";
  }

  if (detectedUrls.length === 0) {
    return "text";
  }

  return detectedUrls.length === 1 && !hasMeaningfulText(surroundingText)
    ? "url"
    : "shared_text";
}

export function normalizeIntakeInput(rawInput: string): NormalizedIntakeInput {
  const matches = findUrls(rawInput);
  const detectedUrls = matches.map((match) => match.value);
  const surroundingText = normalizeSurroundingText(rawInput, matches);
  const originalUrl = chooseOriginalUrl(matches);

  return {
    rawInput,
    inputKind: getInputKind(rawInput, detectedUrls, surroundingText),
    platform: originalUrl ? getPlatform(originalUrl) : "unknown",
    originalUrl,
    detectedUrls,
    surroundingText,
  };
}

export { trimTrailingUrlPunctuation };
