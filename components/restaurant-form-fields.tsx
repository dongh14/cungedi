"use client";

import { useEffect, useState } from "react";
import {
  getSubtypeFieldConfig,
  isRestaurantCategory,
  isSubtypeSuggestionCompatible,
  privacyOptions,
  type RestaurantCategory,
} from "@/lib/restaurants/constants";
import { CategoryField } from "@/components/category-field";
import { CuisineField } from "@/components/cuisine-field";

export type RestaurantFormFieldValues = {
  name: string;
  city: string;
  source_input: string;
  privacy: string;
  category: string;
  address: string;
  cuisine: string;
  note: string;
};

export function FieldLabel({
  htmlFor,
  label,
  required = false,
}: {
  htmlFor: string;
  label: string;
  required?: boolean;
}) {
  return (
    <label htmlFor={htmlFor} className="text-sm font-medium text-[var(--ink-strong)]">
      {label}
      {required ? <span className="ml-1 text-[var(--accent)]">*</span> : null}
    </label>
  );
}

export function RestaurantFormFields({
  values,
  sourceLabel = "来源链接或分享文案",
  sourceHint = "支持直接链接，也支持包含链接的整段分享文字。系统会自动提取并保存其中第一个有效的 http 或 https 链接。",
  persistToUrl = false,
}: {
  values: RestaurantFormFieldValues;
  sourceLabel?: string;
  sourceHint?: string;
  persistToUrl?: boolean;
}) {
  const [selectedCategory, setSelectedCategory] = useState(values.category);
  const [subtypeValue, setSubtypeValue] = useState(values.cuisine);

  function persistDraftField(field: string, value: string) {
    if (!persistToUrl || typeof window === "undefined") {
      return;
    }

    const url = new URL(window.location.href);
    url.searchParams.set(field, value);
    window.history.replaceState(
      window.history.state,
      "",
      `${url.pathname}${url.search}${url.hash}`,
    );
  }

  useEffect(() => {
    setSelectedCategory(values.category);
    setSubtypeValue(values.cuisine);
  }, [values.category, values.cuisine]);

  function handleCategoryChange(nextCategory: string) {
    const previousCategory = isRestaurantCategory(selectedCategory)
      ? selectedCategory
      : null;

    setSelectedCategory(nextCategory);
    persistDraftField("category", nextCategory);

    if (!previousCategory || previousCategory === nextCategory) {
      return;
    }

    if (!isRestaurantCategory(nextCategory)) {
      setSubtypeValue("");
      persistDraftField("cuisine", "");
      return;
    }

    if (!isSubtypeSuggestionCompatible(nextCategory, subtypeValue)) {
      setSubtypeValue("");
      persistDraftField("cuisine", "");
    }
  }

  const subtypeConfig = isRestaurantCategory(selectedCategory)
    ? getSubtypeFieldConfig(selectedCategory as RestaurantCategory)
    : null;

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <FieldLabel htmlFor="name" label="地点名称" required />
          <input
            id="name"
            name="name"
            required
            defaultValue={values.name}
            onChange={(event) => persistDraftField("name", event.target.value)}
            className="w-full rounded-[22px] border border-[var(--border-soft)] bg-[var(--surface-muted)] px-4 py-3.5 text-sm text-[var(--ink-strong)] outline-none transition focus:border-[var(--accent)] focus:ring-4 focus:ring-[var(--accent-glow)]"
            placeholder="例如：阿明海鲜酒家 / 某某书店 / 某某博物馆"
          />
        </div>

        <div className="space-y-2">
          <FieldLabel htmlFor="city" label="城市" required />
          <input
            id="city"
            name="city"
            required
            defaultValue={values.city}
            onChange={(event) => persistDraftField("city", event.target.value)}
            className="w-full rounded-[22px] border border-[var(--border-soft)] bg-[var(--surface-muted)] px-4 py-3.5 text-sm text-[var(--ink-strong)] outline-none transition focus:border-[var(--accent)] focus:ring-4 focus:ring-[var(--accent-glow)]"
            placeholder="例如：上海"
          />
        </div>
      </div>

      <div className="space-y-2">
        <FieldLabel htmlFor="source_url" label={sourceLabel} required />
        <input
          id="source_url"
          name="source_url"
          required
          defaultValue={values.source_input}
          className="w-full rounded-[22px] border border-[var(--border-soft)] bg-[var(--surface-muted)] px-4 py-3.5 text-sm text-[var(--ink-strong)] outline-none transition focus:border-[var(--accent)] focus:ring-4 focus:ring-[var(--accent-glow)]"
          placeholder="可以直接粘贴链接，或粘贴一整段小红书 / 抖音分享文案"
        />
        <p className="text-xs leading-6 text-[var(--ink-muted)]">{sourceHint}</p>
      </div>

      <div className="space-y-2">
        <FieldLabel htmlFor="address" label="地址" />
        <input
          id="address"
          name="address"
          defaultValue={values.address}
          onChange={(event) => persistDraftField("address", event.target.value)}
          className="w-full rounded-[22px] border border-[var(--border-soft)] bg-[var(--surface-muted)] px-4 py-3.5 text-sm text-[var(--ink-strong)] outline-none transition focus:border-[var(--accent)] focus:ring-4 focus:ring-[var(--accent-glow)]"
          placeholder="例如：上海市黄浦区示例路 88 号"
        />
      </div>

      <div className="space-y-3">
        <p className="text-sm font-medium text-[var(--ink-strong)]">
          分类<span className="ml-1 text-[var(--accent)]">*</span>
        </p>
        <CategoryField selectedValue={selectedCategory} onChange={handleCategoryChange}>
          {subtypeConfig ? (
            <div className="space-y-2 rounded-[24px] border border-[var(--border-soft)] bg-white/70 p-4">
              <FieldLabel htmlFor="cuisine" label={subtypeConfig.label} />
              <CuisineField
                id="cuisine"
                name="cuisine"
                value={subtypeValue}
                onChange={(value) => {
                  setSubtypeValue(value);
                  persistDraftField("cuisine", value);
                }}
                placeholder={subtypeConfig.placeholder}
                options={subtypeConfig.suggestions}
                openAriaLabel={subtypeConfig.pickerAriaLabel}
              />
              <p className="text-xs leading-6 text-[var(--ink-muted)]">
                {subtypeConfig.hint}
              </p>
              <p className="text-xs leading-6 text-[var(--ink-muted)]">
                切换分类时，如果当前子分类不兼容，会自动清空并请你重新确认。
              </p>
            </div>
          ) : null}
        </CategoryField>
        <p className="text-xs leading-6 text-[var(--ink-muted)]">
          当前先在现有地点收藏流程里补充分类字段，不改动现有路由和保存入口。
        </p>
      </div>

      <div className="space-y-3">
        <p className="text-sm font-medium text-[var(--ink-strong)]">
          可见范围<span className="ml-1 text-[var(--accent)]">*</span>
        </p>
        <div className="grid gap-3">
          {privacyOptions.map((option) => (
            <label
              key={option.value}
              className="flex cursor-pointer gap-3 rounded-[24px] border border-[var(--border-soft)] bg-[var(--surface-muted)] p-4 transition hover:border-[var(--accent)]/45"
            >
              <input
                type="radio"
                name="privacy"
                value={option.value}
                defaultChecked={values.privacy === option.value}
                onChange={(event) => persistDraftField("privacy", event.target.value)}
                className="mt-1 h-4 w-4 accent-[var(--accent)]"
              />
              <span className="min-w-0">
                <span className="block text-sm font-semibold text-[var(--ink-strong)]">
                  {option.label}
                </span>
                <span className="mt-1 block text-xs leading-6 text-[var(--ink-soft)]">
                  {option.description}
                </span>
              </span>
            </label>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <FieldLabel htmlFor="note" label="备注" />
        <textarea
          id="note"
          name="note"
          rows={4}
          defaultValue={values.note}
          onChange={(event) => persistDraftField("note", event.target.value)}
          className="w-full rounded-[22px] border border-[var(--border-soft)] bg-[var(--surface-muted)] px-4 py-3.5 text-sm text-[var(--ink-strong)] outline-none transition focus:border-[var(--accent)] focus:ring-4 focus:ring-[var(--accent-glow)]"
          placeholder="例如：想试招牌蟹粉拌面，或顺路逛一下这家书店。"
        />
      </div>
    </>
  );
}
