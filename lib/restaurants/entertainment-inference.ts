import type {
  RestaurantFieldConfidence,
  RestaurantFieldEvidenceSource,
  StructuredDataNode,
} from "./extraction-types";

export type EntertainmentSubtypeProposal = {
  value: string | null;
  confidence: RestaurantFieldConfidence;
  evidenceSource: RestaurantFieldEvidenceSource;
};

const ktvPattern = /(ktv|karaoke|卡拉ok|卡拉ok|欢唱)/i;
const escapeRoomPattern = /(密室|escape room)/i;
const boardGamePattern = /(桌游|board game|boardgame)/i;
const exhibitionPattern = /(展览|exhibition|gallery show|art show|expo)/i;
const performanceVenuePattern = /(演出|performance|concert|live house|live music|venue)/i;

export const entertainmentStructuredTypes = new Set([
  "entertainmentbusiness",
  "movietheater",
  "nightclub",
  "bowlingalley",
  "amusementpark",
  "sportsactivitylocation",
  "performingartstheater",
  "eventvenue",
]);

export function hasEntertainmentStructuredType(node: StructuredDataNode) {
  return node.types.some((type) => entertainmentStructuredTypes.has(type));
}

export function inferEntertainmentSubtype(input: {
  structuredNode: StructuredDataNode | null;
  title: string | null;
  description: string | null;
  ogTitle: string | null;
  ogDescription: string | null;
}) {
  const proposals: EntertainmentSubtypeProposal[] = [];
  const primaryNode = input.structuredNode;
  const headlineText = [input.ogTitle, input.title].filter(Boolean).join(" ");
  const descriptionText = [input.ogDescription, input.description].filter(Boolean).join(" ");
  const combinedText = `${headlineText} ${descriptionText}`.trim();
  const hasType = (type: string) => primaryNode?.types.includes(type) ?? false;

  if (hasType("movietheater")) {
    proposals.push({
      value: "电影院",
      confidence: "high",
      evidenceSource: "structured_data",
    });
  }

  if (hasType("nightclub")) {
    proposals.push({
      value: "酒吧",
      confidence: "high",
      evidenceSource: "structured_data",
    });
  }

  if (hasType("bowlingalley")) {
    proposals.push({
      value: "保龄球馆",
      confidence: "high",
      evidenceSource: "structured_data",
    });
  }

  if (hasType("amusementpark")) {
    proposals.push({
      value: "游乐园",
      confidence: "high",
      evidenceSource: "structured_data",
    });
  }

  if (hasType("sportsactivitylocation")) {
    proposals.push({
      value: "运动场馆",
      confidence: "high",
      evidenceSource: "structured_data",
    });
  }

  if (hasType("performingartstheater")) {
    proposals.push({
      value: "剧院",
      confidence: "high",
      evidenceSource: "structured_data",
    });
  }

  if (ktvPattern.test(headlineText)) {
    proposals.push({
      value: "KTV",
      confidence: "medium",
      evidenceSource: "page_title",
    });
  }

  if (escapeRoomPattern.test(headlineText)) {
    proposals.push({
      value: "密室",
      confidence: "medium",
      evidenceSource: "page_title",
    });
  }

  if (boardGamePattern.test(headlineText)) {
    proposals.push({
      value: "桌游",
      confidence: "medium",
      evidenceSource: "page_title",
    });
  }

  if (hasType("eventvenue") && exhibitionPattern.test(combinedText)) {
    proposals.push({
      value: "展览",
      confidence: headlineText ? "medium" : "low",
      evidenceSource: headlineText ? "page_title" : "meta_description",
    });
  }

  if (hasType("eventvenue") && performanceVenuePattern.test(combinedText)) {
    proposals.push({
      value: "演出场地",
      confidence: headlineText ? "medium" : "low",
      evidenceSource: headlineText ? "page_title" : "meta_description",
    });
  }

  return proposals;
}
