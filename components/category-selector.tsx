"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AppIcon, type AppIconName } from "@/components/app-icon";
import {
  canonicalPlaceCategories,
  getSubtypeFieldConfig,
  normalizePlaceCategory,
  type CanonicalPlaceCategory,
} from "@/lib/restaurants/constants";

const icons: Record<CanonicalPlaceCategory, AppIconName> = {
  美食: "food",
  景点: "attraction",
  住宿: "lodging",
  购物: "shopping",
  娱乐: "entertainment",
  其他: "other",
};

function getSafeReturnUrl(value: string | undefined) {
  if (!value) {
    return "/restaurants/new/manual";
  }

  try {
    const target = new URL(value, window.location.origin);
    if (target.origin !== window.location.origin || !target.pathname.startsWith("/")) {
      return "/restaurants/new/manual";
    }

    return `${target.pathname}${target.search}${target.hash}`;
  } catch {
    return "/restaurants/new/manual";
  }
}

export function CategorySelector({
  returnTo,
  initialCategory,
}: {
  returnTo?: string;
  initialCategory?: string;
}) {
  const router = useRouter();
  const normalizedInitialCategory = normalizePlaceCategory(initialCategory);
  const [selectedCategory, setSelectedCategory] = useState<CanonicalPlaceCategory | null>(normalizedInitialCategory);

  function selectCategory(category: CanonicalPlaceCategory) {
    setSelectedCategory(category);
  }

  function selectSubtype(cuisine: string) {
    const target = new URL(getSafeReturnUrl(returnTo), window.location.origin);
    target.searchParams.set("category", selectedCategory ?? "其他");
    if (cuisine) {
      target.searchParams.set("cuisine", cuisine);
    } else {
      target.searchParams.delete("cuisine");
    }
    router.push(`${target.pathname}${target.search}${target.hash}`);
  }

  if (!selectedCategory) {
    return (
      <div className="category-selector" data-testid="category-selector">
        <div className="category-selector-heading">
          <p>先选择一个大类</p>
          <h2>选择分类</h2>
        </div>
        <div className="category-selector-list">
          {canonicalPlaceCategories.map((category) => (
            <button key={category} type="button" className="category-selector-row" onClick={() => selectCategory(category)}>
              <span className="category-selector-icon"><AppIcon name={icons[category]} size={23} /></span>
              <span>{category}</span>
              <AppIcon name="chevron" size={19} />
            </button>
          ))}
        </div>
      </div>
    );
  }

  const subtypes = getSubtypeFieldConfig(selectedCategory).suggestions;

  return (
    <div className="category-selector" data-testid="subcategory-selector">
      <div className="category-selector-heading">
        <button type="button" className="category-selector-back" onClick={() => setSelectedCategory(null)}>
          <AppIcon name="back" size={19} /> 返回大类
        </button>
        <p>{selectedCategory}</p>
        <h2>选择子分类</h2>
      </div>
      <div className="category-selector-list">
        <button type="button" className="category-selector-row" onClick={() => selectSubtype("")}>
          <span className="category-selector-icon"><AppIcon name="other" size={23} /></span>
          <span>暂不设置</span>
          <AppIcon name="chevron" size={19} />
        </button>
        {subtypes.map((subtype) => (
          <button key={subtype} type="button" className="category-selector-row" onClick={() => selectSubtype(subtype)}>
            <span className="category-selector-icon"><AppIcon name={icons[selectedCategory]} size={23} /></span>
            <span>{subtype}</span>
            <AppIcon name="chevron" size={19} />
          </button>
        ))}
      </div>
    </div>
  );
}
