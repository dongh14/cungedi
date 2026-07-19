export type AddMethod = "manual" | "source";
export type AddSourceType = "xiaohongshu" | "website" | "other";

export const addMethods = [
  {
    value: "manual" as const,
    label: "手动添加",
    description: "自己填写地点信息",
    href: "/restaurants/new/manual",
  },
  {
    value: "source" as const,
    label: "粘贴链接",
    description: "从网页、小红书等来源快速添加",
    href: "/restaurants/new/source",
  },
] as const;

export function getAddSourceHref(_sourceType?: AddSourceType) {
  return "/restaurants/new/source";
}

export type DetectedAddSourceType = "xiaohongshu" | "douyin" | "official_web" | "other_web";

export function classifyDetectedAddSourceType(sourceType: string | null | undefined): DetectedAddSourceType {
  switch (sourceType) {
    case "xiaohongshu":
      return "xiaohongshu";
    case "douyin":
      return "douyin";
    case "website":
      return "official_web";
    default:
      return "other_web";
  }
}
