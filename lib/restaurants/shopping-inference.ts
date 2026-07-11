import type {
  RestaurantFieldConfidence,
  RestaurantFieldEvidenceSource,
  StructuredDataNode,
} from "./extraction-types";

export type ShoppingSubtypeProposal = {
  value: string | null;
  confidence: RestaurantFieldConfidence;
  evidenceSource: RestaurantFieldEvidenceSource;
};

const conceptStorePattern = /(买手店|select shop|concept store|buyer'?s shop)/i;
const beautyPattern = /(美妆|beauty|cosmetics|skincare|makeup)/i;

export const shoppingStructuredTypes = new Set([
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
]);

export function hasShoppingStructuredType(node: StructuredDataNode) {
  return node.types.some((type) => shoppingStructuredTypes.has(type));
}

export function hasStrongShoppingStructuredType(node: StructuredDataNode) {
  const hasBeautyType = node.types.some(
    (type) => type === "beautysalon" || type === "healthandbeautybusiness",
  );

  if (!hasShoppingStructuredType(node)) {
    return false;
  }

  if (!hasBeautyType) {
    return true;
  }

  return beautyPattern.test([node.name, node.description].filter(Boolean).join(" "));
}

export function inferShoppingSubtype(input: {
  structuredNode: StructuredDataNode | null;
  title: string | null;
  description: string | null;
  ogTitle: string | null;
  ogDescription: string | null;
}) {
  const proposals: ShoppingSubtypeProposal[] = [];
  const primaryNode = input.structuredNode;
  const headlineText = [input.ogTitle, input.title].filter(Boolean).join(" ");
  const descriptionText = [input.ogDescription, input.description].filter(Boolean).join(" ");
  const combinedText = `${headlineText} ${descriptionText}`.trim();
  const hasType = (type: string) => primaryNode?.types.includes(type) ?? false;

  if (hasType("shoppingcenter")) {
    proposals.push({
      value: "商场",
      confidence: "high",
      evidenceSource: "structured_data",
    });
  }

  if (hasType("bookstore")) {
    proposals.push({
      value: "书店",
      confidence: "high",
      evidenceSource: "structured_data",
    });
  }

  if (hasType("clothingstore")) {
    proposals.push({
      value: "服装店",
      confidence: "high",
      evidenceSource: "structured_data",
    });
  }

  if (hasType("grocerystore")) {
    proposals.push({
      value: "超市",
      confidence: "high",
      evidenceSource: "structured_data",
    });
  }

  if (hasType("conveniencestore")) {
    proposals.push({
      value: "便利店",
      confidence: "high",
      evidenceSource: "structured_data",
    });
  }

  if (hasType("departmentstore")) {
    proposals.push({
      value: "百货商店",
      confidence: "high",
      evidenceSource: "structured_data",
    });
  }

  if (hasType("homegoodsstore")) {
    proposals.push({
      value: "家居店",
      confidence: "high",
      evidenceSource: "structured_data",
    });
  }

  if (hasType("electronicsstore")) {
    proposals.push({
      value: "电子产品店",
      confidence: "high",
      evidenceSource: "structured_data",
    });
  }

  if (
    (hasType("beautysalon") || hasType("healthandbeautybusiness")) &&
    beautyPattern.test(combinedText)
  ) {
    proposals.push({
      value: "美妆店",
      confidence: "medium",
      evidenceSource: headlineText ? "page_title" : "meta_description",
    });
  }

  if (conceptStorePattern.test(headlineText)) {
    proposals.push({
      value: "买手店",
      confidence: "medium",
      evidenceSource: "page_title",
    });
  }

  return proposals;
}
