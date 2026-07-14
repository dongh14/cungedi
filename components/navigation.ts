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
    label: "添加地点",
    shortLabel: "添加",
    description: "粘贴来源链接进入确认起点，或继续手动补全并保存你想收藏的地点。",
  },
  {
    href: "/restaurants",
    label: "已收藏",
    shortLabel: "收藏",
    description: "查看当前账号已保存的地点列表，并保留刚保存成功的确认状态。",
  },
  {
    href: "/collections",
    label: "合集",
    shortLabel: "合集",
    description: "创建和查看个人合集，并把已保存地点按主题组织起来。",
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
