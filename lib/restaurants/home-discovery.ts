import {
  canonicalPlaceCategories,
  getPlaceCategoryLabel,
  type RestaurantCategory,
} from "./constants.ts";

export const homepageCategories = canonicalPlaceCategories;
export const homepageCategoryIcons = {
  美食: "food",
  景点: "attraction",
  住宿: "lodging",
  购物: "shopping",
  娱乐: "entertainment",
  其他: "other",
} as const;
export const homepageQuickLinks = [
  { href: "/restaurants", label: "地点", description: "查看全部保存地点", icon: "pin" },
  { href: "/collections", label: "收藏", description: "查看收藏集", icon: "folder" },
] as const;
export const homepageSections = ["map", "categories", "shortcuts"] as const;
export const homepageCategoryGrid = {
  columns: 3,
  rows: 2,
  minHeight: 76,
  touchTarget: 44,
  labelFontSize: 17,
} as const;
export const homepageMapHeight = 280;

export const homepagePrimaryActionHref = "/restaurants/new";
export const homepageEmptyPlacesTitle = "还没有收藏地点";
export const homepageEmptyPlacesDescription = "添加第一个想去的地方吧。";
export const homepageEmptyCollectionsDescription = "还没有收藏夹。创建一个主题，给保存的地点找个归处吧。";

export type HomepageCategory = (typeof homepageCategories)[number];

type HomepagePlace = {
  category: RestaurantCategory;
  created_at: string;
};

export function getHomepageRecentPlaces<T extends { created_at: string }>(
  places: T[],
  limit = 3,
) {
  return [...places]
    .sort((left, right) => right.created_at.localeCompare(left.created_at))
    .slice(0, limit);
}

export function getHomepageCategoryCounts(places: HomepagePlace[]) {
  const counts = Object.fromEntries(homepageCategories.map((category) => [category, 0])) as Record<
    HomepageCategory,
    number
  >;

  for (const place of places) {
    const category = getPlaceCategoryLabel(place.category);

    if (category in counts) {
      counts[category as HomepageCategory] += 1;
    }
  }

  return counts;
}

export function getHomepageCategoryHref(category: HomepageCategory) {
  return `/restaurants?category=${encodeURIComponent(category)}`;
}

export function getHomepageCollectionSummary(collection: {
  id: number;
  name: string;
  place_count: number;
}) {
  return {
    href: `/collections#collection-${collection.id}`,
    name: collection.name,
    placeCount: collection.place_count,
  };
}

export function getHomepageMapHref() {
  return "/map";
}
