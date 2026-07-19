import {
  findKnownCityInText,
  getKnownCityAliases,
  normalizeCityName,
  normalizeCountryName,
  findKnownDistrictInText,
} from "../location.ts";
import {
  categoryEvidenceTerms,
} from "./constants.ts";
import type {
  ExtractedField,
  ExtractionFieldOrigin,
  NormalizedExtractionResult,
} from "./extraction-architecture.ts";

export const maxManualEvidenceCharacters = 2400;

export function isWebsiteRecoveryRequired(input: {
  sourceType: string;
  extractionStatus: string;
  fetchStatus?: string | null;
}) {
  return input.sourceType === "website" && (
    input.extractionStatus === "unavailable" ||
    input.fetchStatus === "blocked" ||
    input.fetchStatus === "timeout" ||
    input.fetchStatus === "invalid_response"
  );
}

export type ManualEvidenceInputResult =
  | {
      ok: true;
      text: string;
    }
  | {
      ok: false;
      error: string;
    };

type ManualEvidenceFields = Partial<
  Record<ExtractedField, string | null>
>;

function normalizeLine(value: string) {
  return value.replace(/\s+/gu, " ").trim();
}

function hasHtmlOrScript(value: string) {
  return /<\/?[a-z][^>]*>/iu.test(value) || /javascript\s*:/iu.test(value);
}

export function normalizeManualEvidenceText(
  value: string | null | undefined,
): ManualEvidenceInputResult {
  const input = value?.trim() ?? "";

  if (!input) {
    return { ok: false, error: "请先粘贴网页中可见的文字。" };
  }

  if (hasHtmlOrScript(input)) {
    return { ok: false, error: "请粘贴网页可见文字，不要粘贴 HTML 或脚本。" };
  }

  const normalizedLines = input
    .split(/\r?\n/u)
    .map(normalizeLine)
    .filter(Boolean);
  const normalized = normalizedLines.join("\n").slice(0, maxManualEvidenceCharacters).trim();

  if (!normalized) {
    return { ok: false, error: "请先粘贴网页中可见的文字。" };
  }

  return { ok: true, text: normalized };
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function firstMatch(text: string, pattern: RegExp) {
  const match = text.match(pattern);
  return match?.[1] ? normalizeLine(match[1]) : null;
}

function getLines(text: string) {
  return text.split("\n").map(normalizeLine).filter(Boolean);
}

function extractName(lines: string[]) {
  const labeledName = lines.find((line) =>
    /^(?:名称|店名|地点名称|name|place name|title)\s*[:：-]/iu.test(line),
  );

  if (labeledName) {
    return firstMatch(labeledName, /^(?:名称|店名|地点名称|name|place name|title)\s*[:：-]\s*(.+)$/iu);
  }

  const firstLine = lines[0] ?? "";

  if (
    firstLine.length > 1 &&
    firstLine.length <= 120 &&
    !/^(?:地址|电话|联系电话|address|phone|tel|description|简介|介绍)\s*[:：-]/iu.test(firstLine)
  ) {
    return firstLine;
  }

  return null;
}

function extractPhone(text: string, lines: string[]) {
  const labeledPhone = lines.find((line) =>
    /^(?:电话|联系电话|手机|phone|tel|telephone)\s*[:：-]/iu.test(line),
  );
  const labeledValue = labeledPhone
    ? firstMatch(labeledPhone, /^(?:电话|联系电话|手机|phone|tel|telephone)\s*[:：-]\s*(.+)$/iu)
    : null;
  const labeledNumber = labeledValue?.match(/\+?\d[\d\s().-]{6,}\d/u)?.[0] ?? null;

  if (labeledNumber) {
    return normalizeLine(labeledNumber);
  }

  const mobile = text.match(/\b1[3-9]\d{9}\b/u)?.[0];

  if (mobile) {
    return mobile;
  }

  return text.match(/\+?\d[\d\s().-]{6,}\d/u)?.[0]?.trim() ?? null;
}

function extractAddress(lines: string[]) {
  const labeledAddress = lines.find((line) =>
    /^(?:地址|详细地址|address|location)\s*[:：-]/iu.test(line),
  );

  if (labeledAddress) {
    return firstMatch(labeledAddress, /^(?:地址|详细地址|address|location)\s*[:：-]\s*(.+)$/iu);
  }

  return lines.find((line) =>
    /\d{1,6}[^\n]{0,80}(?:号|路|街|道|区|县|road|street|st\.?|avenue|ave\.?|boulevard|blvd\.?|drive|dr\.?|lane|ln\.?|町|丁目)/iu.test(line),
  ) ?? null;
}

function extractCity(text: string) {
  const knownCity = findKnownCityInText(text);

  if (knownCity) {
    return knownCity;
  }

  const candidates = getKnownCityAliases().sort((left, right) => right.length - left.length);

  const match = candidates.find((candidate) =>
    new RegExp(
      /^[a-z]/iu.test(candidate)
        ? `\\b${escapeRegExp(candidate)}\\b`
        : escapeRegExp(candidate),
      "iu",
    ).test(text),
  );

  if (!match) {
    return null;
  }

  return normalizeCityName(match) ?? match;
}

function extractCountry(lines: string[]) {
  const labeledCountry = lines.find((line) =>
    /^(?:国家|国家\/地区|地区|country|region)\s*[:：-]/iu.test(line),
  );

  if (!labeledCountry) {
    return null;
  }

  const value = firstMatch(
    labeledCountry,
    /^(?:国家|国家\/地区|地区|country|region)\s*[:：-]\s*(.+)$/iu,
  );

  return value ? normalizeCountryName(value) ?? value : null;
}

function extractDistrict(text: string, city: string | null) {
  return findKnownDistrictInText(text, city);
}

function includesTerm(text: string, term: string) {
  return /^[a-z]/iu.test(term)
    ? new RegExp(`\\b${escapeRegExp(term)}\\b`, "iu").test(text)
    : text.includes(term);
}

function extractCategory(text: string) {
  for (const candidate of categoryEvidenceTerms) {
    if (candidate.terms.some((term) => includesTerm(text, term))) {
      return candidate.category;
    }
  }

  return null;
}

function extractDescription(lines: string[]) {
  const descriptionLine = lines.find((line) =>
    /^(?:简介|介绍|description|about)\s*[:：-]/iu.test(line),
  );

  return descriptionLine
    ? firstMatch(descriptionLine, /^(?:简介|介绍|description|about)\s*[:：-]\s*(.+)$/iu)
    : null;
}

export function extractManualEvidenceFields(text: string): ManualEvidenceFields {
  const lines = getLines(text);
  const fields: ManualEvidenceFields = {};
  const name = extractName(lines);
  const city = extractCity(text);
  const district = extractDistrict(text, city);
  const country = extractCountry(lines);
  const address = extractAddress(lines);
  const phone = extractPhone(text, lines);
  const category = extractCategory(text);
  const description = extractDescription(lines);

  if (name) fields.name = name;
  if (city) fields.city = city;
  if (district) fields.district = district;
  if (country) fields.country = country;
  if (address) fields.address = address;
  if (phone) fields.phone = phone;
  if (category) fields.category = category;
  if (description) fields.description = description;

  return fields;
}

export function buildManualEvidenceExtractionResult(
  sourceUrl: string,
  text: string,
): NormalizedExtractionResult {
  const fields = extractManualEvidenceFields(text);
  const extractedFields = Object.keys(fields).filter(
    (field): field is ExtractedField => Boolean(fields[field as ExtractedField]),
  );
  if (fields.description && !extractedFields.includes("notes")) {
    extractedFields.push("notes");
  }
  const fieldOrigins = Object.fromEntries(
    extractedFields.map((field) => [field, "manual_evidence"]),
  ) as Partial<Record<ExtractedField, ExtractionFieldOrigin>>;

  return {
    name: fields.name ?? null,
    description: fields.description ?? null,
    category: fields.category ?? null,
    city: fields.city ?? null,
    country: fields.country ?? null,
    district: fields.district ?? null,
    address: fields.address ?? null,
    phone: fields.phone ?? null,
    latitude: null,
    longitude: null,
    websiteUrl: null,
    imageUrl: null,
    sourceUrl,
    notes: fields.description ?? null,
    confidence: extractedFields.length > 0 ? "medium" : "low",
    extractionStatus: extractedFields.length > 0 ? "partial" : "unavailable",
    extractedFields,
    fieldOrigins,
    evidence: { manualText: text },
    sourceType: "website",
    message:
      extractedFields.length > 0
        ? "用户粘贴的网页文字已完成本地整理，请继续检查。"
        : "用户粘贴的网页文字中没有找到可安全使用的信息。",
  };
}
