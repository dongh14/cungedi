import type {
  RestaurantPageType,
  RestaurantSourceKind,
  StructuredDataNode,
} from "./extraction-types";

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

const listPagePattern =
  /\b(locations?|find a location|our locations|store locator|stores?)\b/i;
const genericPagePattern =
  /\b(home|about|contact|menu|gift card|careers|newsletter|privacy)\b/i;

function hasRestaurantStructuredType(node: StructuredDataNode) {
  return node.types.some((type) => restaurantStructuredTypes.has(type));
}

function countAddressLikeStructuredNodes(nodes: StructuredDataNode[]) {
  return nodes.filter((node) => node.address?.streetAddress || node.address?.addressLocality)
    .length;
}

export function classifyRestaurantPageType(input: {
  sourceKind: RestaurantSourceKind;
  title: string | null;
  description: string | null;
  structuredData: StructuredDataNode[];
  visibleTextSegments: string[];
}) {
  const title = input.title ?? "";
  const description = input.description ?? "";
  const combinedHeadline = `${title} ${description}`.trim();
  const restaurantNodes = input.structuredData.filter(hasRestaurantStructuredType);
  const addressStructuredCount = countAddressLikeStructuredNodes(restaurantNodes);
  const locationSegmentCount = input.visibleTextSegments.filter((segment) =>
    /\b(locations?|find us|our restaurants|store locator)\b/i.test(segment),
  ).length;

  if (restaurantNodes.length >= 2 || addressStructuredCount >= 2 || locationSegmentCount >= 2) {
    return "restaurant_list" satisfies RestaurantPageType;
  }

  if (listPagePattern.test(combinedHeadline) && restaurantNodes.length !== 1) {
    return "restaurant_list" satisfies RestaurantPageType;
  }

  if (restaurantNodes.length === 1) {
    return "single_restaurant" satisfies RestaurantPageType;
  }

  if (genericPagePattern.test(combinedHeadline)) {
    return "generic_page" satisfies RestaurantPageType;
  }

  return "unknown" satisfies RestaurantPageType;
}
