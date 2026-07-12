import { inferAccommodationSubtype, hasAccommodationStructuredType } from "./accommodation-inference";
import { inferAttractionSubtype, hasAttractionStructuredType } from "./attraction-inference";
import { inferCuisineFromSourceContent } from "./cuisine-inference";
import { defaultRestaurantCategory } from "./constants";
import {
  inferEntertainmentSubtype,
  hasEntertainmentStructuredType,
} from "./entertainment-inference";
import {
  hasGenericPlaceStructuredType,
  hasOnlyGenericPlaceStructuredType,
  inferGenericPlaceSubtype,
} from "./generic-place-inference";
import {
  buildEmptyField,
  formatStructuredAddress,
  validateAddress,
  validateCity,
  validateCuisine,
  validateRestaurantName,
} from "./field-validation";
import { classifyRestaurantPageType } from "./page-type";
import {
  inferShoppingSubtype,
  hasShoppingStructuredType,
  hasStrongShoppingStructuredType,
} from "./shopping-inference";
import type {
  ExtractedRestaurantField,
  RestaurantExtractionCandidate,
  RestaurantExtractionDiagnostics,
  RestaurantExtractionResult,
  RestaurantFieldConfidence,
  RestaurantFieldEvidenceSource,
  RestaurantPageType,
  RestaurantSourceKind,
  StructuredDataNode,
} from "./extraction-types";
import { classifyRestaurantSource, getSourceSupportLevel } from "./source-classification";
import { fetchSourceDocument } from "./source-fetch";
import { extractSourceDocumentContent } from "./source-html";

type ExtractRestaurantCandidateOptions = {
  fetchImpl?: typeof fetch;
};

type FieldProposal = {
  value: string | null;
  confidence: RestaurantFieldConfidence;
  evidenceSource: RestaurantFieldEvidenceSource;
};

type CandidateFieldKey = "name" | "city" | "address" | "cuisine";
type ExtractionCategory = "美食" | "住宿" | "景点" | "购物" | "玩乐" | "其他";

const relevantStructuredTypes = new Set([
  "place",
  "restaurant",
  "localbusiness",
  "foodestablishment",
  "cafeorcoffeeshop",
  "barorpub",
  "bakery",
  "fastfoodrestaurant",
  "icecreamshop",
  "hotel",
  "lodgingbusiness",
  "resort",
  "motel",
  "campground",
  "hostel",
  "touristattraction",
  "museum",
  "park",
  "landmarksorhistoricalbuildings",
  "zoo",
  "aquarium",
  "store",
  "shoppingcenter",
  "bookstore",
  "clothingstore",
  "grocerystore",
  "conveniencestore",
  "departmentstore",
  "homegoodsstore",
  "electronicsstore",
  "beautysalon",
  "healthandbeautybusiness",
  "entertainmentbusiness",
  "movietheater",
  "nightclub",
  "bowlingalley",
  "amusementpark",
  "sportsactivitylocation",
  "performingartstheater",
  "eventvenue",
]);
const restaurantStructuredTypes = new Set([
  "restaurant",
  "localbusiness",
  "foodestablishment",
  "cafeorcoffeeshop",
  "barorpub",
  "bakery",
  "fastfoodrestaurant",
  "icecreamshop",
]);

const restaurantKeywordPattern =
  /(restaurant|bistro|cafe|café|coffee|brunch|dining|eatery|kitchen|bar|ramen|noodle|pizza|sushi|hot pot|steakhouse|omakase|chef|tasting|火锅|咖啡|餐厅|酒馆|面馆|寿司|烤肉|甜品)/i;
const genericFallbackNamePattern =
  /\b(locations?|menu|home|restaurants?|contact|about|order online|gift cards?|newsletter|careers|privacy)\b/i;
const addressPattern =
  /(?:路|街|道|大道|巷|号|广场|商场|里|弄|floor|fl\.|street|\bst\b|road|\brd\b|avenue|\bave\b|boulevard|\bblvd\b|lane|\bln\b|drive|\bdr\b|suite|\bste\b|building|\bbldg\b|plaza|center|centre)/i;
const cityStateZipPattern =
  /\b[a-z .'-]+,\s*[A-Z]{2}\s+\d{5}(?:-\d{4})?\b/;
const noisyContentPattern =
  /\b(newsletter|subscribe|privacy|cookie|terms|careers|gift card|sign up|follow us|order online|book now|reserve now|view menu)\b/i;
const addressLabelPattern = /\b(address|location|visit us|find us|contact)\b/i;
const likelyContactHeadingPattern =
  /\b(contact|location|find us|visit us|get here|hours & location|our location)\b/i;
const likelyAddressSnippetPattern =
  /([A-Za-z0-9#.,'\- ]{4,80}(?:street|\bst\b|road|\brd\b|avenue|\bave\b|boulevard|\bblvd\b|lane|\bln\b|drive|\bdr\b|plaza|place|suite|\bste\b|floor|\bfl\b)[A-Za-z0-9#.,'\- ]{0,40}(?:,\s*[A-Za-z .'-]+,\s*[A-Z]{2}\s+\d{5}(?:-\d{4})?)?)/i;
const chineseAddressSnippetPattern =
  /([\u4e00-\u9fa5A-Za-z0-9#（）()\- ]{3,40}(?:路|街|道|大道|巷|弄|号)[\u4e00-\u9fa5A-Za-z0-9#（）()\- ]{0,30})/;
const labeledAddressSnippetPattern =
  /(?:located at|address[:：]?|location[:：]?|visit us at)\s*([^.!?。！？]{6,100})/i;
const accommodationListPattern =
  /\b(hotels|resorts|lodgings|accommodations|hostels|our hotels|our resorts|all hotels|find a hotel|hotel directory)\b/i;
const accommodationKeywordPattern =
  /\b(hotel|hostel|motel|resort|lodging|campground|homestay|guesthouse|inn|suites?|apartment|villa)\b/i;
const attractionListPattern =
  /\b(attractions|things to do|places to visit|our parks|our museums|museum guide|park guide|visitor guide|exhibitions)\b/i;
const attractionKeywordPattern =
  /\b(museum|park|zoo|aquarium|temple|shrine|landmark|attraction|historic site|old town|beach|mountain)\b/i;
const shoppingListPattern =
  /\b(stores|shopping|shop directory|store directory|our stores|find a store|locations|brands|search results|category page|mall directory)\b/i;
const shoppingKeywordPattern =
  /\b(store|shop|shopping|mall|bookstore|clothing|grocery|supermarket|convenience store|department store|home goods|electronics|beauty)\b/i;
const entertainmentListPattern =
  /\b(events|event listings|upcoming events|calendar|showtimes|venues|things to do|our venues|schedule|lineup|all venues)\b/i;
const entertainmentKeywordPattern =
  /\b(cinema|movie theater|nightclub|club|bowling|amusement park|theme park|sports venue|stadium|arena|theater|theatre|event venue|karaoke|ktv|escape room|board game|exhibition|concert|live house|bar)\b/i;

const knownCities = [
  { city: "上海", patterns: ["上海", "上海市", "shanghai"] },
  { city: "北京", patterns: ["北京", "北京市", "beijing"] },
  { city: "广州", patterns: ["广州", "广州市", "guangzhou"] },
  { city: "深圳", patterns: ["深圳", "深圳市", "shenzhen"] },
  { city: "杭州", patterns: ["杭州", "杭州市", "hangzhou"] },
  { city: "成都", patterns: ["成都", "成都市", "chengdu"] },
  { city: "南京", patterns: ["南京", "南京市", "nanjing"] },
  { city: "苏州", patterns: ["苏州", "苏州市", "suzhou"] },
  { city: "重庆", patterns: ["重庆", "chongqing"] },
  { city: "武汉", patterns: ["武汉", "武汉市", "wuhan"] },
  { city: "西安", patterns: ["西安", "西安市", "xian", "xi'an"] },
  { city: "长沙", patterns: ["长沙", "长沙市", "changsha"] },
  { city: "青岛", patterns: ["青岛", "青岛市", "qingdao"] },
  { city: "厦门", patterns: ["厦门", "厦门市", "xiamen"] },
  { city: "香港", patterns: ["香港", "hong kong"] },
  { city: "东京", patterns: ["东京", "tokyo"] },
  { city: "首尔", patterns: ["首尔", "seoul"] },
  { city: "曼谷", patterns: ["曼谷", "bangkok"] },
  { city: "新加坡", patterns: ["新加坡", "singapore"] },
  { city: "巴黎", patterns: ["巴黎", "paris"] },
  { city: "伦敦", patterns: ["伦敦", "london"] },
  { city: "纽约", patterns: ["纽约", "new york"] },
  { city: "洛杉矶", patterns: ["洛杉矶", "los angeles"] },
];

function normalizeWhitespace(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function cleanRestaurantName(value: string, sourceKind: RestaurantSourceKind) {
  let cleanedValue = normalizeWhitespace(value)
    .replace(/^[「『“"'《【]+/, "")
    .replace(/[」』”"'》】]+$/, "");

  const suffixPatterns = [
    /\s*[-|·•]\s*Google Maps$/i,
    /\s*[-|·•]\s*Google 地图$/i,
    /\s*[-|·•]\s*小红书$/i,
    /\s*[-|·•]\s*抖音$/i,
    /\s*[-|·•]\s*Douyin$/i,
  ];

  for (const pattern of suffixPatterns) {
    cleanedValue = cleanedValue.replace(pattern, "");
  }

  if (sourceKind === "google-maps") {
    cleanedValue = cleanedValue.split(/\s[-|·•]\s/)[0] ?? cleanedValue;
  }

  return normalizeWhitespace(cleanedValue);
}

function splitIntoSegments(value: string) {
  return value
    .split(/[|｜·•\n]/)
    .map((segment) => normalizeWhitespace(segment))
    .filter(Boolean);
}

function relevantStructuredNodes(nodes: StructuredDataNode[]) {
  return nodes.filter((node) => node.types.some((type) => relevantStructuredTypes.has(type)));
}

function restaurantStructuredNodes(nodes: StructuredDataNode[]) {
  return nodes.filter((node) => node.types.some((type) => restaurantStructuredTypes.has(type)));
}

function accommodationStructuredNodes(nodes: StructuredDataNode[]) {
  return nodes.filter(hasAccommodationStructuredType);
}

function attractionStructuredNodes(nodes: StructuredDataNode[]) {
  return nodes.filter(hasAttractionStructuredType);
}

function shoppingStructuredNodes(nodes: StructuredDataNode[]) {
  return nodes.filter(hasShoppingStructuredType);
}

function entertainmentStructuredNodes(nodes: StructuredDataNode[]) {
  return nodes.filter(hasEntertainmentStructuredType);
}

function genericPlaceStructuredNodes(nodes: StructuredDataNode[]) {
  return nodes.filter(hasGenericPlaceStructuredType);
}

function extractCity(value: string | null) {
  if (!value) {
    return null;
  }

  const normalizedValue = value.toLowerCase();

  for (const city of knownCities) {
    if (city.patterns.some((pattern) => normalizedValue.includes(pattern.toLowerCase()))) {
      return city.city;
    }
  }

  const chineseCityMatch = value.match(/([\u4e00-\u9fa5]{2,8})市/);

  if (chineseCityMatch?.[1]) {
    return chineseCityMatch[1];
  }

  const usCityMatch = value.match(/\b([A-Za-z .'-]+),\s*[A-Z]{2}\s+\d{5}(?:-\d{4})?\b/);

  if (usCityMatch?.[1]) {
    return normalizeWhitespace(usCityMatch[1]);
  }

  return null;
}

function createDiagnostics(input: {
  sourceKind: RestaurantSourceKind;
  finalFetchedUrl: string | null;
  httpStatus: number | null;
  contentType: string | null;
  pageType: RestaurantPageType;
  structuredNodes: StructuredDataNode[];
}): RestaurantExtractionDiagnostics {
  const structuredDataTypes = [...new Set(input.structuredNodes.flatMap((node) => node.types))];

  return {
    finalFetchedUrl: input.finalFetchedUrl,
    sourceKind: input.sourceKind,
    httpStatus: input.httpStatus,
    contentType: input.contentType,
    pageType: input.pageType,
    structuredDataTypes,
    hasRestaurantOrLocalBusiness: input.structuredNodes.some((node) =>
      node.types.some((type) => type === "restaurant" || type === "localbusiness"),
    ),
    hasPostalAddress: input.structuredNodes.some(
      (node) => Boolean(node.address?.streetAddress || node.address?.addressLocality),
    ),
    hasRawGenericPlaceEvidence: false,
    hasGenericPlaceEvidence: false,
    finalCategory: null,
    fallbackReason: null,
    acceptedFieldEvidence: {},
    rejectedFieldCandidates: [],
    finalDecision: "",
  };
}

function recordRejectedProposal(
  diagnostics: RestaurantExtractionDiagnostics,
  field: CandidateFieldKey,
  proposal: FieldProposal,
  rejectionReason: string | null | undefined,
) {
  if (!proposal.value || !rejectionReason) {
    return;
  }

  diagnostics.rejectedFieldCandidates.push({
    field,
    value: proposal.value,
    evidenceSource: proposal.evidenceSource,
    reason: rejectionReason,
  });
}

function pickStructuredNode(nodes: StructuredDataNode[]) {
  return (
    nodes.find(
      (node) =>
        Boolean(node.name) &&
        (Boolean(node.address?.streetAddress) || Boolean(node.address?.addressLocality)),
    ) ??
    nodes.find((node) => Boolean(node.name)) ??
    null
  );
}

function pickAccommodationStructuredNode(nodes: StructuredDataNode[]) {
  return (
    nodes.find(
      (node) =>
        hasAccommodationStructuredType(node) &&
        Boolean(node.name) &&
        (Boolean(node.address?.streetAddress) || Boolean(node.address?.addressLocality)),
    ) ??
    nodes.find((node) => hasAccommodationStructuredType(node) && Boolean(node.name)) ??
    null
  );
}

function pickAttractionStructuredNode(nodes: StructuredDataNode[]) {
  return (
    nodes.find(
      (node) =>
        hasAttractionStructuredType(node) &&
        Boolean(node.name) &&
        (Boolean(node.address?.streetAddress) || Boolean(node.address?.addressLocality)),
    ) ??
    nodes.find((node) => hasAttractionStructuredType(node) && Boolean(node.name)) ??
    null
  );
}

function pickShoppingStructuredNode(nodes: StructuredDataNode[]) {
  return (
    nodes.find(
      (node) =>
        hasStrongShoppingStructuredType(node) &&
        Boolean(node.name) &&
        (Boolean(node.address?.streetAddress) || Boolean(node.address?.addressLocality)),
    ) ??
    nodes.find((node) => hasStrongShoppingStructuredType(node) && Boolean(node.name)) ??
    null
  );
}

function pickEntertainmentStructuredNode(nodes: StructuredDataNode[]) {
  return (
    nodes.find(
      (node) =>
        hasEntertainmentStructuredType(node) &&
        Boolean(node.name) &&
        (Boolean(node.address?.streetAddress) || Boolean(node.address?.addressLocality)),
    ) ??
    nodes.find((node) => hasEntertainmentStructuredType(node) && Boolean(node.name)) ??
    null
  );
}

function pickGenericPlaceStructuredNode(nodes: StructuredDataNode[]) {
  return (
    nodes.find(
      (node) =>
        hasOnlyGenericPlaceStructuredType(node) &&
        Boolean(node.name) &&
        (Boolean(node.address?.streetAddress) || Boolean(node.address?.addressLocality)),
    ) ??
    nodes.find((node) => hasOnlyGenericPlaceStructuredType(node) && Boolean(node.name)) ??
    null
  );
}

function hasStrongRestaurantStructuredEvidence(nodes: StructuredDataNode[]) {
  return restaurantStructuredNodes(nodes).some(
    (node) =>
      node.types.some((type) => type !== "localbusiness") &&
      Boolean(node.name),
  );
}

function hasStrongAccommodationStructuredEvidence(nodes: StructuredDataNode[]) {
  return accommodationStructuredNodes(nodes).some((node) => Boolean(node.name));
}

function hasStrongAttractionStructuredEvidence(nodes: StructuredDataNode[]) {
  return attractionStructuredNodes(nodes).some((node) => Boolean(node.name));
}

function hasStrongShoppingStructuredEvidence(nodes: StructuredDataNode[]) {
  return shoppingStructuredNodes(nodes).some(
    (node) => Boolean(node.name) && hasStrongShoppingStructuredType(node),
  );
}

function hasStrongEntertainmentStructuredEvidence(nodes: StructuredDataNode[]) {
  return entertainmentStructuredNodes(nodes).some((node) => Boolean(node.name));
}

function hasRawGenericPlaceCategoryEvidence(nodes: StructuredDataNode[]) {
  return genericPlaceStructuredNodes(nodes).some(
    (node) => hasOnlyGenericPlaceStructuredType(node) && Boolean(node.name),
  );
}

function hasRestaurantCategorySignals(input: {
  nodes: StructuredDataNode[];
  title: string | null;
  description: string | null;
  ogTitle: string | null;
  ogDescription: string | null;
}) {
  if (input.nodes.some((node) => node.servesCuisine.length > 0)) {
    return true;
  }

  const text = [
    input.ogTitle,
    input.title,
    input.ogDescription,
    input.description,
  ]
    .filter(Boolean)
    .join(" ");

  if (restaurantKeywordPattern.test(text)) {
    return true;
  }

  const inferredCuisine = inferCuisineFromSourceContent({
    title: input.ogTitle ?? input.title,
    description: input.ogDescription ?? input.description,
    visibleText: "",
  });

  return Boolean(inferredCuisine.cuisine);
}

function determineExtractionCategory(input: {
  nodes: StructuredDataNode[];
  title: string | null;
  description: string | null;
  ogTitle: string | null;
  ogDescription: string | null;
  visibleTextSegments: string[];
}) {
  const hasRestaurantEvidence = hasStrongRestaurantStructuredEvidence(input.nodes);
  const hasAccommodationEvidence = hasStrongAccommodationStructuredEvidence(input.nodes);
  const hasAttractionEvidence = hasStrongAttractionStructuredEvidence(input.nodes);
  const hasShoppingEvidence = hasStrongShoppingStructuredEvidence(input.nodes);
  const hasEntertainmentEvidence = hasStrongEntertainmentStructuredEvidence(input.nodes);
  const hasRawGenericPlaceEvidence = hasRawGenericPlaceCategoryEvidence(input.nodes);
  const hasGenericPlaceEvidence =
    hasRawGenericPlaceEvidence &&
    !hasRestaurantCategorySignals({
      nodes: input.nodes,
      title: input.title,
      description: input.description,
      ogTitle: input.ogTitle,
      ogDescription: input.ogDescription,
    });
  const strongCategoryCount = [
    hasRestaurantEvidence,
    hasAccommodationEvidence,
    hasAttractionEvidence,
    hasShoppingEvidence,
    hasEntertainmentEvidence,
    hasRawGenericPlaceEvidence,
  ].filter(Boolean).length;

  if (strongCategoryCount >= 2) {
    return "ambiguous" as const;
  }

  if (hasAttractionEvidence) {
    return "景点" as const;
  }

  if (hasEntertainmentEvidence) {
    return "玩乐" as const;
  }

  if (hasShoppingEvidence) {
    return "购物" as const;
  }

  if (hasAccommodationEvidence) {
    return "住宿" as const;
  }

  if (hasGenericPlaceEvidence) {
    return "其他" as const;
  }

  return "美食" as const;
}

function hasOnlyGenericPlaceSignals(nodes: StructuredDataNode[]) {
  return (
    nodes.length > 0 &&
    nodes.some((node) => hasOnlyGenericPlaceStructuredType(node)) &&
    nodes.every((node) => hasOnlyGenericPlaceStructuredType(node))
  );
}

function looksLikeAccommodationWithoutStrongStructuredData(input: {
  title: string | null;
  description: string | null;
  ogTitle: string | null;
  ogDescription: string | null;
  structuredNodes: StructuredDataNode[];
}) {
  if (!hasOnlyGenericPlaceSignals(input.structuredNodes)) {
    return false;
  }

  const headlineText = [input.ogTitle, input.title, input.ogDescription, input.description]
    .filter(Boolean)
    .join(" ");

  return accommodationKeywordPattern.test(headlineText);
}

function looksLikeAttractionWithoutStrongStructuredData(input: {
  title: string | null;
  description: string | null;
  ogTitle: string | null;
  ogDescription: string | null;
  structuredNodes: StructuredDataNode[];
}) {
  if (!hasOnlyGenericPlaceSignals(input.structuredNodes)) {
    return false;
  }

  const headlineText = [input.ogTitle, input.title, input.ogDescription, input.description]
    .filter(Boolean)
    .join(" ");

  return attractionKeywordPattern.test(headlineText);
}

function looksLikeShoppingWithoutStrongStructuredData(input: {
  title: string | null;
  description: string | null;
  ogTitle: string | null;
  ogDescription: string | null;
  structuredNodes: StructuredDataNode[];
}) {
  if (!hasOnlyGenericPlaceSignals(input.structuredNodes)) {
    return false;
  }

  const headlineText = [input.ogTitle, input.title, input.ogDescription, input.description]
    .filter(Boolean)
    .join(" ");

  return shoppingKeywordPattern.test(headlineText);
}

function looksLikeEntertainmentWithoutStrongStructuredData(input: {
  title: string | null;
  description: string | null;
  ogTitle: string | null;
  ogDescription: string | null;
  structuredNodes: StructuredDataNode[];
  visibleTextSegments: string[];
}) {
  if (!hasOnlyGenericPlaceSignals(input.structuredNodes)) {
    return false;
  }

  const headlineText = [
    input.ogTitle,
    input.title,
    input.ogDescription,
    input.description,
    ...input.visibleTextSegments.slice(0, 12),
  ]
    .filter(Boolean)
    .join(" ");

  return entertainmentKeywordPattern.test(headlineText);
}

function detectRestaurantSpecificHeuristic(input: {
  sourceKind: RestaurantSourceKind;
  title: string | null;
  description: string | null;
  ogTitle: string | null;
  ogDescription: string | null;
  structuredNodes: StructuredDataNode[];
}) {
  if (input.structuredNodes.length > 0) {
    return input.structuredNodes.some((node) =>
      node.types.some((type) => restaurantStructuredTypes.has(type)),
    );
  }

  if (input.sourceKind === "google-maps") {
    return false;
  }

  const headlineText = [
    input.ogTitle,
    input.title,
    input.ogDescription,
    input.description,
  ]
    .filter(Boolean)
    .join(" ");
  const descriptorText = [input.ogDescription, input.description].filter(Boolean).join(" ");

  const cleanedTitle = cleanRestaurantName(input.ogTitle ?? input.title ?? "", input.sourceKind);
  const validTitle = validateRestaurantName({
    value: cleanedTitle,
    confidence: "medium",
    evidenceSource: input.ogTitle ? "open_graph" : "page_title",
  });

  return (
    validTitle.accepted &&
    !genericFallbackNamePattern.test(cleanedTitle.toLowerCase()) &&
    restaurantKeywordPattern.test(headlineText) &&
    restaurantKeywordPattern.test(descriptorText)
  );
}

function determinePageType(input: {
  extractionCategory: ExtractionCategory;
  sourceKind: RestaurantSourceKind;
  title: string | null;
  description: string | null;
  ogTitle: string | null;
  ogDescription: string | null;
  structuredNodes: StructuredDataNode[];
  visibleTextSegments: string[];
}) {
  if (input.extractionCategory === "住宿") {
    const title = input.ogTitle ?? input.title ?? "";
    const description = input.ogDescription ?? input.description ?? "";
    const combinedHeadline = `${title} ${description}`.trim();
    const accommodationNodes = accommodationStructuredNodes(input.structuredNodes);
    const addressStructuredCount = accommodationNodes.filter(
      (node) => node.address?.streetAddress || node.address?.addressLocality,
    ).length;
    const locationSegmentCount = input.visibleTextSegments.filter((segment) =>
      /\b(locations?|find us|our hotels|our resorts|all hotels|hotel directory)\b/i.test(
        segment,
      ),
    ).length;

    if (
      accommodationNodes.length >= 2 ||
      addressStructuredCount >= 2 ||
      locationSegmentCount >= 2
    ) {
      return "restaurant_list" satisfies RestaurantPageType;
    }

    if (accommodationListPattern.test(combinedHeadline) && accommodationNodes.length !== 1) {
      return "restaurant_list" satisfies RestaurantPageType;
    }

    if (accommodationNodes.length === 1) {
      return "single_restaurant" satisfies RestaurantPageType;
    }

    if (/\b(home|about|contact|newsletter|privacy|offers)\b/i.test(combinedHeadline)) {
      return "generic_page" satisfies RestaurantPageType;
    }

    return "unknown" satisfies RestaurantPageType;
  }

  if (input.extractionCategory === "景点") {
    const title = input.ogTitle ?? input.title ?? "";
    const description = input.ogDescription ?? input.description ?? "";
    const combinedHeadline = `${title} ${description}`.trim();
    const attractionNodes = attractionStructuredNodes(input.structuredNodes);
    const addressStructuredCount = attractionNodes.filter(
      (node) => node.address?.streetAddress || node.address?.addressLocality,
    ).length;
    const locationSegmentCount = input.visibleTextSegments.filter((segment) =>
      /\b(attractions|things to do|visitor guide|museum guide|park guide|our museums|our parks)\b/i.test(
        segment,
      ),
    ).length;

    if (
      attractionNodes.length >= 2 ||
      addressStructuredCount >= 2 ||
      locationSegmentCount >= 2
    ) {
      return "restaurant_list" satisfies RestaurantPageType;
    }

    if (attractionListPattern.test(combinedHeadline) && attractionNodes.length !== 1) {
      return "restaurant_list" satisfies RestaurantPageType;
    }

    if (attractionNodes.length === 1) {
      return "single_restaurant" satisfies RestaurantPageType;
    }

    if (/\b(home|about|contact|newsletter|privacy|travel guide|blog|itinerary)\b/i.test(combinedHeadline)) {
      return "generic_page" satisfies RestaurantPageType;
    }

    return "unknown" satisfies RestaurantPageType;
  }

  if (input.extractionCategory === "购物") {
    const title = input.ogTitle ?? input.title ?? "";
    const description = input.ogDescription ?? input.description ?? "";
    const combinedHeadline = `${title} ${description}`.trim();
    const shoppingNodes = shoppingStructuredNodes(input.structuredNodes);
    const addressStructuredCount = shoppingNodes.filter(
      (node) => node.address?.streetAddress || node.address?.addressLocality,
    ).length;
    const locationSegmentCount = input.visibleTextSegments.filter((segment) =>
      /\b(stores|shopping|find a store|our stores|mall directory|search results|brands|locations)\b/i.test(
        segment,
      ),
    ).length;

    if (shoppingNodes.length >= 2 || addressStructuredCount >= 2 || locationSegmentCount >= 2) {
      return "restaurant_list" satisfies RestaurantPageType;
    }

    if (shoppingListPattern.test(combinedHeadline) && shoppingNodes.length !== 1) {
      return "restaurant_list" satisfies RestaurantPageType;
    }

    if (shoppingNodes.length === 1) {
      return "single_restaurant" satisfies RestaurantPageType;
    }

    if (/\b(home|about|contact|newsletter|privacy|brand directory|catalog|search)\b/i.test(combinedHeadline)) {
      return "generic_page" satisfies RestaurantPageType;
    }

    return "unknown" satisfies RestaurantPageType;
  }

  if (input.extractionCategory === "玩乐") {
    const title = input.ogTitle ?? input.title ?? "";
    const description = input.ogDescription ?? input.description ?? "";
    const combinedHeadline = `${title} ${description}`.trim();
    const entertainmentNodes = entertainmentStructuredNodes(input.structuredNodes);
    const addressStructuredCount = entertainmentNodes.filter(
      (node) => node.address?.streetAddress || node.address?.addressLocality,
    ).length;
    const locationSegmentCount = input.visibleTextSegments.filter((segment) =>
      /\b(events|event listings|upcoming events|calendar|showtimes|venues|our venues|schedule|lineup)\b/i.test(
        segment,
      ),
    ).length;

    if (
      entertainmentNodes.length >= 2 ||
      addressStructuredCount >= 2 ||
      locationSegmentCount >= 2
    ) {
      return "restaurant_list" satisfies RestaurantPageType;
    }

    if (entertainmentListPattern.test(combinedHeadline) && entertainmentNodes.length !== 1) {
      return "restaurant_list" satisfies RestaurantPageType;
    }

    if (
      entertainmentNodes.length === 1 &&
      !/\b(showtimes|calendar|lineup|schedule|upcoming events)\b/i.test(combinedHeadline)
    ) {
      return "single_restaurant" satisfies RestaurantPageType;
    }

    if (/\b(home|about|contact|newsletter|privacy|events calendar|show schedule|program)\b/i.test(combinedHeadline)) {
      return "generic_page" satisfies RestaurantPageType;
    }

    return "unknown" satisfies RestaurantPageType;
  }

  if (input.extractionCategory === "其他") {
    const title = input.ogTitle ?? input.title ?? "";
    const description = input.ogDescription ?? input.description ?? "";
    const combinedHeadline = `${title} ${description}`.trim();
    const genericNodes = genericPlaceStructuredNodes(input.structuredNodes).filter(
      hasOnlyGenericPlaceStructuredType,
    );
    const addressStructuredCount = genericNodes.filter(
      (node) => node.address?.streetAddress || node.address?.addressLocality,
    ).length;
    const locationSegmentCount = input.visibleTextSegments.filter((segment) =>
      /\b(locations|directory|find us|our offices|our branches|all locations|campuses|branches)\b/i.test(
        segment,
      ),
    ).length;

    if (
      genericNodes.length >= 2 ||
      addressStructuredCount >= 2 ||
      locationSegmentCount >= 2
    ) {
      return "restaurant_list" satisfies RestaurantPageType;
    }

    if (
      /\b(locations|directory|find us|our offices|our branches|all locations|campuses|branches)\b/i.test(
        combinedHeadline,
      ) &&
      genericNodes.length !== 1
    ) {
      return "restaurant_list" satisfies RestaurantPageType;
    }

    if (genericNodes.length === 1) {
      return "single_restaurant" satisfies RestaurantPageType;
    }

    if (/\b(home|about|contact|newsletter|privacy|services|company)\b/i.test(combinedHeadline)) {
      return "generic_page" satisfies RestaurantPageType;
    }

    return "unknown" satisfies RestaurantPageType;
  }

  const initialPageType = classifyRestaurantPageType({
    sourceKind: input.sourceKind,
    title: input.ogTitle ?? input.title,
    description: input.ogDescription ?? input.description,
    structuredData: input.structuredNodes,
    visibleTextSegments: input.visibleTextSegments,
  });

  if (
    initialPageType === "unknown" &&
    detectRestaurantSpecificHeuristic({
      sourceKind: input.sourceKind,
      title: input.title,
      description: input.description,
      ogTitle: input.ogTitle,
      ogDescription: input.ogDescription,
      structuredNodes: input.structuredNodes,
    })
  ) {
    return "single_restaurant" satisfies RestaurantPageType;
  }

  return initialPageType;
}

function evaluateProposals(
  field: CandidateFieldKey,
  proposals: FieldProposal[],
  diagnostics: RestaurantExtractionDiagnostics,
  validator: (proposal: FieldProposal) => ExtractedRestaurantField,
) {
  for (const proposal of proposals) {
    const validatedField = validator(proposal);

    if (validatedField.accepted) {
      diagnostics.acceptedFieldEvidence[field] = proposal.evidenceSource;
      return validatedField;
    }

    recordRejectedProposal(
      diagnostics,
      field,
      proposal,
      validatedField.rejectionReason ?? null,
    );
  }

  return buildEmptyField();
}

function extractAddressSnippetFromText(text: string) {
  if (!text || noisyContentPattern.test(text)) {
    return null;
  }

  const normalizedText = normalizeWhitespace(text);
  const labeledMatch = normalizedText.match(labeledAddressSnippetPattern);

  if (labeledMatch?.[1]) {
    return normalizeWhitespace(labeledMatch[1]);
  }

  const englishMatch = normalizedText.match(likelyAddressSnippetPattern);

  if (englishMatch?.[1]) {
    return normalizeWhitespace(englishMatch[1]);
  }

  const chineseMatch = normalizedText.match(chineseAddressSnippetPattern);

  if (chineseMatch?.[1]) {
    return normalizeWhitespace(chineseMatch[1]);
  }

  return null;
}

function extractAddressFromMetadataSegments(
  segments: string[],
  confidence: RestaurantFieldConfidence,
  evidenceSource: RestaurantFieldEvidenceSource,
) {
  const proposals: FieldProposal[] = [];

  for (const segment of segments) {
    if (!segment || segment.length > 160 || noisyContentPattern.test(segment)) {
      continue;
    }

    const extractedSnippet = extractAddressSnippetFromText(segment);

    if (extractedSnippet) {
      proposals.push({
        value: extractedSnippet,
        confidence,
        evidenceSource,
      });
      continue;
    }

    if (addressPattern.test(segment) || cityStateZipPattern.test(segment)) {
      proposals.push({
        value: segment,
        confidence,
        evidenceSource,
      });
    }
  }

  return proposals;
}

function extractAddressFromVisibleSections(segments: string[]) {
  const proposals: FieldProposal[] = [];

  for (let index = 0; index < segments.length; index += 1) {
    const segment = segments[index];

    if (segment.length > 120 || noisyContentPattern.test(segment)) {
      continue;
    }

    const nextSegment = segments[index + 1] ?? "";
    const nextNextSegment = segments[index + 2] ?? "";

    if (likelyContactHeadingPattern.test(segment)) {
      for (const candidate of [nextSegment, `${nextSegment}, ${nextNextSegment}`]) {
        const trimmedCandidate = normalizeWhitespace(candidate);

        if (!trimmedCandidate) {
          continue;
        }

        const extractedSnippet = extractAddressSnippetFromText(trimmedCandidate);

        if (extractedSnippet) {
          proposals.push({
            value: extractedSnippet,
            confidence: "low",
            evidenceSource: "visible_text",
          });
        }
      }

      continue;
    }

    if (addressLabelPattern.test(segment)) {
      const extractedSnippet = extractAddressSnippetFromText(nextSegment);

      if (extractedSnippet) {
        proposals.push({
          value: extractedSnippet,
          confidence: "low",
          evidenceSource: "visible_text",
        });
      }

      continue;
    }

    if (segment.length <= 80 && (addressPattern.test(segment) || cityStateZipPattern.test(segment))) {
      const combined = cityStateZipPattern.test(nextSegment)
        ? `${segment}, ${nextSegment}`
        : segment;

      const extractedSnippet = extractAddressSnippetFromText(combined) ?? segment;

      proposals.push({
        value: extractedSnippet,
        confidence: "low",
        evidenceSource: "visible_text",
      });
    }
  }

  return proposals;
}

function findNameField(
  input: {
    sourceKind: RestaurantSourceKind;
    structuredNode: StructuredDataNode | null;
    title: string | null;
    ogTitle: string | null;
  },
  diagnostics: RestaurantExtractionDiagnostics,
) {
  const proposals: FieldProposal[] = [];

  if (input.structuredNode?.name) {
    proposals.push({
      value: cleanRestaurantName(input.structuredNode.name, input.sourceKind),
      confidence: "high",
      evidenceSource: "structured_data",
    });
  }

  if (input.ogTitle) {
    proposals.push({
      value: cleanRestaurantName(input.ogTitle, input.sourceKind),
      confidence: "medium",
      evidenceSource: "open_graph",
    });
  }

  if (input.title) {
    for (const segment of splitIntoSegments(input.title)) {
      proposals.push({
        value: cleanRestaurantName(segment, input.sourceKind),
        confidence: "medium",
        evidenceSource: "page_title",
      });
    }
  }

  return evaluateProposals("name", proposals, diagnostics, validateRestaurantName);
}

function findAddressField(
  input: {
    pageType: RestaurantPageType;
    structuredNode: StructuredDataNode | null;
    ogDescription: string | null;
    description: string | null;
    visibleTextSegments: string[];
  },
  diagnostics: RestaurantExtractionDiagnostics,
) {
  const proposals: FieldProposal[] = [];
  const structuredAddress = formatStructuredAddress(input.structuredNode?.address ?? null);

  if (structuredAddress) {
    proposals.push({
      value: structuredAddress,
      confidence: "high",
      evidenceSource: "structured_data",
    });
  }

  proposals.push(
    ...extractAddressFromMetadataSegments(
      splitIntoSegments(input.ogDescription ?? ""),
      "medium",
      "open_graph",
    ),
  );
  proposals.push(
    ...extractAddressFromMetadataSegments(
      splitIntoSegments(input.description ?? ""),
      "medium",
      "meta_description",
    ),
  );

  if (input.pageType === "single_restaurant") {
    proposals.push(...extractAddressFromVisibleSections(input.visibleTextSegments.slice(0, 40)));
  }

  return evaluateProposals("address", proposals, diagnostics, validateAddress);
}

function findCityField(
  input: {
    structuredNode: StructuredDataNode | null;
    acceptedAddress: ExtractedRestaurantField;
    ogDescription: string | null;
    description: string | null;
  },
  diagnostics: RestaurantExtractionDiagnostics,
) {
  const proposals: FieldProposal[] = [];

  if (input.structuredNode?.address?.addressLocality) {
    proposals.push({
      value: input.structuredNode.address.addressLocality,
      confidence: "high",
      evidenceSource: "structured_data",
    });
  }

  if (input.acceptedAddress.accepted && input.acceptedAddress.value) {
    proposals.push({
      value: extractCity(input.acceptedAddress.value),
      confidence: "medium",
      evidenceSource: input.acceptedAddress.evidenceSource ?? "visible_text",
    });
  }

  for (const [value, evidenceSource] of [
    [input.ogDescription, "open_graph"],
    [input.description, "meta_description"],
  ] as const) {
    const city = extractCity(value);

    if (city) {
      proposals.push({
        value: city,
        confidence: "low",
        evidenceSource,
      });
    }
  }

  return evaluateProposals("city", proposals, diagnostics, validateCity);
}

function findCuisineField(
  input: {
    structuredNode: StructuredDataNode | null;
    title: string | null;
    description: string | null;
    ogTitle: string | null;
    ogDescription: string | null;
    visibleTextSegments: string[];
  },
  diagnostics: RestaurantExtractionDiagnostics,
) {
  const proposals: FieldProposal[] = [];

  if (input.structuredNode?.servesCuisine.length) {
    for (const cuisine of input.structuredNode.servesCuisine) {
      proposals.push({
        value: cuisine,
        confidence: "high",
        evidenceSource: "structured_data",
      });
    }
  }

  const inference = inferCuisineFromSourceContent({
    title: input.ogTitle ?? input.title,
    description: input.ogDescription ?? input.description,
    visibleText: input.visibleTextSegments.slice(0, 12).join(" "),
  });

  if (inference.cuisine) {
    const evidenceSource: RestaurantFieldEvidenceSource =
      input.ogDescription || input.description
        ? "meta_description"
        : input.ogTitle || input.title
          ? "page_title"
          : "visible_text";

    proposals.push({
      value: inference.cuisine,
      confidence: inference.isConfident
        ? evidenceSource === "visible_text"
          ? "low"
          : "medium"
        : "low",
      evidenceSource,
    });
  }

  return evaluateProposals("cuisine", proposals, diagnostics, validateCuisine);
}

function findAccommodationSubtypeField(
  input: {
    structuredNode: StructuredDataNode | null;
    title: string | null;
    description: string | null;
    ogTitle: string | null;
    ogDescription: string | null;
  },
  diagnostics: RestaurantExtractionDiagnostics,
) {
  const proposals = inferAccommodationSubtype(input);

  return evaluateProposals("cuisine", proposals, diagnostics, validateCuisine);
}

function findAttractionSubtypeField(
  input: {
    structuredNode: StructuredDataNode | null;
    title: string | null;
    description: string | null;
    ogTitle: string | null;
    ogDescription: string | null;
  },
  diagnostics: RestaurantExtractionDiagnostics,
) {
  const proposals = inferAttractionSubtype(input);

  return evaluateProposals("cuisine", proposals, diagnostics, validateCuisine);
}

function findShoppingSubtypeField(
  input: {
    structuredNode: StructuredDataNode | null;
    title: string | null;
    description: string | null;
    ogTitle: string | null;
    ogDescription: string | null;
  },
  diagnostics: RestaurantExtractionDiagnostics,
) {
  const proposals = inferShoppingSubtype(input);

  return evaluateProposals("cuisine", proposals, diagnostics, validateCuisine);
}

function findEntertainmentSubtypeField(
  input: {
    structuredNode: StructuredDataNode | null;
    title: string | null;
    description: string | null;
    ogTitle: string | null;
    ogDescription: string | null;
  },
  diagnostics: RestaurantExtractionDiagnostics,
) {
  const proposals = inferEntertainmentSubtype(input);

  return evaluateProposals("cuisine", proposals, diagnostics, validateCuisine);
}

function findGenericPlaceSubtypeField(
  input: {
    title: string | null;
    description: string | null;
    ogTitle: string | null;
    ogDescription: string | null;
  },
  diagnostics: RestaurantExtractionDiagnostics,
) {
  const proposals = inferGenericPlaceSubtype(input);

  return evaluateProposals("cuisine", proposals, diagnostics, validateCuisine);
}

function buildRestaurantCandidate(
  input: {
    sourceUrl: string;
    sourceKind: RestaurantSourceKind;
    pageType: RestaurantPageType;
    structuredNodes: StructuredDataNode[];
    title: string | null;
    description: string | null;
    ogTitle: string | null;
    ogDescription: string | null;
    visibleTextSegments: string[];
  },
  diagnostics: RestaurantExtractionDiagnostics,
) {
  const structuredNode = pickStructuredNode(input.structuredNodes);
  const name = findNameField(
    {
      sourceKind: input.sourceKind,
      structuredNode,
      title: input.title,
      ogTitle: input.ogTitle,
    },
    diagnostics,
  );
  const address = findAddressField(
    {
      pageType: input.pageType,
      structuredNode,
      ogDescription: input.ogDescription,
      description: input.description,
      visibleTextSegments: input.visibleTextSegments,
    },
    diagnostics,
  );
  const city = findCityField(
    {
      structuredNode,
      acceptedAddress: address,
      ogDescription: input.ogDescription,
      description: input.description,
    },
    diagnostics,
  );
  const cuisine = findCuisineField(
    {
      structuredNode,
      title: input.title,
      description: input.description,
      ogTitle: input.ogTitle,
      ogDescription: input.ogDescription,
      visibleTextSegments: input.visibleTextSegments,
    },
    diagnostics,
  );

  const candidate: RestaurantExtractionCandidate = {
    sourceUrl: input.sourceUrl,
    category: defaultRestaurantCategory,
    fields: {
      name,
      city,
      address,
      cuisine,
    },
  };

  const acceptanceReasons: string[] = [];
  const hasStructuredRestaurantEvidence = Boolean(
    structuredNode &&
      structuredNode.types.some((type) => restaurantStructuredTypes.has(type)) &&
      structuredNode.name,
  );
  const hasAcceptedSupportingField = address.accepted || city.accepted || cuisine.accepted;
  const hasRestaurantSpecificEvidence =
    hasStructuredRestaurantEvidence ||
    hasAcceptedSupportingField ||
    restaurantKeywordPattern.test(
      [input.ogDescription, input.description, input.ogTitle, input.title]
        .filter(Boolean)
        .join(" "),
    );
  const hasGoogleMapsUsableEvidence = hasStructuredRestaurantEvidence || hasAcceptedSupportingField;

  if (candidate.fields.name.accepted) {
    acceptanceReasons.push("餐厅名称通过了严格校验。");
  }

  if (hasStructuredRestaurantEvidence) {
    acceptanceReasons.push("页面存在结构化餐厅或本地商家数据。");
  }

  if (address.accepted) {
    acceptanceReasons.push("地址来源具备可接受的强地址证据。");
  }

  if (input.pageType === "single_restaurant") {
    acceptanceReasons.push("页面类型判定为单餐厅页。");
  }

  if (
    input.sourceKind === "google-maps" &&
    !hasGoogleMapsUsableEvidence &&
    candidate.fields.name.accepted
  ) {
    diagnostics.finalDecision = "fallback_google_maps_limited_fetch";

    return {
      candidate,
      acceptanceReasons,
      isAccepted: false,
    };
  }

  const isAccepted =
    input.pageType === "single_restaurant" &&
    candidate.fields.name.accepted &&
    hasRestaurantSpecificEvidence;

  diagnostics.finalDecision = isAccepted
    ? "accepted_single_restaurant_candidate"
    : "fallback_weak_or_non_single_page";

  return {
    candidate,
    acceptanceReasons,
    isAccepted,
  };
}

function buildAccommodationCandidate(
  input: {
    sourceUrl: string;
    sourceKind: RestaurantSourceKind;
    pageType: RestaurantPageType;
    structuredNodes: StructuredDataNode[];
    title: string | null;
    description: string | null;
    ogTitle: string | null;
    ogDescription: string | null;
    visibleTextSegments: string[];
  },
  diagnostics: RestaurantExtractionDiagnostics,
) {
  const structuredNode = pickAccommodationStructuredNode(input.structuredNodes);
  const name = findNameField(
    {
      sourceKind: input.sourceKind,
      structuredNode,
      title: input.title,
      ogTitle: input.ogTitle,
    },
    diagnostics,
  );
  const address = findAddressField(
    {
      pageType: input.pageType,
      structuredNode,
      ogDescription: input.ogDescription,
      description: input.description,
      visibleTextSegments: input.visibleTextSegments,
    },
    diagnostics,
  );
  const city = findCityField(
    {
      structuredNode,
      acceptedAddress: address,
      ogDescription: input.ogDescription,
      description: input.description,
    },
    diagnostics,
  );
  const cuisine = findAccommodationSubtypeField(
    {
      structuredNode,
      title: input.title,
      description: input.description,
      ogTitle: input.ogTitle,
      ogDescription: input.ogDescription,
    },
    diagnostics,
  );

  const candidate: RestaurantExtractionCandidate = {
    sourceUrl: input.sourceUrl,
    category: "住宿",
    fields: {
      name,
      city,
      address,
      cuisine,
    },
  };

  const hasStructuredAccommodationEvidence = Boolean(
    structuredNode &&
      hasAccommodationStructuredType(structuredNode) &&
      structuredNode.name,
  );
  const acceptanceReasons: string[] = [];

  if (candidate.fields.name.accepted) {
    acceptanceReasons.push("地点名称通过了严格校验。");
  }

  if (hasStructuredAccommodationEvidence) {
    acceptanceReasons.push("页面存在明确的住宿类结构化数据。");
  }

  if (address.accepted) {
    acceptanceReasons.push("地址来源具备可接受的强地址证据。");
  }

  if (input.pageType === "single_restaurant") {
    acceptanceReasons.push("页面类型判定为单地点页。");
  }

  const isAccepted =
    input.pageType === "single_restaurant" &&
    candidate.fields.name.accepted &&
    hasStructuredAccommodationEvidence;

  diagnostics.finalDecision = isAccepted
    ? "accepted_single_accommodation_candidate"
    : "fallback_weak_or_non_single_accommodation_page";

  return {
    candidate,
    acceptanceReasons,
    isAccepted,
  };
}

function buildAttractionCandidate(
  input: {
    sourceUrl: string;
    sourceKind: RestaurantSourceKind;
    pageType: RestaurantPageType;
    structuredNodes: StructuredDataNode[];
    title: string | null;
    description: string | null;
    ogTitle: string | null;
    ogDescription: string | null;
    visibleTextSegments: string[];
  },
  diagnostics: RestaurantExtractionDiagnostics,
) {
  const structuredNode = pickAttractionStructuredNode(input.structuredNodes);
  const name = findNameField(
    {
      sourceKind: input.sourceKind,
      structuredNode,
      title: input.title,
      ogTitle: input.ogTitle,
    },
    diagnostics,
  );
  const address = findAddressField(
    {
      pageType: input.pageType,
      structuredNode,
      ogDescription: input.ogDescription,
      description: input.description,
      visibleTextSegments: input.visibleTextSegments,
    },
    diagnostics,
  );
  const city = findCityField(
    {
      structuredNode,
      acceptedAddress: address,
      ogDescription: input.ogDescription,
      description: input.description,
    },
    diagnostics,
  );
  const cuisine = findAttractionSubtypeField(
    {
      structuredNode,
      title: input.title,
      description: input.description,
      ogTitle: input.ogTitle,
      ogDescription: input.ogDescription,
    },
    diagnostics,
  );

  const candidate: RestaurantExtractionCandidate = {
    sourceUrl: input.sourceUrl,
    category: "景点",
    fields: {
      name,
      city,
      address,
      cuisine,
    },
  };

  const hasStructuredAttractionEvidence = Boolean(
    structuredNode &&
      hasAttractionStructuredType(structuredNode) &&
      structuredNode.name,
  );
  const acceptanceReasons: string[] = [];

  if (candidate.fields.name.accepted) {
    acceptanceReasons.push("地点名称通过了严格校验。");
  }

  if (hasStructuredAttractionEvidence) {
    acceptanceReasons.push("页面存在明确的景点类结构化数据。");
  }

  if (address.accepted) {
    acceptanceReasons.push("地址来源具备可接受的强地址证据。");
  }

  if (input.pageType === "single_restaurant") {
    acceptanceReasons.push("页面类型判定为单地点页。");
  }

  const isAccepted =
    input.pageType === "single_restaurant" &&
    candidate.fields.name.accepted &&
    hasStructuredAttractionEvidence;

  diagnostics.finalDecision = isAccepted
    ? "accepted_single_attraction_candidate"
    : "fallback_weak_or_non_single_attraction_page";

  return {
    candidate,
    acceptanceReasons,
    isAccepted,
  };
}

function buildShoppingCandidate(
  input: {
    sourceUrl: string;
    sourceKind: RestaurantSourceKind;
    pageType: RestaurantPageType;
    structuredNodes: StructuredDataNode[];
    title: string | null;
    description: string | null;
    ogTitle: string | null;
    ogDescription: string | null;
    visibleTextSegments: string[];
  },
  diagnostics: RestaurantExtractionDiagnostics,
) {
  const structuredNode = pickShoppingStructuredNode(input.structuredNodes);
  const name = findNameField(
    {
      sourceKind: input.sourceKind,
      structuredNode,
      title: input.title,
      ogTitle: input.ogTitle,
    },
    diagnostics,
  );
  const address = findAddressField(
    {
      pageType: input.pageType,
      structuredNode,
      ogDescription: input.ogDescription,
      description: input.description,
      visibleTextSegments: input.visibleTextSegments,
    },
    diagnostics,
  );
  const city = findCityField(
    {
      structuredNode,
      acceptedAddress: address,
      ogDescription: input.ogDescription,
      description: input.description,
    },
    diagnostics,
  );
  const cuisine = findShoppingSubtypeField(
    {
      structuredNode,
      title: input.title,
      description: input.description,
      ogTitle: input.ogTitle,
      ogDescription: input.ogDescription,
    },
    diagnostics,
  );

  const candidate: RestaurantExtractionCandidate = {
    sourceUrl: input.sourceUrl,
    category: "购物",
    fields: {
      name,
      city,
      address,
      cuisine,
    },
  };

  const hasStructuredShoppingEvidence = Boolean(
    structuredNode &&
      hasStrongShoppingStructuredType(structuredNode) &&
      structuredNode.name,
  );
  const acceptanceReasons: string[] = [];

  if (candidate.fields.name.accepted) {
    acceptanceReasons.push("地点名称通过了严格校验。");
  }

  if (hasStructuredShoppingEvidence) {
    acceptanceReasons.push("页面存在明确的购物类结构化数据。");
  }

  if (address.accepted) {
    acceptanceReasons.push("地址来源具备可接受的强地址证据。");
  }

  if (input.pageType === "single_restaurant") {
    acceptanceReasons.push("页面类型判定为单地点页。");
  }

  const isAccepted =
    input.pageType === "single_restaurant" &&
    candidate.fields.name.accepted &&
    hasStructuredShoppingEvidence;

  diagnostics.finalDecision = isAccepted
    ? "accepted_single_shopping_candidate"
    : "fallback_weak_or_non_single_shopping_page";

  return {
    candidate,
    acceptanceReasons,
    isAccepted,
  };
}

function buildEntertainmentCandidate(
  input: {
    sourceUrl: string;
    sourceKind: RestaurantSourceKind;
    pageType: RestaurantPageType;
    structuredNodes: StructuredDataNode[];
    title: string | null;
    description: string | null;
    ogTitle: string | null;
    ogDescription: string | null;
    visibleTextSegments: string[];
  },
  diagnostics: RestaurantExtractionDiagnostics,
) {
  const structuredNode = pickEntertainmentStructuredNode(input.structuredNodes);
  const name = findNameField(
    {
      sourceKind: input.sourceKind,
      structuredNode,
      title: input.title,
      ogTitle: input.ogTitle,
    },
    diagnostics,
  );
  const address = findAddressField(
    {
      pageType: input.pageType,
      structuredNode,
      ogDescription: input.ogDescription,
      description: input.description,
      visibleTextSegments: input.visibleTextSegments,
    },
    diagnostics,
  );
  const city = findCityField(
    {
      structuredNode,
      acceptedAddress: address,
      ogDescription: input.ogDescription,
      description: input.description,
    },
    diagnostics,
  );
  const cuisine = findEntertainmentSubtypeField(
    {
      structuredNode,
      title: input.title,
      description: input.description,
      ogTitle: input.ogTitle,
      ogDescription: input.ogDescription,
    },
    diagnostics,
  );

  const candidate: RestaurantExtractionCandidate = {
    sourceUrl: input.sourceUrl,
    category: "玩乐",
    fields: {
      name,
      city,
      address,
      cuisine,
    },
  };

  const hasStructuredEntertainmentEvidence = Boolean(
    structuredNode &&
      hasEntertainmentStructuredType(structuredNode) &&
      structuredNode.name,
  );
  const acceptanceReasons: string[] = [];

  if (candidate.fields.name.accepted) {
    acceptanceReasons.push("地点名称通过了严格校验。");
  }

  if (hasStructuredEntertainmentEvidence) {
    acceptanceReasons.push("页面存在明确的玩乐类结构化数据。");
  }

  if (address.accepted) {
    acceptanceReasons.push("地址来源具备可接受的强地址证据。");
  }

  if (input.pageType === "single_restaurant") {
    acceptanceReasons.push("页面类型判定为单地点页。");
  }

  const isAccepted =
    input.pageType === "single_restaurant" &&
    candidate.fields.name.accepted &&
    hasStructuredEntertainmentEvidence;

  diagnostics.finalDecision = isAccepted
    ? "accepted_single_entertainment_candidate"
    : "fallback_weak_or_non_single_entertainment_page";

  return {
    candidate,
    acceptanceReasons,
    isAccepted,
  };
}

function buildGenericPlaceCandidate(
  input: {
    sourceUrl: string;
    sourceKind: RestaurantSourceKind;
    pageType: RestaurantPageType;
    structuredNodes: StructuredDataNode[];
    title: string | null;
    description: string | null;
    ogTitle: string | null;
    ogDescription: string | null;
    visibleTextSegments: string[];
  },
  diagnostics: RestaurantExtractionDiagnostics,
) {
  const structuredNode = pickGenericPlaceStructuredNode(input.structuredNodes);
  const name = findNameField(
    {
      sourceKind: input.sourceKind,
      structuredNode,
      title: input.title,
      ogTitle: input.ogTitle,
    },
    diagnostics,
  );
  const address = findAddressField(
    {
      pageType: input.pageType,
      structuredNode,
      ogDescription: input.ogDescription,
      description: input.description,
      visibleTextSegments: input.visibleTextSegments,
    },
    diagnostics,
  );
  const city = findCityField(
    {
      structuredNode,
      acceptedAddress: address,
      ogDescription: input.ogDescription,
      description: input.description,
    },
    diagnostics,
  );
  const cuisine = findGenericPlaceSubtypeField(
    {
      title: input.title,
      description: input.description,
      ogTitle: input.ogTitle,
      ogDescription: input.ogDescription,
    },
    diagnostics,
  );

  const candidate: RestaurantExtractionCandidate = {
    sourceUrl: input.sourceUrl,
    category: "其他",
    fields: {
      name,
      city,
      address,
      cuisine,
    },
  };

  const hasStructuredGenericPlaceEvidence = Boolean(
    structuredNode &&
      hasOnlyGenericPlaceStructuredType(structuredNode) &&
      structuredNode.name,
  );
  const hasReliableLocationEvidence = address.accepted || city.accepted;
  const acceptanceReasons: string[] = [];

  if (candidate.fields.name.accepted) {
    acceptanceReasons.push("地点名称通过了严格校验。");
  }

  if (hasStructuredGenericPlaceEvidence) {
    acceptanceReasons.push("页面存在明确的通用地点结构化数据。");
  }

  if (hasReliableLocationEvidence) {
    acceptanceReasons.push("页面同时提供了可接受的城市或地址证据。");
  }

  if (input.pageType === "single_restaurant") {
    acceptanceReasons.push("页面类型判定为单地点页。");
  }

  const isAccepted =
    input.pageType === "single_restaurant" &&
    candidate.fields.name.accepted &&
    hasStructuredGenericPlaceEvidence &&
    hasReliableLocationEvidence;

  diagnostics.finalDecision = isAccepted
    ? "accepted_single_generic_place_candidate"
    : "fallback_weak_or_non_single_generic_place_page";

  return {
    candidate,
    acceptanceReasons,
    isAccepted,
  };
}

function emitDiagnosticsIfNeeded(diagnostics: RestaurantExtractionDiagnostics) {
  if (process.env.NODE_ENV !== "development") {
    return;
  }

  console.info("[step11-extraction-diagnostics]", diagnostics);
}

function getFallbackReason(input: {
  extractionCategory?: ExtractionCategory;
  sourceKind: RestaurantSourceKind;
  pageType: RestaurantPageType;
  baseMessage: string;
}) {
  if (input.sourceKind === "google-maps") {
    return `Google Maps 在当前受限的服务端抓取下未稳定暴露可用字段，${input.baseMessage}`;
  }

  if (input.pageType === "restaurant_list") {
    if (input.extractionCategory === "住宿") {
      return "当前页面更像住宿目录或列表页，请先手动选择并补全单个地点。";
    }

    if (input.extractionCategory === "景点") {
      return "当前页面更像景点目录或列表页，请先手动选择并补全单个地点。";
    }

    if (input.extractionCategory === "玩乐") {
      return "当前页面更像玩乐目录、活动排期或场馆集合页，请先手动选择并补全单个地点。";
    }

    if (input.extractionCategory === "购物") {
      return "当前页面更像购物目录、门店列表或搜索结果页，请先手动选择并补全单个地点。";
    }

    if (input.extractionCategory === "其他") {
      return "当前页面更像通用地点目录或分店列表页，请先手动选择并补全单个地点。";
    }

    return "当前页面更像餐厅目录或位置索引页，请先手动选择并补全单个餐厅。";
  }

  if (input.pageType === "generic_page") {
    if (input.extractionCategory === "住宿") {
      return "当前页面更像通用页面，没有足够明确的单住宿地点信号，请先手动补全。";
    }

    if (input.extractionCategory === "景点") {
      return "当前页面更像通用页面，没有足够明确的单景点信号，请先手动补全。";
    }

    if (input.extractionCategory === "玩乐") {
      return "当前页面更像通用页面，没有足够明确的单玩乐地点信号，请先手动补全。";
    }

    if (input.extractionCategory === "购物") {
      return "当前页面更像通用页面，没有足够明确的单购物地点信号，请先手动补全。";
    }

    if (input.extractionCategory === "其他") {
      return "当前页面更像通用页面，没有足够明确的单地点信号，请先手动补全。";
    }

    return "当前页面更像通用页面，没有足够明确的单餐厅信号，请先手动补全。";
  }

  if (input.sourceKind === "xiaohongshu" || input.sourceKind === "douyin") {
    return `当前来源属于 best-effort 平台，${input.baseMessage}`;
  }

  if (input.sourceKind === "unsupported-social") {
    return "当前来源不在 V1 的主要支持范围内，请先改为手动补全。";
  }

  return input.baseMessage;
}

export async function extractRestaurantDraftFromSource(
  sourceUrl: string,
  options: ExtractRestaurantCandidateOptions = {},
): Promise<RestaurantExtractionResult> {
  const sourceKind = classifyRestaurantSource(sourceUrl);
  const supportLevel = getSourceSupportLevel(sourceKind);

  if (sourceKind === "unsupported-social") {
    const diagnostics = createDiagnostics({
      sourceKind,
      finalFetchedUrl: null,
      httpStatus: null,
      contentType: null,
      pageType: "generic_page",
      structuredNodes: [],
    });
    diagnostics.finalDecision = "unsupported_source";
    emitDiagnosticsIfNeeded(diagnostics);

    return {
      status: "fallback",
      sourceUrl,
      sourceKind,
      supportLevel,
      pageType: "generic_page",
      fetchedUrl: null,
      httpStatus: null,
      contentType: null,
      reason: "当前来源不在 V1 的主要支持范围内，请先改为手动补全。",
      notes: ["不尝试抓取 TikTok、Instagram 等非主要 V1 来源。"],
      diagnostics: process.env.NODE_ENV === "development" ? diagnostics : undefined,
    };
  }

  const fetchResult = await fetchSourceDocument(sourceUrl, {
    fetchImpl: options.fetchImpl,
  });

  if (fetchResult.ok === false) {
    const diagnostics = createDiagnostics({
      sourceKind,
      finalFetchedUrl: fetchResult.url,
      httpStatus: fetchResult.status ?? null,
      contentType: null,
      pageType: "unknown",
      structuredNodes: [],
    });
    diagnostics.finalDecision = `fetch_failure:${fetchResult.errorCode}`;
    emitDiagnosticsIfNeeded(diagnostics);

    return {
      status: "fallback",
      sourceUrl,
      sourceKind,
      supportLevel,
      pageType: "unknown",
      fetchedUrl: fetchResult.url,
      httpStatus: fetchResult.status ?? null,
      contentType: null,
      reason: getFallbackReason({
        sourceKind,
        pageType: "unknown",
        baseMessage: fetchResult.message,
      }),
      notes: [
        "抓取失败后保留手动补全路径，不会阻塞保存流程。",
        sourceKind === "google-maps"
          ? "当前不会为 Google Maps 增加脆弱抓取或浏览器自动化。"
          : "当前不会尝试未受控的页面抓取扩展。",
      ],
      diagnostics: process.env.NODE_ENV === "development" ? diagnostics : undefined,
    };
  }

  const documentContent = extractSourceDocumentContent(fetchResult.url, fetchResult.body);
  const structuredNodes = relevantStructuredNodes(documentContent.structuredData);

  if (
    looksLikeAccommodationWithoutStrongStructuredData({
      title: documentContent.metadata.title,
      description: documentContent.metadata.description,
      ogTitle: documentContent.metadata.ogTitle,
      ogDescription: documentContent.metadata.ogDescription,
      structuredNodes,
    })
  ) {
    const pageType = "unknown" satisfies RestaurantPageType;
    const diagnostics = createDiagnostics({
      sourceKind,
      finalFetchedUrl: fetchResult.url,
      httpStatus: fetchResult.status,
      contentType: fetchResult.contentType,
      pageType,
      structuredNodes: documentContent.structuredData,
    });
    diagnostics.finalDecision = "fallback_weak_accommodation_localbusiness_only";
    emitDiagnosticsIfNeeded(diagnostics);

    return {
      status: "fallback",
      sourceUrl,
      sourceKind,
      supportLevel,
      pageType,
      fetchedUrl: fetchResult.url,
      httpStatus: fetchResult.status,
      contentType: fetchResult.contentType,
      reason: "当前页面看起来像住宿地点，但只有过于泛化的 LocalBusiness 信号，系统不会强行猜测，请先手动补全。",
      notes: [
        "住宿提取目前只接受 Hotel、LodgingBusiness、Resort、Motel、Campground 等强结构化证据。",
        "只有泛化商家类型时，当前步骤会直接回退到手动确认。",
      ],
      diagnostics: process.env.NODE_ENV === "development" ? diagnostics : undefined,
    };
  }

  if (
    looksLikeAttractionWithoutStrongStructuredData({
      title: documentContent.metadata.title,
      description: documentContent.metadata.description,
      ogTitle: documentContent.metadata.ogTitle,
      ogDescription: documentContent.metadata.ogDescription,
      structuredNodes,
    })
  ) {
    const pageType = "unknown" satisfies RestaurantPageType;
    const diagnostics = createDiagnostics({
      sourceKind,
      finalFetchedUrl: fetchResult.url,
      httpStatus: fetchResult.status,
      contentType: fetchResult.contentType,
      pageType,
      structuredNodes: documentContent.structuredData,
    });
    diagnostics.finalDecision = "fallback_weak_attraction_localbusiness_only";
    emitDiagnosticsIfNeeded(diagnostics);

    return {
      status: "fallback",
      sourceUrl,
      sourceKind,
      supportLevel,
      pageType,
      fetchedUrl: fetchResult.url,
      httpStatus: fetchResult.status,
      contentType: fetchResult.contentType,
      reason: "当前页面看起来像景点，但只有过于泛化的 LocalBusiness 信号，系统不会强行猜测，请先手动补全。",
      notes: [
        "景点提取目前只接受 TouristAttraction、Museum、Park、LandmarksOrHistoricalBuildings、Zoo、Aquarium 等强结构化证据。",
        "只有泛化商家类型时，当前步骤会直接回退到手动确认。",
      ],
      diagnostics: process.env.NODE_ENV === "development" ? diagnostics : undefined,
    };
  }

  if (
    looksLikeShoppingWithoutStrongStructuredData({
      title: documentContent.metadata.title,
      description: documentContent.metadata.description,
      ogTitle: documentContent.metadata.ogTitle,
      ogDescription: documentContent.metadata.ogDescription,
      structuredNodes,
    })
  ) {
    const pageType = "unknown" satisfies RestaurantPageType;
    const diagnostics = createDiagnostics({
      sourceKind,
      finalFetchedUrl: fetchResult.url,
      httpStatus: fetchResult.status,
      contentType: fetchResult.contentType,
      pageType,
      structuredNodes: documentContent.structuredData,
    });
    diagnostics.finalDecision = "fallback_weak_shopping_localbusiness_only";
    emitDiagnosticsIfNeeded(diagnostics);

    return {
      status: "fallback",
      sourceUrl,
      sourceKind,
      supportLevel,
      pageType,
      fetchedUrl: fetchResult.url,
      httpStatus: fetchResult.status,
      contentType: fetchResult.contentType,
      reason: "当前页面看起来像购物地点，但只有过于泛化的 LocalBusiness 信号，系统不会强行猜测，请先手动补全。",
      notes: [
        "购物提取目前只接受 Store、ShoppingCenter、BookStore、ClothingStore、GroceryStore、ConvenienceStore、DepartmentStore、HomeGoodsStore、ElectronicsStore 等强结构化证据。",
        "只有泛化商家类型时，当前步骤会直接回退到手动确认。",
      ],
      diagnostics: process.env.NODE_ENV === "development" ? diagnostics : undefined,
    };
  }

  if (
    looksLikeEntertainmentWithoutStrongStructuredData({
      title: documentContent.metadata.title,
      description: documentContent.metadata.description,
      ogTitle: documentContent.metadata.ogTitle,
      ogDescription: documentContent.metadata.ogDescription,
      structuredNodes,
      visibleTextSegments: documentContent.visibleTextSegments,
    })
  ) {
    const pageType = "unknown" satisfies RestaurantPageType;
    const diagnostics = createDiagnostics({
      sourceKind,
      finalFetchedUrl: fetchResult.url,
      httpStatus: fetchResult.status,
      contentType: fetchResult.contentType,
      pageType,
      structuredNodes: documentContent.structuredData,
    });
    diagnostics.finalDecision = "fallback_weak_entertainment_localbusiness_only";
    emitDiagnosticsIfNeeded(diagnostics);

    return {
      status: "fallback",
      sourceUrl,
      sourceKind,
      supportLevel,
      pageType,
      fetchedUrl: fetchResult.url,
      httpStatus: fetchResult.status,
      contentType: fetchResult.contentType,
      reason: "当前页面看起来像玩乐地点，但只有过于泛化的 LocalBusiness 信号，系统不会强行猜测，请先手动补全。",
      notes: [
        "玩乐提取目前只接受 EntertainmentBusiness、MovieTheater、NightClub、BowlingAlley、AmusementPark、SportsActivityLocation、PerformingArtsTheater、EventVenue 等强结构化证据。",
        "只有泛化商家类型时，当前步骤会直接回退到手动确认。",
      ],
      diagnostics: process.env.NODE_ENV === "development" ? diagnostics : undefined,
    };
  }

  const inferredCategory = determineExtractionCategory({
    nodes: structuredNodes,
    title: documentContent.metadata.title,
    description: documentContent.metadata.description,
    ogTitle: documentContent.metadata.ogTitle,
    ogDescription: documentContent.metadata.ogDescription,
    visibleTextSegments: documentContent.visibleTextSegments,
  });

  if (inferredCategory === "ambiguous") {
    const pageType = "unknown" satisfies RestaurantPageType;
    const diagnostics = createDiagnostics({
      sourceKind,
      finalFetchedUrl: fetchResult.url,
      httpStatus: fetchResult.status,
      contentType: fetchResult.contentType,
      pageType,
      structuredNodes: documentContent.structuredData,
    });
    diagnostics.finalDecision = "fallback_ambiguous_category_evidence";
    emitDiagnosticsIfNeeded(diagnostics);

    return {
      status: "fallback",
      sourceUrl,
      sourceKind,
      supportLevel,
      pageType,
      fetchedUrl: fetchResult.url,
      httpStatus: fetchResult.status,
      contentType: fetchResult.contentType,
      reason: "当前来源同时出现了多类强结构化地点信号，系统不会静默改写分类，请先手动确认。",
      notes: [
        "当页面同时出现多类强地点信号时，当前步骤会优先回退到手动补全。",
        "这样可以避免把玩乐、购物、景点、住宿或美食页面误判到错误分类。",
      ],
      diagnostics: process.env.NODE_ENV === "development" ? diagnostics : undefined,
    };
  }

  const pageType = determinePageType({
    extractionCategory: inferredCategory,
    sourceKind,
    title: documentContent.metadata.title,
    description: documentContent.metadata.description,
    ogTitle: documentContent.metadata.ogTitle,
    ogDescription: documentContent.metadata.ogDescription,
    structuredNodes,
    visibleTextSegments: documentContent.visibleTextSegments,
  });
  const diagnostics = createDiagnostics({
    sourceKind,
    finalFetchedUrl: fetchResult.url,
    httpStatus: fetchResult.status,
    contentType: fetchResult.contentType,
    pageType,
    structuredNodes: documentContent.structuredData,
  });
  diagnostics.hasRawGenericPlaceEvidence = hasRawGenericPlaceCategoryEvidence(structuredNodes);
  diagnostics.hasGenericPlaceEvidence =
    diagnostics.hasRawGenericPlaceEvidence &&
    !hasRestaurantCategorySignals({
      nodes: structuredNodes,
      title: documentContent.metadata.title,
      description: documentContent.metadata.description,
      ogTitle: documentContent.metadata.ogTitle,
      ogDescription: documentContent.metadata.ogDescription,
    });
  diagnostics.finalCategory = inferredCategory;
  const extraction =
    inferredCategory === "住宿"
      ? buildAccommodationCandidate(
          {
            sourceUrl,
            sourceKind,
            pageType,
            structuredNodes,
            title: documentContent.metadata.title,
            description: documentContent.metadata.description,
            ogTitle: documentContent.metadata.ogTitle,
            ogDescription: documentContent.metadata.ogDescription,
            visibleTextSegments: documentContent.visibleTextSegments,
          },
          diagnostics,
        )
      : inferredCategory === "景点"
        ? buildAttractionCandidate(
            {
              sourceUrl,
              sourceKind,
              pageType,
              structuredNodes,
              title: documentContent.metadata.title,
              description: documentContent.metadata.description,
              ogTitle: documentContent.metadata.ogTitle,
              ogDescription: documentContent.metadata.ogDescription,
              visibleTextSegments: documentContent.visibleTextSegments,
            },
            diagnostics,
          )
        : inferredCategory === "玩乐"
          ? buildEntertainmentCandidate(
              {
                sourceUrl,
                sourceKind,
                pageType,
                structuredNodes,
                title: documentContent.metadata.title,
                description: documentContent.metadata.description,
                ogTitle: documentContent.metadata.ogTitle,
                ogDescription: documentContent.metadata.ogDescription,
                visibleTextSegments: documentContent.visibleTextSegments,
              },
              diagnostics,
            )
        : inferredCategory === "其他"
          ? buildGenericPlaceCandidate(
              {
                sourceUrl,
                sourceKind,
                pageType,
                structuredNodes,
                title: documentContent.metadata.title,
                description: documentContent.metadata.description,
                ogTitle: documentContent.metadata.ogTitle,
                ogDescription: documentContent.metadata.ogDescription,
                visibleTextSegments: documentContent.visibleTextSegments,
              },
              diagnostics,
            )
        : inferredCategory === "购物"
          ? buildShoppingCandidate(
              {
                sourceUrl,
                sourceKind,
                pageType,
                structuredNodes,
                title: documentContent.metadata.title,
                description: documentContent.metadata.description,
                ogTitle: documentContent.metadata.ogTitle,
                ogDescription: documentContent.metadata.ogDescription,
                visibleTextSegments: documentContent.visibleTextSegments,
              },
              diagnostics,
            )
        : buildRestaurantCandidate(
          {
            sourceUrl,
            sourceKind,
            pageType,
            structuredNodes,
            title: documentContent.metadata.title,
            description: documentContent.metadata.description,
            ogTitle: documentContent.metadata.ogTitle,
            ogDescription: documentContent.metadata.ogDescription,
            visibleTextSegments: documentContent.visibleTextSegments,
          },
          diagnostics,
        );

  if (!extraction.isAccepted) {
    const fallbackReason = getFallbackReason({
      extractionCategory: inferredCategory,
      sourceKind,
      pageType,
      baseMessage:
        inferredCategory === "住宿"
          ? "当前页面没有提供足够明确的单住宿地点信息，请先改为手动补全。"
          : inferredCategory === "景点"
            ? "当前页面没有提供足够明确的单景点信息，请先改为手动补全。"
            : inferredCategory === "玩乐"
              ? "当前页面没有提供足够明确的单玩乐地点信息，请先改为手动补全。"
            : inferredCategory === "购物"
              ? "当前页面没有提供足够明确的单购物地点信息，请先改为手动补全。"
            : inferredCategory === "其他"
              ? "当前页面没有提供足够明确的通用单地点信息，请先改为手动补全。"
            : "当前页面没有提供足够明确的单餐厅信息，请先改为手动补全。",
    });
    diagnostics.fallbackReason = fallbackReason;
    emitDiagnosticsIfNeeded(diagnostics);

    return {
      status: "fallback",
      sourceUrl,
      sourceKind,
      supportLevel,
      pageType,
      fetchedUrl: fetchResult.url,
      httpStatus: fetchResult.status,
      contentType: fetchResult.contentType,
      reason: fallbackReason,
      notes: [
        inferredCategory === "住宿"
          ? "只有当页面被判定为单地点页，且地点名称与住宿结构化证据都通过门槛时，系统才会生成草稿。"
          : inferredCategory === "景点"
            ? "只有当页面被判定为单地点页，且地点名称与景点结构化证据都通过门槛时，系统才会生成草稿。"
          : inferredCategory === "玩乐"
            ? "只有当页面被判定为单地点页，且地点名称与玩乐结构化证据都通过门槛时，系统才会生成草稿。"
          : inferredCategory === "购物"
            ? "只有当页面被判定为单地点页，且地点名称与购物结构化证据都通过门槛时，系统才会生成草稿。"
          : inferredCategory === "其他"
            ? "只有当页面被判定为单地点页，且通用结构化地点信号与城市或地址证据都通过高门槛时，系统才会生成其他类草稿。"
          : "只有当页面被判定为单餐厅页，且餐厅名称与餐厅证据都通过门槛时，系统才会生成草稿。",
        "目录页、位置索引页、泛首页和弱信号页面会直接回退到手动补全。",
      ],
      diagnostics: process.env.NODE_ENV === "development" ? diagnostics : undefined,
    };
  }

  diagnostics.finalCategory = extraction.candidate.category;
  emitDiagnosticsIfNeeded(diagnostics);

  return {
    status: "success",
    sourceUrl,
    sourceKind,
    supportLevel,
    pageType,
    fetchedUrl: fetchResult.url,
    httpStatus: fetchResult.status,
    contentType: fetchResult.contentType,
    candidate: extraction.candidate,
    notes: [
      extraction.candidate.fields.city.accepted
        ? "城市字段通过了保守校验。"
        : "城市字段证据不足，保留为手动补全。",
      extraction.candidate.fields.address.accepted
        ? "地址字段来自结构化数据、元数据或清晰的联系区块。"
        : "地址字段证据不足，保留为手动补全。",
      extraction.candidate.fields.cuisine.accepted
        ? extraction.candidate.category === "住宿"
          ? "住宿类型来自强结构化数据或明确的页面元数据。"
        : extraction.candidate.category === "景点"
            ? "景点类型来自强结构化数据或明确的页面元数据。"
          : extraction.candidate.category === "玩乐"
            ? "玩乐类型来自强结构化数据或明确的页面元数据。"
          : extraction.candidate.category === "购物"
            ? "购物类型来自强结构化数据或明确的页面元数据。"
          : extraction.candidate.category === "其他"
            ? "其他类细分只有在标题出现非常明确标签时才会填写。"
          : "菜系来自结构化数据或清晰关键词证据。"
        : extraction.candidate.category === "住宿"
          ? "住宿类型信号不足时会保持为空。"
          : extraction.candidate.category === "景点"
            ? "景点类型信号不足时会保持为空。"
            : extraction.candidate.category === "玩乐"
              ? "玩乐类型信号不足时会保持为空。"
            : extraction.candidate.category === "购物"
              ? "购物类型信号不足时会保持为空。"
            : extraction.candidate.category === "其他"
              ? "其他类默认保持手动优先，类型标签不够明确时会保持为空。"
          : "菜系信号不足时会保持为空。",
    ],
    acceptanceReasons: extraction.acceptanceReasons,
    diagnostics: process.env.NODE_ENV === "development" ? diagnostics : undefined,
  };
}
