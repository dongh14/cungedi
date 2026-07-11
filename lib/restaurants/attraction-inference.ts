import type {
  RestaurantFieldConfidence,
  RestaurantFieldEvidenceSource,
  StructuredDataNode,
} from "./extraction-types";

export type AttractionSubtypeProposal = {
  value: string | null;
  confidence: RestaurantFieldConfidence;
  evidenceSource: RestaurantFieldEvidenceSource;
};

const ancientTownPattern = /(古镇|old town|ancient town|historic town)/i;
const beachPattern = /(海滩|beach|bay beach|coast)/i;
const mountainPattern = /(山景|mountain|peak|summit|ridge|hill)/i;
const templePattern = /(寺|寺庙|temple|shrine|monastery)/i;

export const attractionStructuredTypes = new Set([
  "touristattraction",
  "museum",
  "park",
  "landmarksorhistoricalbuildings",
  "zoo",
  "aquarium",
]);

export function hasAttractionStructuredType(node: StructuredDataNode) {
  return node.types.some((type) => attractionStructuredTypes.has(type));
}

export function inferAttractionSubtype(input: {
  structuredNode: StructuredDataNode | null;
  title: string | null;
  description: string | null;
  ogTitle: string | null;
  ogDescription: string | null;
}) {
  const proposals: AttractionSubtypeProposal[] = [];
  const primaryNode = input.structuredNode;
  const headlineText = [input.ogTitle, input.title].filter(Boolean).join(" ");
  const descriptionText = [input.ogDescription, input.description].filter(Boolean).join(" ");
  const combinedText = `${headlineText} ${descriptionText}`.trim();
  const hasType = (type: string) => primaryNode?.types.includes(type) ?? false;

  if (hasType("museum")) {
    proposals.push({
      value: "博物馆",
      confidence: "high",
      evidenceSource: "structured_data",
    });
  }

  if (hasType("park")) {
    proposals.push({
      value: "公园",
      confidence: "high",
      evidenceSource: "structured_data",
    });
  }

  if (hasType("zoo")) {
    proposals.push({
      value: "动物园",
      confidence: "high",
      evidenceSource: "structured_data",
    });
  }

  if (hasType("aquarium")) {
    proposals.push({
      value: "水族馆",
      confidence: "high",
      evidenceSource: "structured_data",
    });
  }

  if (hasType("landmarksorhistoricalbuildings")) {
    proposals.push({
      value: "地标",
      confidence: "high",
      evidenceSource: "structured_data",
    });
  }

  if (ancientTownPattern.test(headlineText)) {
    proposals.push({
      value: "古镇",
      confidence: "medium",
      evidenceSource: "page_title",
    });
  }

  if (beachPattern.test(headlineText)) {
    proposals.push({
      value: "海滩",
      confidence: "medium",
      evidenceSource: "page_title",
    });
  }

  if (mountainPattern.test(headlineText)) {
    proposals.push({
      value: "山景",
      confidence: "medium",
      evidenceSource: "page_title",
    });
  }

  if (templePattern.test(headlineText) || (hasType("touristattraction") && templePattern.test(combinedText))) {
    proposals.push({
      value: "寺庙",
      confidence: templePattern.test(headlineText) ? "medium" : "low",
      evidenceSource: templePattern.test(headlineText) ? "page_title" : "meta_description",
    });
  }

  return proposals;
}
