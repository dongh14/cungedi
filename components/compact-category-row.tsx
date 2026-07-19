"use client";

import { useRouter } from "next/navigation";
import { AppIcon } from "@/components/app-icon";
import {
  getPlaceCategoryLabel,
  getPlaceSubtypeLabel,
  normalizePlaceCategory,
} from "@/lib/restaurants/constants";

export function CompactCategoryRow({
  category,
  cuisine,
  draftFields,
}: {
  category: string;
  cuisine: string;
  draftFields?: Record<string, string>;
}) {
  const router = useRouter();
  const normalizedCategory = normalizePlaceCategory(category);
  const subtypeLabel = getPlaceSubtypeLabel(cuisine, normalizedCategory);
  const valueLabel = normalizedCategory
    ? `${getPlaceCategoryLabel(normalizedCategory)}${subtypeLabel ? ` · ${subtypeLabel}` : ""}`
    : "请选择分类";

  function openPicker() {
    if (typeof window === "undefined") {
      return;
    }

    const currentUrl = `${window.location.pathname}${window.location.search}`;
    const target = new URL(currentUrl, window.location.origin);
    for (const [field, value] of Object.entries(draftFields ?? {})) {
      target.searchParams.set(field, value);
    }
    router.push(
      `/restaurants/category?return_to=${encodeURIComponent(`${target.pathname}${target.search}${target.hash}`)}`,
    );
  }

  return (
    <button type="button" className="compact-category-row" onClick={openPicker} aria-label="选择分类">
      <span>
        <strong>分类</strong>
        <span className={normalizedCategory ? "compact-category-value" : "compact-category-placeholder"}>
          {valueLabel}
        </span>
      </span>
      <AppIcon name="chevron" size={21} strokeWidth={2} />
    </button>
  );
}
