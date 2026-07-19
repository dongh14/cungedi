"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useFormStatus } from "react-dom";
import { updateRestaurantAction } from "@/app/restaurants/actions";
import { CompactCategoryRow } from "@/components/compact-category-row";
import { MapLibreFoundation } from "@/components/maplibre-foundation";
import { searchLocalLocationCandidates, type LocalLocationSearchCandidate } from "@/lib/map/location-search";
import { isValidLatitude, isValidLongitude } from "@/lib/map/place-location";
import type { RestaurantEditItem } from "@/lib/restaurants/types";
import { resolvePlaceArea } from "@/lib/location";

type RestaurantEditFormCardProps = {
  restaurant: RestaurantEditItem;
  searchParams: {
    error?: string;
    message?: string;
    name?: string;
    city?: string;
    category?: string;
    cuisine?: string;
    country?: string;
    district?: string;
    address?: string;
    latitude?: string;
    longitude?: string;
    note?: string;
  };
};

type EditableFields = {
  name: string;
  city: string;
  district: string;
  country: string;
  address: string;
  latitude: string;
  longitude: string;
};

function FieldLabel({ htmlFor, label, required = false }: { htmlFor: string; label: string; required?: boolean }) {
  return (
    <label htmlFor={htmlFor} className="edit-field-label">
      {label}
      {required ? <span className="ml-1 text-[var(--accent)]">*</span> : null}
    </label>
  );
}

function SubmitActions() {
  const { pending } = useFormStatus();

  return (
    <div className="edit-sticky-actions">
      <Link href="/restaurants" className="edit-cancel-button">
        取消
      </Link>
      <button type="submit" className="edit-save-button" disabled={pending}>
        {pending ? "保存中…" : "保存更改"}
      </button>
    </div>
  );
}

function getInitialCoordinates(restaurant: RestaurantEditItem, searchParams: RestaurantEditFormCardProps["searchParams"]) {
  const latitudeValue = searchParams.latitude ?? (restaurant.latitude === null ? "" : String(restaurant.latitude));
  const longitudeValue = searchParams.longitude ?? (restaurant.longitude === null ? "" : String(restaurant.longitude));

  return {
    latitude: latitudeValue && isValidLatitude(Number(latitudeValue)) ? latitudeValue : "",
    longitude: longitudeValue && isValidLongitude(Number(longitudeValue)) ? longitudeValue : "",
  };
}

function sourceHost(sourceUrl: string) {
  try {
    return new URL(sourceUrl).hostname.replace(/^www\./u, "");
  } catch {
    return "来源链接";
  }
}

export function RestaurantEditFormCard({ restaurant, searchParams }: RestaurantEditFormCardProps) {
  const resolvedArea = resolvePlaceArea({ city: restaurant.city, country: restaurant.country });
  const initialCoordinates = getInitialCoordinates(restaurant, searchParams);
  const [fields, setFields] = useState<EditableFields>({
    name: searchParams.name ?? restaurant.name,
    city: searchParams.city ?? restaurant.city,
    district: searchParams.district ?? restaurant.district ?? "",
    country: searchParams.country ?? restaurant.country ?? resolvedArea.country ?? "",
    address: searchParams.address ?? restaurant.address ?? "",
    latitude: initialCoordinates.latitude,
    longitude: initialCoordinates.longitude,
  });
  const [categoryValue, setCategoryValue] = useState(searchParams.category ?? restaurant.category);
  const [subtypeValue, setSubtypeValue] = useState(searchParams.cuisine ?? restaurant.cuisine ?? "");
  const [noteValue, setNoteValue] = useState(searchParams.note ?? restaurant.note ?? "");
  const [locationQuery, setLocationQuery] = useState("");

  useEffect(() => {
    setFields((current) => ({
      ...current,
      ...(searchParams.name !== undefined ? { name: searchParams.name } : {}),
      ...(searchParams.city !== undefined ? { city: searchParams.city } : {}),
      ...(searchParams.district !== undefined ? { district: searchParams.district } : {}),
      ...(searchParams.country !== undefined ? { country: searchParams.country } : {}),
      ...(searchParams.address !== undefined ? { address: searchParams.address } : {}),
      ...(searchParams.latitude !== undefined ? { latitude: searchParams.latitude } : {}),
      ...(searchParams.longitude !== undefined ? { longitude: searchParams.longitude } : {}),
    }));
    if (searchParams.category !== undefined) {
      setCategoryValue(searchParams.category);
    }
    if (searchParams.cuisine !== undefined) {
      setSubtypeValue(searchParams.cuisine);
    }
    if (searchParams.note !== undefined) {
      setNoteValue(searchParams.note);
    }
  }, [
    searchParams.name,
    searchParams.city,
    searchParams.district,
    searchParams.country,
    searchParams.address,
    searchParams.latitude,
    searchParams.longitude,
    searchParams.category,
    searchParams.cuisine,
    searchParams.note,
  ]);

  const searchCandidates = useMemo(
    () => searchLocalLocationCandidates(locationQuery, restaurant),
    [locationQuery, restaurant],
  );
  const latitude = fields.latitude ? Number(fields.latitude) : null;
  const longitude = fields.longitude ? Number(fields.longitude) : null;
  const editableLocation =
    latitude !== null && longitude !== null && isValidLatitude(latitude) && isValidLongitude(longitude)
      ? { latitude, longitude }
      : null;

  function updateField(field: keyof EditableFields, value: string) {
    setFields((current) => ({ ...current, [field]: value }));
  }

  function applyLocationCandidate(candidate: LocalLocationSearchCandidate) {
    setFields((current) => ({
      ...current,
      city: candidate.city ?? current.city,
      country: candidate.country ?? current.country,
      district: candidate.district ?? current.district,
      address: candidate.address ?? current.address,
      latitude: String(candidate.latitude),
      longitude: String(candidate.longitude),
    }));
    setLocationQuery(candidate.label);
  }

  function handleMapLocationChange(nextLocation: { latitude: number; longitude: number }) {
    setFields((current) => ({
      ...current,
      latitude: String(nextLocation.latitude),
      longitude: String(nextLocation.longitude),
    }));
  }

  return (
    <div className="edit-form-surface">
      {searchParams.message ? <div className="edit-success-message">{searchParams.message}</div> : null}
      {searchParams.error ? <div className="edit-error-message" role="alert">{searchParams.error}</div> : null}

      <form action={updateRestaurantAction}>
        <input type="hidden" name="restaurant_id" value={restaurant.id} />

        <section className="edit-form-section" aria-labelledby="edit-basic-heading">
          <h2 id="edit-basic-heading" className="edit-section-title">基本信息</h2>
          <div className="edit-form-fields">
            <div>
              <FieldLabel htmlFor="name" label="名称" required />
              <input id="name" name="name" value={fields.name} onChange={(event) => updateField("name", event.target.value)} className="form-control w-full" required />
            </div>
            <div>
              <FieldLabel htmlFor="city" label="城市" required />
              <input id="city" name="city" value={fields.city} onChange={(event) => updateField("city", event.target.value)} className="form-control w-full" required />
            </div>
            <div>
              <FieldLabel htmlFor="district" label="区域 / 街区" />
              <input id="district" name="district" value={fields.district} onChange={(event) => updateField("district", event.target.value)} className="form-control w-full" placeholder="例如：静安区 / Shinjuku" />
            </div>
            <div className="edit-country-row">
              <FieldLabel htmlFor="country" label="国家/地区" />
              <input id="country" name="country" value={fields.country} onChange={(event) => updateField("country", event.target.value)} className="form-control w-full" placeholder="未识别时可留空" />
            </div>
            <div>
              <FieldLabel htmlFor="address" label="地址" />
              <input id="address" name="address" value={fields.address} onChange={(event) => updateField("address", event.target.value)} className="form-control w-full" placeholder="可填写区域或地址" />
            </div>
          </div>
        </section>

        <section className="edit-form-section" aria-labelledby="edit-category-heading">
          <h2 id="edit-category-heading" className="edit-section-title">分类</h2>
          <CompactCategoryRow
            category={categoryValue}
            cuisine={subtypeValue}
            draftFields={{
              ...fields,
              category: categoryValue,
              cuisine: subtypeValue,
              note: noteValue,
            }}
          />
          <input type="hidden" name="category" value={categoryValue} readOnly />
          <input type="hidden" name="cuisine" value={subtypeValue} readOnly />
        </section>

        <section className="edit-form-section" aria-labelledby="edit-notes-heading">
          <h2 id="edit-notes-heading" className="edit-section-title">备注</h2>
          <label htmlFor="note" className="sr-only">备注</label>
          <textarea id="note" name="note" rows={4} value={noteValue} onChange={(event) => setNoteValue(event.target.value)} className="form-control w-full edit-note-field" placeholder="添加备注（可选）" />
        </section>

        <section className="edit-form-section" aria-labelledby="edit-location-heading">
          <h2 id="edit-location-heading" className="edit-section-title">位置信息</h2>
          <div className="edit-location-search">
            <label htmlFor="location-search" className="edit-field-label">搜索地点或区域</label>
            <input id="location-search" value={locationQuery} onChange={(event) => setLocationQuery(event.target.value)} className="form-control w-full" placeholder="例如：大阪城 / 静安区 / Shinjuku" autoComplete="off" />
            {searchCandidates.length > 0 ? (
              <div className="edit-location-results" role="listbox" aria-label="本地位置候选">
                {searchCandidates.map((candidate) => (
                  <button key={candidate.id} type="button" role="option" className="edit-location-result" onClick={() => applyLocationCandidate(candidate)}>
                    <span>{candidate.label}</span>
                    <small>{candidate.subtitle}{candidate.approximate ? " · 区域位置" : ""}</small>
                  </button>
                ))}
              </div>
            ) : null}
          </div>

          <div className="edit-location-map-wrap">
            <MapLibreFoundation
              className="edit-location-map"
              editableLocation={editableLocation}
              onLocationChange={handleMapLocationChange}
            />
          </div>

          <div className="edit-coordinate-summary">
            <span>{editableLocation ? "当前位置坐标" : "区域位置"}</span>
            <strong>{editableLocation ? `${editableLocation.latitude.toFixed(5)}, ${editableLocation.longitude.toFixed(5)}` : "尚未设置精确坐标"}</strong>
          </div>
          <input type="hidden" name="latitude" value={fields.latitude} readOnly />
          <input type="hidden" name="longitude" value={fields.longitude} readOnly />
        </section>

        <section className="edit-form-section edit-source-section" aria-labelledby="edit-source-heading">
          <h2 id="edit-source-heading" className="edit-section-title">来源</h2>
          <div className="edit-source-row">
            <div>
              <strong>{sourceHost(restaurant.source_url)}</strong>
              <span>原始来源链接保持不变</span>
            </div>
            <a href={restaurant.source_url} target="_blank" rel="noreferrer">打开 <span aria-hidden="true">›</span></a>
          </div>
        </section>

        <SubmitActions />
      </form>
    </div>
  );
}
