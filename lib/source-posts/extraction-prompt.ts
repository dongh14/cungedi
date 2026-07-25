import type { SourcePostExtractionInput } from "./extraction-types";

export const sourcePostExtractionPromptVersion = "source-post-place-extraction-v1";
export const sourcePostExtractionOperation = "source_post_place_extraction";
export const maxSourcePostExtractionInputCharacters = 2600;

function trim(value: string | null | undefined, maxLength: number) {
  const normalized = value?.trim() ?? "";
  return normalized.length > maxLength ? `${normalized.slice(0, maxLength)}...` : normalized;
}

function sanitizeUrl(value: string | null) {
  if (!value) return null;
  try {
    const url = new URL(value);
    url.username = "";
    url.password = "";
    url.search = "";
    url.hash = "";
    return url.toString();
  } catch {
    return null;
  }
}

export function buildSourcePostExtractionEvidence(input: SourcePostExtractionInput) {
  const preferredSourceUrl = sanitizeUrl(input.resolvedUrl ?? input.originalUrl);
  const evidence = {
    platform: input.platform,
    sourceUrl: preferredSourceUrl,
    shareText: trim(input.originalText, 1400) || null,
    accessibleMetadata: input.accessibleMetadata
      ? {
          title: trim(input.accessibleMetadata.title, 180) || null,
          description: trim(input.accessibleMetadata.description, 320) || null,
          siteName: trim(input.accessibleMetadata.siteName, 80) || null,
        }
      : null,
  };

  const serialized = JSON.stringify(evidence);
  return serialized.length <= maxSourcePostExtractionInputCharacters
    ? serialized
    : JSON.stringify({
        ...evidence,
        shareText: trim(input.originalText, 900) || null,
        accessibleMetadata: evidence.accessibleMetadata
          ? {
              title: evidence.accessibleMetadata.title,
              description: trim(evidence.accessibleMetadata.description, 180),
              siteName: evidence.accessibleMetadata.siteName,
            }
          : null,
      });
}

export const sourcePostExtractionSystemPrompt = `Return only one valid JSON object. Do not use markdown or explanations. Follow the schema exactly and return no additional fields.
Use only the supplied evidence. Identify physical places only when supported by the share text or compact public page metadata. Do not claim to have opened or read any URL.
Return at most 1 candidate unless multiple specific places are unmistakably present. Do not create candidates for a neighborhood, city, cuisine, event, or generic recommendation topic. Do not infer exact addresses, countries, or cities from ambiguous names or URL slugs. Use null for unsupported fields.
Preserve Chinese, Japanese, English, or local-language names when supported. Categories must be only 美食, 景点, 住宿, 购物, 娱乐, or 其他. Mark weak inferences low confidence. Keep evidence and warnings short.
Use extractionStatus=insufficient_evidence when no specific place can be identified. Never invent information and never return hidden reasoning.`;

export function buildSourcePostExtractionUserPrompt(input: SourcePostExtractionInput) {
  return `${buildSourcePostExtractionEvidence(input)}

Return exactly this JSON shape:
{"candidates":[{"id":"","name":null,"country":null,"city":null,"district":null,"address":null,"category":null,"subcategory":null,"note":null,"confidence":"low","evidence":[""],"warnings":[]}],"summary":null,"extractionStatus":"success"|"partial"|"insufficient_evidence"|"failed"}
The candidate id is ignored and replaced by the server. Evidence must be grounded in the supplied input and each candidate must include at least one short evidence item.`;
}
