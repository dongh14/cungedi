export type WebsiteMetadataFields = {
  title: string | null;
  description: string | null;
  ogTitle: string | null;
  ogDescription: string | null;
  ogImage: string | null;
};

export type WebsiteExtractionInput = {
  html?: string;
  metadata?: Partial<WebsiteMetadataFields>;
  title?: string | null;
  description?: string | null;
  ogTitle?: string | null;
  ogDescription?: string | null;
  ogImage?: string | null;
  structuredData?: unknown;
};

export type WebsiteStructuredData = {
  types: string[];
  name: string | null;
  description: string | null;
  category: string | null;
  address: string | null;
  city?: string | null;
  country?: string | null;
  district?: string | null;
  phone: string | null;
  websiteUrl: string | null;
  imageUrl: string | null;
};

export type ParsedWebsiteMetadata = {
  metadata: WebsiteMetadataFields;
  structuredData: WebsiteStructuredData[];
};

import { findKnownDistrictInText, normalizeDistrictName } from "../location.ts";

const supportedSchemaTypes = new Set([
  "restaurant",
  "localbusiness",
  "hotel",
  "touristattraction",
  "store",
]);

function normalizeWhitespace(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function decodeHtmlEntities(value: string) {
  return value
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
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

function normalizeString(value: unknown) {
  return typeof value === "string"
    ? normalizeWhitespace(decodeHtmlEntities(value)) || null
    : null;
}

function getAttribute(tag: string, attributeName: string) {
  const quotedMatch = tag.match(
    new RegExp(`${attributeName}\\s*=\\s*["']([^"']*)["']`, "i"),
  );

  if (quotedMatch?.[1]) {
    return quotedMatch[1];
  }

  const unquotedMatch = tag.match(
    new RegExp(`${attributeName}\\s*=\\s*([^\\s>]+)`, "i"),
  );

  return unquotedMatch?.[1] ?? null;
}

function getMetaValue(
  html: string,
  attributeName: "name" | "property",
  attributeValue: string,
) {
  const metaTags = html.match(/<meta\b[^>]*>/gi) ?? [];

  for (const metaTag of metaTags) {
    const attribute = getAttribute(metaTag, attributeName);

    if (!attribute || attribute.toLowerCase() !== attributeValue.toLowerCase()) {
      continue;
    }

    const content = getAttribute(metaTag, "content");

    if (content) {
      return normalizeString(content);
    }
  }

  return null;
}

function parseHtmlMetadata(html: string): WebsiteMetadataFields {
  const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);

  return {
    title: titleMatch?.[1] ? normalizeString(titleMatch[1]) : null,
    description: getMetaValue(html, "name", "description"),
    ogTitle: getMetaValue(html, "property", "og:title"),
    ogDescription: getMetaValue(html, "property", "og:description"),
    ogImage: getMetaValue(html, "property", "og:image"),
  };
}

function flattenStructuredData(value: unknown): Record<string, unknown>[] {
  if (typeof value === "string") {
    try {
      return flattenStructuredData(JSON.parse(value));
    } catch {
      return [];
    }
  }

  if (Array.isArray(value)) {
    return value.flatMap((entry) => flattenStructuredData(entry));
  }

  if (!value || typeof value !== "object") {
    return [];
  }

  const record = value as Record<string, unknown>;

  if (Array.isArray(record["@graph"])) {
    return record["@graph"].flatMap((entry) => flattenStructuredData(entry));
  }

  return [record];
}

function normalizeSchemaTypes(value: unknown) {
  const values = Array.isArray(value) ? value : [value];

  return values
    .map((entry) => normalizeString(entry)?.replace(/^https?:\/\/schema\.org\//i, "").toLowerCase())
    .filter((entry): entry is string => Boolean(entry));
}

function getAddress(value: unknown) {
  const directValue = normalizeString(value);

  if (directValue) {
    return directValue;
  }

  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  const record = value as Record<string, unknown>;
  const parts = [
    record.streetAddress,
    record.addressLocality,
    record.addressRegion,
    record.postalCode,
    record.addressCountry,
  ]
    .map(normalizeString)
    .filter((part): part is string => Boolean(part));

  return parts.length > 0 ? parts.join(", ") : null;
}

function getAddressPart(value: unknown, key: "addressLocality" | "addressCountry") {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  return normalizeString((value as Record<string, unknown>)[key]);
}

function getDistrictPart(value: unknown, city: string | null) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  const record = value as Record<string, unknown>;
  const region = normalizeString(record.addressRegion);
  const locality = normalizeString(record.addressLocality);

  return normalizeDistrictName(region)
    ?? normalizeDistrictName(locality)
    ?? findKnownDistrictInText([region, locality].filter(Boolean).join(" "), city);
}

function getImageUrl(value: unknown): string | null {
  const directValue = normalizeString(value);

  if (directValue) {
    return directValue;
  }

  if (Array.isArray(value)) {
    for (const entry of value) {
      const imageUrl = getImageUrl(entry);

      if (imageUrl) {
        return imageUrl;
      }
    }

    return null;
  }

  if (!value || typeof value !== "object") {
    return null;
  }

  const record = value as Record<string, unknown>;

  return getImageUrl(record.url) ?? getImageUrl(record.contentUrl);
}

function getStructuredDataFromHtml(html: string) {
  const scripts = html.match(
    /<script\b[^>]*type\s*=\s*["']application\/ld\+json["'][^>]*>[\s\S]*?<\/script>/gi,
  ) ?? [];

  return scripts.flatMap((script) => {
    const content = script.match(/>([\s\S]*?)<\/script>/i)?.[1];

    if (!content) {
      return [];
    }

    try {
      return flattenStructuredData(JSON.parse(content.trim()));
    } catch {
      return [];
    }
  });
}

function toSupportedStructuredData(value: unknown): WebsiteStructuredData[] {
  return flattenStructuredData(value).flatMap((record) => {
    const types = normalizeSchemaTypes(record["@type"]);
    const supportedTypes = types.filter((type) => supportedSchemaTypes.has(type));

    if (supportedTypes.length === 0) {
      return [];
    }

    const category = normalizeString(record.category) ?? supportedTypes[0];

    const city = getAddressPart(record.address, "addressLocality");
    const district = getDistrictPart(record.address, city);

    return [
      {
        types: supportedTypes,
        name: normalizeString(record.name),
        description: normalizeString(record.description),
        category,
        address: getAddress(record.address),
        city,
        country: getAddressPart(record.address, "addressCountry"),
        ...(district ? { district } : {}),
        phone: normalizeString(record.telephone),
        websiteUrl: normalizeString(record.url),
        imageUrl: getImageUrl(record.image),
      },
    ];
  });
}

export function parseWebsiteMetadata(input: string | WebsiteExtractionInput): ParsedWebsiteMetadata {
  const source = typeof input === "string" ? { html: input } : input;
  const htmlMetadata = source.html ? parseHtmlMetadata(source.html) : null;
  const explicitMetadata = source.metadata ?? source;
  const metadata: WebsiteMetadataFields = {
    title: normalizeString(explicitMetadata.title) ?? htmlMetadata?.title ?? null,
    description:
      normalizeString(explicitMetadata.description) ?? htmlMetadata?.description ?? null,
    ogTitle: normalizeString(explicitMetadata.ogTitle) ?? htmlMetadata?.ogTitle ?? null,
    ogDescription:
      normalizeString(explicitMetadata.ogDescription) ?? htmlMetadata?.ogDescription ?? null,
    ogImage: normalizeString(explicitMetadata.ogImage) ?? htmlMetadata?.ogImage ?? null,
  };
  const structuredData = source.structuredData ?? (source.html ? getStructuredDataFromHtml(source.html) : []);

  return {
    metadata,
    structuredData: toSupportedStructuredData(structuredData),
  };
}
