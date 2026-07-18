export const cuisineSuggestions = [
  "川菜",
  "粤菜",
  "湘菜",
  "江浙菜",
  "云南菜",
  "火锅",
  "烧烤",
  "咖啡",
  "Brunch",
  "甜品",
  "寿司",
  "Restaurant",
  "Cafe",
  "Bar",
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
  "公园",
  "古镇",
  "地标",
  "海滩",
  "山景",
  "寺庙",
  "动物园",
  "水族馆",
  "Art Gallery",
  "Museum",
  "Landmark",
] as const;

export const lodgingSubtypeSuggestions = [
  "酒店",
  "民宿",
  "青旅",
  "度假村",
  "公寓",
  "温泉酒店",
  "Hotel",
  "Resort",
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
export const legacyPlaceCategoryAliases = { 玩乐: "娱乐" } as const;

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

  if (normalized === "玩乐") {
    return legacyPlaceCategoryAliases.玩乐;
  }

  return canonicalPlaceCategories.includes(normalized as CanonicalPlaceCategory)
    ? (normalized as CanonicalPlaceCategory)
    : null;
}

export function getPlaceCategoryLabel(value: string | null | undefined) {
  return normalizePlaceCategory(value) ?? "其他";
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
    return { category: normalizedCategory, cuisine: cuisineText || null };
  }

  for (const candidate of categoryEvidenceTerms) {
    const matched = findAlias([...candidate.terms]);

    if (matched) {
      return {
        category: candidate.category,
        cuisine:
          cuisineText || (matched.toLocaleLowerCase() === "attraction" ? "Art Gallery" : matched),
      };
    }
  }

  return { category: null, cuisine: cuisineText || null };
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
        placeholder: "例如：川菜、火锅、咖啡、Brunch",
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
  const normalizedValue = value.trim();

  if (!normalizedValue) {
    return true;
  }

  return getSubtypeFieldConfig(category).suggestions.some(
    (option) => option === normalizedValue,
  );
}
