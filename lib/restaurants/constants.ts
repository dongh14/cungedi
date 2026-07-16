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

export const placeCategoryOptions = [
  {
    value: "美食",
    label: "美食",
    description: "适合餐厅、小吃、咖啡馆和其他想吃想喝的地点。",
  },
  {
    value: "购物",
    label: "购物",
    description: "适合商场、买手店、集市和想顺手保存的购物地点。",
  },
  {
    value: "娱乐",
    label: "娱乐",
    description: "适合展览、夜生活、亲子活动和休闲娱乐地点。",
  },
  {
    value: "景点",
    label: "景点",
    description: "适合地标、自然风景和想打卡的旅行地点。",
  },
  {
    value: "住宿",
    label: "住宿",
    description: "适合酒店、民宿和其他过夜选择。",
  },
  {
    value: "其他",
    label: "其他",
    description: "适合暂时不想归入前面几类的地点。",
  },
] as const;

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
export type PlaceCategory = (typeof placeCategoryOptions)[number]["value"] | "玩乐";
export type RestaurantCategory = PlaceCategory;
export type RestaurantSubtypeConfig = {
  label: string;
  placeholder: string;
  hint: string;
  pickerAriaLabel: string;
  suggestions: readonly string[];
};

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

  const attraction = findAlias(["art gallery", "attraction", "museum", "landmark"]);
  if (attraction) {
    return {
      category: "景点",
      cuisine:
        attraction.toLocaleLowerCase() === "attraction"
          ? "Art Gallery"
          : attraction,
    };
  }

  const food = findAlias(["restaurant", "cafe", "café", "bar"]);
  if (food) {
    return { category: "美食", cuisine: cuisineText || food };
  }

  const lodging = findAlias(["hotel", "resort"]);
  if (lodging) {
    return { category: "住宿", cuisine: cuisineText || lodging };
  }

  const categoryAliases: Record<string, PlaceCategory> = {
    entertainment: "娱乐",
    shopping: "购物",
    other: "其他",
  };
  const aliasedCategory = categoryAliases[categoryText.toLocaleLowerCase()];

  return {
    category: aliasedCategory ?? (categoryText || null),
    cuisine: cuisineText || null,
  };
}

export function isRestaurantCategory(value: string): value is RestaurantCategory {
  return value === "玩乐" || placeCategoryOptions.some((option) => option.value === value);
}

export function isPlaceCategory(value: string): value is PlaceCategory {
  return isRestaurantCategory(value);
}

export function getCanonicalPlaceCategory(
  value: string,
): Exclude<PlaceCategory, "玩乐"> | null {
  if (value === "玩乐") {
    return "娱乐";
  }

  const canonical = placeCategoryOptions.find((option) => option.value === value);

  return canonical?.value ?? null;
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
        pickerAriaLabel: "展开玩乐类型列表",
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
