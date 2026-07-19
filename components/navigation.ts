import type { AppIconName } from "@/components/app-icon";

export type AppNavigationItem = {
  href: string;
  label: string;
  shortLabel: string;
  description: string;
  icon: AppIconName;
};

export const appMenuNavigation: AppNavigationItem[] = [
  {
    href: "/dashboard",
    label: "首页",
    shortLabel: "首页",
    description: "返回发现主页",
    icon: "home",
  },
  {
    href: "/restaurants",
    label: "地点",
    shortLabel: "地点",
    description: "查看全部保存地点",
    icon: "pin",
  },
  {
    href: "/collections",
    label: "合集",
    shortLabel: "合集",
    description: "管理你的收藏合集",
    icon: "folder",
  },
  {
    href: "/map",
    label: "地图",
    shortLabel: "地图",
    description: "在地图查看地点",
    icon: "map",
  },
  {
    href: "/settings",
    label: "我的",
    shortLabel: "我的",
    description: "账号和个人设置",
    icon: "user",
  },
];

export const appNavigationUi = {
  minTouchTarget: 44,
  labelFontSize: 17,
  addHref: "/restaurants/new",
  menuHref: "/menu",
  menuRowMinHeight: 72,
  menuUsesOverlay: false,
} as const;

export function isActiveNavItem(pathname: string, href: string) {
  if (href === "/dashboard") {
    return pathname === href;
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}
