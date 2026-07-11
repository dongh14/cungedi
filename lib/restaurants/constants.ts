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

export const categoryOptions = [
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
    value: "玩乐",
    label: "玩乐",
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

export const defaultRestaurantCategory = "美食" as const;

export type RestaurantPrivacy = (typeof privacyOptions)[number]["value"];
export type RestaurantCategory = (typeof categoryOptions)[number]["value"];
export type RestaurantSubtypeConfig = {
  label: string;
  placeholder: string;
  hint: string;
  pickerAriaLabel: string;
  suggestions: readonly string[];
};

export function isRestaurantCategory(value: string): value is RestaurantCategory {
  return categoryOptions.some((option) => option.value === value);
}

export function getSubtypeFieldConfig(
  category: RestaurantCategory,
): RestaurantSubtypeConfig {
  switch (category) {
    case "美食":
      return {
        label: "菜系或类型",
        placeholder: "例如：川菜、火锅、咖啡、Brunch",
        hint: "可以直接输入，也可以从建议里选择，适合美食类地点的细分说明。",
        pickerAriaLabel: "展开菜系或类型列表",
        suggestions: cuisineSuggestions,
      };
    case "购物":
      return {
        label: "购物类型",
        placeholder: "例如：商场、买手店、书店",
        hint: "适合记录店铺或购物场景，也可以手动输入更细的分类。",
        pickerAriaLabel: "展开购物类型列表",
        suggestions: shoppingSubtypeSuggestions,
      };
    case "玩乐":
      return {
        label: "玩乐类型",
        placeholder: "例如：KTV、酒吧、展览",
        hint: "适合记录娱乐方式或场地类型，也可以手动补充。",
        pickerAriaLabel: "展开玩乐类型列表",
        suggestions: entertainmentSubtypeSuggestions,
      };
    case "景点":
      return {
        label: "景点类型",
        placeholder: "例如：博物馆、公园、海滩",
        hint: "适合记录景点细分类型，也可以继续自定义填写。",
        pickerAriaLabel: "展开景点类型列表",
        suggestions: attractionSubtypeSuggestions,
      };
    case "住宿":
      return {
        label: "住宿类型",
        placeholder: "例如：酒店、民宿、温泉酒店",
        hint: "适合记录住宿细分类型，也可以手动输入。",
        pickerAriaLabel: "展开住宿类型列表",
        suggestions: lodgingSubtypeSuggestions,
      };
    case "其他":
      return {
        label: "类型",
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
