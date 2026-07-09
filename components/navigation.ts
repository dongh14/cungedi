export type AppNavigationItem = {
  href: string;
  label: string;
  shortLabel: string;
  description: string;
};

export const appNavigation: AppNavigationItem[] = [
  {
    href: "/dashboard",
    label: "总览",
    shortLabel: "总览",
    description: "查看当前 V1 页面结构和下一步入口。",
  },
  {
    href: "/restaurants/new",
    label: "添加餐厅",
    shortLabel: "添加",
    description: "手动创建页面入口已经准备好，表单会在 Step 7 接上。",
  },
  {
    href: "/restaurants",
    label: "收藏列表",
    shortLabel: "收藏",
    description: "用户自己的餐厅列表页面占位，方便验证后续导航流。",
  },
  {
    href: "/map",
    label: "地图视图",
    shortLabel: "地图",
    description: "地图页面占位，后续再接入地图与坐标能力。",
  },
];

export function isActiveNavItem(pathname: string, href: string) {
  return pathname === href;
}
