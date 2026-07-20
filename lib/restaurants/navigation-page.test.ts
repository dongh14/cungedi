import assert from "node:assert/strict";
import test from "node:test";
import { appMenuNavigation } from "../../components/navigation.ts";

test("dedicated navigation page exposes destinations in order", () => {
  assert.deepEqual(
    appMenuNavigation.map((item) => ({ label: item.label, href: item.href })),
    [
      { label: "首页", href: "/dashboard" },
      { label: "地点", href: "/restaurants" },
      { label: "待整理", href: "/source-posts" },
      { label: "合集", href: "/collections" },
      { label: "地图", href: "/map" },
      { label: "我的", href: "/settings" },
    ],
  );
});
