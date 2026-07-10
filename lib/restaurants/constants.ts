export const cuisineSuggestions = [
  "川菜",
  "粤菜",
  "湘菜",
  "江浙菜",
  "云南菜",
  "火锅",
  "烧烤",
  "面馆",
  "饺子",
  "早餐",
  "咖啡馆",
  "甜品",
  "日料",
  "韩餐",
  "东南亚菜",
  "西餐",
  "海鲜",
  "牛排",
  "酒吧小食",
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

export type RestaurantPrivacy = (typeof privacyOptions)[number]["value"];
