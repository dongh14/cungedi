import type {
  SourceDocumentContent,
  SourceDocumentMetadata,
  StructuredDataNode,
  StructuredDataPostalAddress,
} from "./extraction-types";

function normalizeWhitespace(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function decodeHtmlEntities(value: string) {
  return value
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, "\"")
    .replace(/&#39;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&#x([0-9a-f]+);/gi, (_, hex: string) =>
      String.fromCodePoint(Number.parseInt(hex, 16)),
    )
    .replace(/&#(\d+);/g, (_, numeric: string) =>
      String.fromCodePoint(Number.parseInt(numeric, 10)),
    );
}

function extractAttribute(tag: string, attributeName: string) {
  const directMatch = tag.match(
    new RegExp(`${attributeName}\\s*=\\s*["']([^"']*)["']`, "i"),
  );

  if (directMatch?.[1]) {
    return directMatch[1];
  }

  const unquotedMatch = tag.match(
    new RegExp(`${attributeName}\\s*=\\s*([^\\s>]+)`, "i"),
  );

  return unquotedMatch?.[1] ?? null;
}

function extractTitle(html: string) {
  const match = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);

  if (!match?.[1]) {
    return null;
  }

  return normalizeWhitespace(decodeHtmlEntities(match[1]));
}

function extractMetaContent(
  html: string,
  attributeName: "name" | "property",
  attributeValue: string,
) {
  const metaTags = html.match(/<meta\b[^>]*>/gi) ?? [];

  for (const metaTag of metaTags) {
    const attribute = extractAttribute(metaTag, attributeName);

    if (!attribute || attribute.toLowerCase() !== attributeValue.toLowerCase()) {
      continue;
    }

    const content = extractAttribute(metaTag, "content");

    if (content) {
      return normalizeWhitespace(decodeHtmlEntities(content));
    }
  }

  return null;
}

function extractMetadata(html: string): SourceDocumentMetadata {
  return {
    title: extractTitle(html),
    description: extractMetaContent(html, "name", "description"),
    ogTitle: extractMetaContent(html, "property", "og:title"),
    ogDescription: extractMetaContent(html, "property", "og:description"),
    ogSiteName: extractMetaContent(html, "property", "og:site_name"),
  };
}

function extractStructuredDataScripts(html: string) {
  const matches = html.match(
    /<script\b[^>]*type\s*=\s*["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi,
  );

  return matches ?? [];
}

function safeJsonParse(value: string) {
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

function normalizeStructuredTypes(input: unknown) {
  if (Array.isArray(input)) {
    return input
      .map((value) => (typeof value === "string" ? value : null))
      .filter((value): value is string => Boolean(value))
      .map((value) => value.replace(/^https?:\/\/schema\.org\//i, "").toLowerCase());
  }

  if (typeof input === "string") {
    return [input.replace(/^https?:\/\/schema\.org\//i, "").toLowerCase()];
  }

  return [];
}

function getStringValue(value: unknown) {
  return typeof value === "string" ? normalizeWhitespace(decodeHtmlEntities(value)) : null;
}

function extractPostalAddress(value: unknown): StructuredDataPostalAddress | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  const record = value as Record<string, unknown>;

  return {
    streetAddress: getStringValue(record.streetAddress),
    addressLocality: getStringValue(record.addressLocality),
    addressRegion: getStringValue(record.addressRegion),
    postalCode: getStringValue(record.postalCode),
    addressCountry: getStringValue(record.addressCountry),
  };
}

function normalizeCuisineList(value: unknown) {
  if (Array.isArray(value)) {
    return value
      .map((entry) => getStringValue(entry))
      .filter((entry): entry is string => Boolean(entry));
  }

  const singleValue = getStringValue(value);

  if (!singleValue) {
    return [];
  }

  return singleValue
    .split(/[,/]|、|，/)
    .map((entry) => normalizeWhitespace(entry))
    .filter(Boolean);
}

function flattenStructuredDataInput(value: unknown): Record<string, unknown>[] {
  if (!value) {
    return [];
  }

  if (Array.isArray(value)) {
    return value.flatMap((entry) => flattenStructuredDataInput(entry));
  }

  if (typeof value !== "object") {
    return [];
  }

  const record = value as Record<string, unknown>;

  if (Array.isArray(record["@graph"])) {
    return record["@graph"].flatMap((entry) => flattenStructuredDataInput(entry));
  }

  return [record];
}

function extractStructuredData(html: string): StructuredDataNode[] {
  const scripts = extractStructuredDataScripts(html);
  const nodes: StructuredDataNode[] = [];

  for (const scriptTag of scripts) {
    const scriptMatch = scriptTag.match(/>([\s\S]*?)<\/script>/i);

    if (!scriptMatch?.[1]) {
      continue;
    }

    const parsedValue = safeJsonParse(scriptMatch[1].trim());

    for (const record of flattenStructuredDataInput(parsedValue)) {
      const types = normalizeStructuredTypes(record["@type"]);

      if (types.length === 0) {
        continue;
      }

      nodes.push({
        types,
        name: getStringValue(record.name),
        description: getStringValue(record.description),
        url: getStringValue(record.url),
        servesCuisine: normalizeCuisineList(record.servesCuisine),
        address: extractPostalAddress(record.address),
      });
    }
  }

  return nodes;
}

function stripHtmlTags(html: string) {
  return html
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, " ")
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, " ")
    .replace(/<noscript\b[^>]*>[\s\S]*?<\/noscript>/gi, " ")
    .replace(/<svg\b[^>]*>[\s\S]*?<\/svg>/gi, " ")
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/<\/(p|div|section|article|main|header|footer|li|ul|ol|h1|h2|h3|h4|h5|h6|br)>/gi, "\n")
    .replace(/<[^>]+>/g, " ");
}

function extractVisibleTextSegments(html: string) {
  return decodeHtmlEntities(stripHtmlTags(html))
    .split(/\n+/)
    .map((segment) => normalizeWhitespace(segment))
    .filter((segment) => segment.length >= 3 && segment.length <= 160)
    .slice(0, 120);
}

export function extractSourceDocumentContent(
  url: string,
  html: string,
): SourceDocumentContent {
  const metadata = extractMetadata(html);
  const visibleTextSegments = extractVisibleTextSegments(html);
  const visibleText = normalizeWhitespace(visibleTextSegments.join(" "));
  const structuredData = extractStructuredData(html);

  return {
    url,
    metadata,
    visibleText,
    visibleTextSegments,
    structuredData,
  };
}
