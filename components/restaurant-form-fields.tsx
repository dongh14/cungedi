"use client";

import { useEffect, useState } from "react";
import { CompactCategoryRow } from "@/components/compact-category-row";
import { resolvePlaceArea } from "@/lib/location";

export type RestaurantFormFieldValues = {
  name: string;
  city: string;
  country?: string;
  district: string;
  source_input: string;
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
  compactReview = false,
}: {
  values: RestaurantFormFieldValues;
  sourceLabel?: string;
  sourceHint?: string;
  persistToUrl?: boolean;
  compactReview?: boolean;
}) {
  const [selectedCategory, setSelectedCategory] = useState(values.category);
  const [subtypeValue, setSubtypeValue] = useState(values.cuisine);
  const [countryCorrectionOpen, setCountryCorrectionOpen] = useState(false);
  const [countryValue, setCountryValue] = useState(
    values.country || resolvePlaceArea({ city: values.city }).country || "",
  );

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
    setCountryValue(values.country || resolvePlaceArea({ city: values.city }).country || "");
  }, [values.category, values.cuisine]);

  const sourceField = (
    <div className="space-y-2">
      <FieldLabel htmlFor="source_url" label={sourceLabel} required />
      <input
        id="source_url"
        name="source_url"
        required
        defaultValue={values.source_input}
        onChange={(event) => persistDraftField("source_input", event.target.value)}
        className="form-control w-full"
        placeholder="可以直接粘贴链接，或粘贴一整段分享文案"
      />
      <p className="text-xs leading-6 text-[var(--ink-muted)]">{sourceHint}</p>
    </div>
  );

  const addressField = (
    <div className="space-y-2">
      <FieldLabel htmlFor="address" label="地址" />
      <input
        id="address"
        name="address"
        defaultValue={values.address}
        onChange={(event) => persistDraftField("address", event.target.value)}
        className="form-control w-full"
        placeholder="例如：上海市黄浦区示例路 88 号"
      />
    </div>
  );

  return (
    <div className={compactReview ? "review-form-fields review-form-fields-compact" : "review-form-fields"}>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <FieldLabel htmlFor="name" label="地点名称" required />
          <input
            id="name"
            name="name"
            required
            defaultValue={values.name}
            onChange={(event) => persistDraftField("name", event.target.value)}
            className="form-control w-full"
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
            onChange={(event) => {
              persistDraftField("city", event.target.value);
              if (!countryCorrectionOpen) {
                setCountryValue(resolvePlaceArea({ city: event.target.value }).country || "");
              }
            }}
            className="form-control w-full"
            placeholder="例如：上海"
          />
        </div>

        <div className="space-y-2">
          <FieldLabel htmlFor="district" label="区域 / 街区（可选）" />
          <input
            id="district"
            name="district"
            defaultValue={values.district}
            onChange={(event) => persistDraftField("district", event.target.value)}
            className="form-control w-full"
            placeholder="例如：静安区 / Shinjuku / Gangnam"
          />
        </div>

        <div className="location-auto-field">
          <div>
            <span className="location-auto-label">国家/地区</span>
            <strong>{countryValue || "待识别"}</strong>
            <small>自动识别</small>
          </div>
          <button type="button" className="location-auto-action" onClick={() => setCountryCorrectionOpen((open) => !open)}>
            {countryCorrectionOpen ? "收起修正" : "需要时修正"}
          </button>
          {countryCorrectionOpen ? (
            <input
              id="country"
              name="country"
              value={countryValue}
              onChange={(event) => {
                setCountryValue(event.target.value);
                persistDraftField("country", event.target.value);
              }}
              className="form-control w-full location-auto-input"
              placeholder="输入国家/地区"
            />
          ) : (
            <input type="hidden" name="country" value={countryValue} readOnly />
          )}
        </div>
      </div>

      {compactReview ? (
        <details className="review-more-details">
          <summary>更多地点信息</summary>
          <div className="review-more-details-content">
            {sourceField}
            {addressField}
          </div>
        </details>
      ) : (
        <>
          {sourceField}
          {addressField}
        </>
      )}

      <div className="space-y-3">
        <CompactCategoryRow category={selectedCategory} cuisine={subtypeValue} />
        <input type="hidden" name="category" value={selectedCategory} readOnly />
        <input type="hidden" name="cuisine" value={subtypeValue} readOnly />
      </div>

      <div className="space-y-2">
        <FieldLabel htmlFor="note" label="备注" />
        <textarea
          id="note"
          name="note"
          rows={4}
          defaultValue={values.note}
          onChange={(event) => persistDraftField("note", event.target.value)}
          className="form-control w-full"
          placeholder="例如：想试招牌蟹粉拌面，或顺路逛一下这家书店。"
        />
      </div>
    </div>
  );
}
