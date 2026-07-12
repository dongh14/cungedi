import type {
  RestaurantFieldConfidence,
  RestaurantFieldEvidenceSource,
  StructuredDataNode,
} from "./extraction-types";

export type GenericPlaceSubtypeProposal = {
  value: string | null;
  confidence: RestaurantFieldConfidence;
  evidenceSource: RestaurantFieldEvidenceSource;
};

const serviceCenterPattern = /\b(service center|visitor center|游客中心|服务中心)\b/i;
const transitHubPattern = /\b(ferry terminal|bus terminal|train station|码头|客运站|火车站)\b/i;

export const genericPlaceStructuredTypes = new Set(["place", "localbusiness"]);

export function hasGenericPlaceStructuredType(node: StructuredDataNode) {
  return node.types.some((type) => genericPlaceStructuredTypes.has(type));
}

export function hasOnlyGenericPlaceStructuredType(node: StructuredDataNode) {
  return node.types.length > 0 && node.types.every((type) => genericPlaceStructuredTypes.has(type));
}

export function inferGenericPlaceSubtype(input: {
  title: string | null;
  description: string | null;
  ogTitle: string | null;
  ogDescription: string | null;
}) {
  const proposals: GenericPlaceSubtypeProposal[] = [];
  const headlineText = [input.ogTitle, input.title].filter(Boolean).join(" ");
  const descriptionText = [input.ogDescription, input.description].filter(Boolean).join(" ");
  const combinedText = [headlineText, descriptionText]
    .filter(Boolean)
    .join(" ");

  if (serviceCenterPattern.test(headlineText)) {
    proposals.push({
      value: "服务中心",
      confidence: serviceCenterPattern.test(descriptionText) ? "medium" : "high",
      evidenceSource: "page_title",
    });
  }

  if (transitHubPattern.test(headlineText) && transitHubPattern.test(combinedText)) {
    proposals.push({
      value: "交通点",
      confidence: "medium",
      evidenceSource: "page_title",
    });
  }

  return proposals;
}
