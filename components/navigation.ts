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
    description: "查看当前账号概览、保存入口和后续主路径。",
  },
  {
    href: "/restaurants/new",
    label: "添加餐厅",
    shortLabel: "添加",
    description: "手动创建餐厅并保存到你自己的账号。",
  },
  {
    href: "/restaurants",
    label: "收藏列表",
    shortLabel: "收藏",
    description: "用最小结果视图确认刚刚保存的记录已经入库。",
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
