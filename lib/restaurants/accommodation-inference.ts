import type {
  RestaurantFieldConfidence,
  RestaurantFieldEvidenceSource,
  StructuredDataNode,
} from "./extraction-types";

export type AccommodationSubtypeProposal = {
  value: string | null;
  confidence: RestaurantFieldConfidence;
  evidenceSource: RestaurantFieldEvidenceSource;
};

const hotSpringPattern = /(温泉|onsen|hot spring)/i;
const homestayPattern = /(民宿|homestay|guesthouse)/i;
const apartmentPattern = /(公寓|apartment|apartments|aparthotel|serviced apartment)/i;

export const accommodationStructuredTypes = new Set([
  "hotel",
  "lodgingbusiness",
  "resort",
  "motel",
  "campground",
  "hostel",
]);

export function hasAccommodationStructuredType(node: StructuredDataNode) {
  return node.types.some((type) => accommodationStructuredTypes.has(type));
}

export function inferAccommodationSubtype(input: {
  structuredNode: StructuredDataNode | null;
  title: string | null;
  description: string | null;
  ogTitle: string | null;
  ogDescription: string | null;
}) {
  const proposals: AccommodationSubtypeProposal[] = [];
  const primaryNode = input.structuredNode;
  const headlineText = [input.ogTitle, input.title].filter(Boolean).join(" ");
  const descriptionText = [input.ogDescription, input.description].filter(Boolean).join(" ");
  const combinedText = `${headlineText} ${descriptionText}`.trim();
  const hasType = (type: string) => primaryNode?.types.includes(type) ?? false;

  if (hasType("resort")) {
    proposals.push({
      value: "度假村",
      confidence: "high",
      evidenceSource: "structured_data",
    });
  }

  if (hasType("motel")) {
    proposals.push({
      value: "汽车旅馆",
      confidence: "high",
      evidenceSource: "structured_data",
    });
  }

  if (hasType("campground")) {
    proposals.push({
      value: "露营地",
      confidence: "high",
      evidenceSource: "structured_data",
    });
  }

  if (hasType("hostel")) {
    proposals.push({
      value: "青旅",
      confidence: "high",
      evidenceSource: "structured_data",
    });
  }

  if ((hasType("hotel") || hasType("lodgingbusiness")) && hotSpringPattern.test(combinedText)) {
    proposals.push({
      value: "温泉酒店",
      confidence: "medium",
      evidenceSource: headlineText ? "page_title" : "meta_description",
    });
  }

  if (homestayPattern.test(headlineText)) {
    proposals.push({
      value: "民宿",
      confidence: "medium",
      evidenceSource: "page_title",
    });
  }

  if (apartmentPattern.test(headlineText)) {
    proposals.push({
      value: "公寓",
      confidence: "medium",
      evidenceSource: "page_title",
    });
  }

  if (hasType("hotel")) {
    proposals.push({
      value: "酒店",
      confidence: "medium",
      evidenceSource: "structured_data",
    });
  }

  return proposals;
}
