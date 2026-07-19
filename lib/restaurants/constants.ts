export const cuisineSuggestions = [
  "川菜",
  "粤菜",
  "湘菜",
  "江浙菜",
  "云南菜",
  "火锅",
  "烧烤",
  "咖啡",
  "早午餐",
  "甜品",
  "寿司",
  "餐厅",
  "咖啡馆",
  "面包店",
  "小吃",
  "市场",
  "其他",
  "酒吧",
] as const;

export const shoppingSubtypeSuggestions = [
  "商场",
  "买手店",
  "服装店",
  "超市",
  "便利店",
  "书店",
  "家居店",
  "美妆店",
  "电子产品店",
  "百货商店",
] as const;

export const entertainmentSubtypeSuggestions = [
  "KTV",
  "酒吧",
  "密室",
  "桌游",
  "电影院",
  "展览",
  "运动场馆",
  "游乐园",
  "保龄球馆",
  "剧院",
  "演出场地",
] as const;

export const attractionSubtypeSuggestions = [
  "博物馆",
  "美术馆",
  "公园",
  "古镇",
  "地标",
  "海滩",
  "山景",
  "寺庙",
  "动物园",
  "水族馆",
] as const;

export const lodgingSubtypeSuggestions = [
  "酒店",
  "民宿",
  "青旅",
  "度假村",
  "公寓",
  "温泉酒店",
] as const;

export const otherSubtypeSuggestions = [
  "服务点",
  "交通点",
  "临时标记",
  "待分类",
] as const;

export const canonicalPlaceCategories = [
  "美食",
  "景点",
  "住宿",
  "购物",
  "娱乐",
  "其他",
] as const;

export type CanonicalPlaceCategory = (typeof canonicalPlaceCategories)[number];
export const legacyPlaceCategoryAliases = {
  玩乐: "娱乐",
  restaurant: "美食",
  food: "美食",
  attraction: "景点",
  hotel: "住宿",
  lodging: "住宿",
  shopping: "购物",
  entertainment: "娱乐",
  leisure: "娱乐",
  other: "其他",
} as const;

const placeSubtypeAliases: Record<string, string> = {
  "咖啡": "咖啡馆",
  "甜品": "甜品店",
  "青旅": "青年旅舍",
  "公寓": "公寓式酒店",
  bar: "酒吧",
  "cocktail bar": "酒吧",
  cocktail_bar: "酒吧",
  "wine bar": "酒吧",
  wine_bar: "酒吧",
  "beer bar": "酒吧",
  beer_bar: "酒吧",
  "whisky bar": "酒吧",
  whisky_bar: "酒吧",
  "whiskey bar": "酒吧",
  whiskey_bar: "酒吧",
  "lounge bar": "酒吧",
  lounge_bar: "酒吧",
  "sake bar": "酒吧",
  sake_bar: "酒吧",
  pub: "酒吧",
  taproom: "酒吧",
  "鸡尾酒吧": "酒吧",
  "葡萄酒吧": "酒吧",
  "啤酒吧": "酒吧",
  "威士忌酒吧": "酒吧",
  "清吧": "酒吧",
  "バー": "酒吧",
  "ワインバー": "酒吧",
  "ビアバー": "酒吧",
  cafe: "咖啡馆",
  café: "咖啡馆",
  coffee: "咖啡馆",
  "coffee shop": "咖啡馆",
  coffee_shop: "咖啡馆",
  restaurant: "餐厅",
  bakery: "面包店",
  dessert: "甜品店",
  desserts: "甜品店",
  brunch: "早午餐",
  "fast food": "快餐",
  fast_food: "快餐",
  izakaya: "居酒屋",
  "tea house": "茶馆",
  tea_house: "茶馆",
  market: "市场",
  museum: "博物馆",
  "art gallery": "美术馆",
  art_gallery: "美术馆",
  park: "公园",
  landmark: "地标",
  temple: "寺庙",
  shrine: "寺庙",
  exhibition: "展览",
  viewpoint: "观景点",
  beach: "海滩",
  hotel: "酒店",
  lodging: "酒店",
  hostel: "青年旅舍",
  resort: "度假村",
  "apartment hotel": "公寓式酒店",
  apartment_hotel: "公寓式酒店",
  mall: "商场",
  "shopping mall": "商场",
  shopping_mall: "商场",
  "department store": "百货公司",
  department_store: "百货公司",
  boutique: "精品店",
  bookstore: "书店",
  supermarket: "超市",
  cinema: "电影院",
  "movie theater": "电影院",
  movie_theater: "电影院",
  nightclub: "夜店",
  night_club: "夜店",
  "live performance": "现场演出",
  live_performance: "现场演出",
  "live house": "现场演出",
  live_house: "现场演出",
  "theme park": "游乐园",
  theme_park: "游乐园",
  "amusement park": "游乐园",
  amusement_park: "游乐园",
  arcade: "游戏厅",
  "sports venue": "体育场馆",
  sports_venue: "体育场馆",
  service: "服务",
  school: "学校",
  medical: "医疗",
  transport: "交通",
  store: "其他",
  other: "其他",
};

const knownChineseSubtypes = new Set([
  ...cuisineSuggestions,
  ...shoppingSubtypeSuggestions,
  ...entertainmentSubtypeSuggestions,
  ...attractionSubtypeSuggestions,
  ...lodgingSubtypeSuggestions,
  ...otherSubtypeSuggestions,
]);

const categoryDescriptions: Record<CanonicalPlaceCategory, string> = {
  美食: "适合餐厅、小吃、咖啡馆和其他想吃想喝的地点。",
  景点: "适合地标、自然风景和想打卡的旅行地点。",
  住宿: "适合酒店、民宿和其他过夜选择。",
  购物: "适合商场、买手店、集市和想顺手保存的购物地点。",
  娱乐: "适合展览、夜生活、亲子活动和休闲娱乐地点。",
  其他: "适合暂时不想归入前面几类的地点。",
};

export const placeCategoryOptions = canonicalPlaceCategories.map((value) => ({
  value,
  label: value,
  description: categoryDescriptions[value],
}));

export const categoryOptions = placeCategoryOptions;

export const privacyOptions = [
  {
    value: "private",
    label: "仅自己可见",
    description: "适合个人旅行清单，其他用户无法查看。",
  },
  {
    value: "public",
    label: "标记为公开",
    description: "目前只作为记录字段保存，V1 仍不会对其他用户可见。",
  },
] as const;

export const defaultPlaceCategory = "美食" as const;
export const defaultRestaurantCategory = defaultPlaceCategory;

export type RestaurantPrivacy = (typeof privacyOptions)[number]["value"];
export const personalOnlyPrivacy = "private" as const;
export type PlaceCategory = CanonicalPlaceCategory | "玩乐";
export type RestaurantCategory = PlaceCategory;
export type RestaurantSubtypeConfig = {
  label: string;
  placeholder: string;
  hint: string;
  pickerAriaLabel: string;
  suggestions: readonly string[];
};

export const categoryEvidenceTerms: ReadonlyArray<{
  category: CanonicalPlaceCategory;
  terms: readonly string[];
}> = [
  { category: "美食", terms: ["美食", "restaurant", "cafe", "café", "coffee", "bar", "bakery", "food", "dining"] },
  { category: "景点", terms: ["景点", "attraction", "museum", "art gallery", "landmark", "gallery"] },
  { category: "住宿", terms: ["住宿", "hotel", "resort", "hostel", "lodging"] },
  { category: "购物", terms: ["购物", "shopping", "store", "market", "mall"] },
  { category: "娱乐", terms: ["娱乐", "entertainment", "cinema", "theme park", "theater", "theatre", "ktv", "karaoke", "nightlife", "exhibition"] },
  { category: "其他", terms: ["其他", "other"] },
];

export function normalizePlaceCategory(value: string | null | undefined): CanonicalPlaceCategory | null {
  const normalized = value?.trim();

  if (!normalized) {
    return null;
  }

  if (canonicalPlaceCategories.includes(normalized as CanonicalPlaceCategory)) {
    return normalized as CanonicalPlaceCategory;
  }

  if (normalized === "玩乐") {
    return legacyPlaceCategoryAliases.玩乐;
  }

  return legacyPlaceCategoryAliases[normalized.toLocaleLowerCase() as keyof typeof legacyPlaceCategoryAliases] ?? null;
}

export function getPlaceCategoryLabel(value: string | null | undefined) {
  return normalizePlaceCategory(value) ?? "其他";
}

function normalizeSubtypeKey(value: string) {
  return value.trim().toLocaleLowerCase().replace(/[\s_-]+/g, " ");
}

export function normalizePlaceSubtype(
  value: string | null | undefined,
  _category?: string | null,
): string | null {
  const trimmed = value?.trim() ?? "";

  if (!trimmed) {
    return null;
  }

  const normalizedKey = normalizeSubtypeKey(trimmed);
  const mapped = placeSubtypeAliases[normalizedKey] ?? placeSubtypeAliases[trimmed.toLocaleLowerCase()];

  if (mapped) {
    return mapped;
  }

  return /[\u4e00-\u9fa5]/u.test(trimmed) ? trimmed : null;
}

export function getPlaceSubtypeLabel(
  value: string | null | undefined,
  category?: string | null,
) {
  const trimmed = value?.trim() ?? "";
  return trimmed ? normalizePlaceSubtype(trimmed, category) ?? "其他" : "";
}

export function normalizeAIPlaceUnderstanding(
  category: string | null,
  cuisine: string | null,
  placeType: string | null,
) {
  const categoryText = category?.trim() ?? "";
  const cuisineText = cuisine?.trim() ?? "";
  const placeTypeText = placeType?.trim() ?? "";
  const candidates = [categoryText, placeTypeText].filter(Boolean);
  const normalizedCandidates = candidates.map((value) =>
    value.toLocaleLowerCase().replace(/[\s_-]+/g, " "),
  );

  const findAlias = (aliases: string[]) => {
    const index = normalizedCandidates.findIndex((value) =>
      aliases.includes(value),
    );

    return index >= 0 ? candidates[index] : null;
  };

  const normalizedCategory = normalizePlaceCategory(categoryText);

  if (normalizedCategory) {
    const subtypeCandidate = cuisineText ||
      (normalizePlaceSubtype(categoryText, normalizedCategory) ? categoryText : placeTypeText);
    return {
      category: normalizedCategory,
      cuisine: normalizePlaceSubtype(subtypeCandidate, normalizedCategory),
    };
  }

  for (const candidate of categoryEvidenceTerms) {
    const matched = findAlias([...candidate.terms]);

    if (matched) {
      return {
        category: candidate.category,
        cuisine: normalizePlaceSubtype(cuisineText || matched, candidate.category),
      };
    }
  }

  return { category: null, cuisine: normalizePlaceSubtype(cuisineText) };
}

export function isRestaurantCategory(value: string): value is RestaurantCategory {
  return normalizePlaceCategory(value) !== null;
}

export function isPlaceCategory(value: string): value is PlaceCategory {
  return isRestaurantCategory(value);
}

export function getCanonicalPlaceCategory(
  value: string,
): CanonicalPlaceCategory | null {
  return normalizePlaceCategory(value);
}

export function getSubtypeFieldConfig(
  category: RestaurantCategory,
): RestaurantSubtypeConfig {
  const canonicalCategory = getCanonicalPlaceCategory(category) ?? "其他";

  switch (canonicalCategory) {
    case "美食":
      return {
        label: "子分类",
        placeholder: "例如：川菜、火锅、咖啡馆、早午餐",
        hint: "可以直接输入，也可以从建议里选择，适合美食类地点的细分说明。",
        pickerAriaLabel: "展开菜系或类型列表",
        suggestions: cuisineSuggestions,
      };
    case "购物":
      return {
        label: "子分类",
        placeholder: "例如：商场、买手店、书店",
        hint: "适合记录店铺或购物场景，也可以手动输入更细的分类。",
        pickerAriaLabel: "展开购物类型列表",
        suggestions: shoppingSubtypeSuggestions,
      };
    case "娱乐":
      return {
        label: "子分类",
        placeholder: "例如：KTV、酒吧、展览",
        hint: "适合记录娱乐方式或场地类型，也可以手动补充。",
      pickerAriaLabel: "展开娱乐类型列表",
        suggestions: entertainmentSubtypeSuggestions,
      };
    case "景点":
      return {
        label: "子分类",
        placeholder: "例如：博物馆、公园、海滩",
        hint: "适合记录景点细分类型，也可以继续自定义填写。",
        pickerAriaLabel: "展开景点类型列表",
        suggestions: attractionSubtypeSuggestions,
      };
    case "住宿":
      return {
        label: "子分类",
        placeholder: "例如：酒店、民宿、温泉酒店",
        hint: "适合记录住宿细分类型，也可以手动输入。",
        pickerAriaLabel: "展开住宿类型列表",
        suggestions: lodgingSubtypeSuggestions,
      };
    case "其他":
      return {
        label: "子分类",
        placeholder: "例如：服务点、临时集合点、待分类地点",
        hint: "这一类默认允许自由填写，也提供少量通用建议方便快速选择。",
        pickerAriaLabel: "展开类型列表",
        suggestions: otherSubtypeSuggestions,
      };
  }
}

export function isSubtypeSuggestionCompatible(
  category: RestaurantCategory,
  value: string,
): boolean {
  const normalizedValue = normalizePlaceSubtype(value, category);

  if (!value.trim()) {
    return true;
  }

  return Boolean(normalizedValue && getSubtypeFieldConfig(category).suggestions.includes(normalizedValue));
}
