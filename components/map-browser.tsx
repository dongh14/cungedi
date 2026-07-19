"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { MapLocationFilter } from "@/components/map-location-filter";
import { MapLibreFoundation } from "@/components/maplibre-foundation";
import {
  emptyPlaceSearchQuery,
  createFilteredMapDisplay,
  filterPlacesForMap,
} from "@/lib/map/place-filter";
import {
  allCountriesFilterValue,
  allCitiesFilterValue,
  formatHierarchyLocationLabel,
  parseLocationFilterState,
  serializeLocationFilterState,
  type LocationHierarchyState,
} from "@/lib/location-hierarchy";
import { getMapPlaceUiState } from "@/lib/map/map-page-state";
import {
  createMapSearchSelectablePlaces,
  syncActiveMapPlaceId,
} from "@/lib/map/place-selection";
import type { RestaurantMapItem } from "@/lib/restaurants/types";
import { getPlaceCategoryLabel } from "@/lib/restaurants/constants";

type MapBrowserProps = {
  places: RestaurantMapItem[];
  placeLoadError?: string | null;
};

function getUnresolvedSummary(input: {
  total: number;
  missingLocation: number;
  invalidCoordinates: number;
}) {
  if (input.total === 0) {
    return "当前筛选范围内的地点都可以显示在地图上。";
  }

  const reasons: string[] = [];

  if (input.missingLocation > 0) {
    reasons.push(`${input.missingLocation} 条缺少可用坐标，且城市未能匹配本地城市中心`);
  }

  if (input.invalidCoordinates > 0) {
    reasons.push(`${input.invalidCoordinates} 条存储坐标无效`);
  }

  return `当前有 ${input.total} 条已收藏地点无法显示在地图上：${reasons.join("；")}。这些地点仍会保留在已收藏列表中。`;
}

function MapStateCard({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action: React.ReactNode;
}) {
  return (
    <div className="flex min-h-[19rem] flex-col items-start justify-center rounded-[24px] border border-dashed border-[var(--border-soft)] bg-[linear-gradient(145deg,rgba(255,245,237,0.94),rgba(255,255,255,0.95))] p-6">
      <p className="text-xs font-semibold tracking-[0.16em] text-[var(--accent-deep)] uppercase">地图提示</p>
      <h3 className="mt-3 [font-family:var(--font-display)] text-xl font-semibold text-[var(--ink-strong)]">
        {title}
      </h3>
      <p className="mt-2 max-w-md text-sm leading-7 text-[var(--ink-soft)]">{description}</p>
      <div className="mt-5">{action}</div>
    </div>
  );
}

export function MapBrowser({ places, placeLoadError = null }: MapBrowserProps) {
  const [locationFilter, setLocationFilter] = useState<LocationHierarchyState>({
    selectedCountry: allCountriesFilterValue,
    selectedCity: allCitiesFilterValue,
    selectedDistrict: "",
  });
  const [searchQuery, setSearchQuery] = useState(emptyPlaceSearchQuery);
  const [activePlaceId, setActivePlaceId] = useState<number | null>(null);
  const filteredPlaces = filterPlacesForMap({
    places,
    searchQuery,
    selectedCountry: locationFilter.selectedCountry,
    selectedCity: locationFilter.selectedCity,
    selectedDistrict: locationFilter.selectedDistrict,
  });
  const display = createFilteredMapDisplay({
    places,
    searchQuery,
    selectedCountry: locationFilter.selectedCountry,
    selectedCity: locationFilter.selectedCity,
    selectedDistrict: locationFilter.selectedDistrict,
  });
  const selectedPlaceCount = filteredPlaces.length;
  const searchResults = createMapSearchSelectablePlaces(display.markers);
  const uiState = getMapPlaceUiState({
    isLoading: false,
    hasError: Boolean(placeLoadError),
    totalPlaces: places.length,
    selectedPlaces: selectedPlaceCount,
  });
  const hasActiveSearch = searchQuery.trim().length > 0;

  useEffect(() => {
    setLocationFilter(parseLocationFilterState(window.location.search));
  }, []);

  function handleLocationChange(nextValue: LocationHierarchyState) {
    setLocationFilter(nextValue);
    setActivePlaceId(null);
    const query = serializeLocationFilterState(nextValue);
    window.history.replaceState(
      window.history.state,
      "",
      `${window.location.pathname}${query ? `?${query}` : ""}`,
    );
  }

  useEffect(() => {
    setActivePlaceId((currentActivePlaceId) =>
      syncActiveMapPlaceId(display.markers, currentActivePlaceId),
    );
  }, [display.markers]);

  if (uiState === "error") {
    return (
      <MapStateCard
        title="地点暂时没有加载成功"
        description="地图底图仍然可以稍后再试；这次没有改动你的任何已收藏地点。"
        action={
          <Link
            href="/map"
            className="inline-flex rounded-full bg-[var(--accent)] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[var(--accent-deep)]"
          >
            重新加载地图
          </Link>
        }
      />
    );
  }

  if (uiState === "empty") {
    return (
      <MapStateCard
        title="还没有可查看的地点"
        description="先保存一个想去的地点。保存后，它会在有精确坐标或可用城市级近似位置时出现在这里。"
        action={
          <Link
            href="/restaurants/new"
            className="inline-flex rounded-full bg-[var(--accent)] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[var(--accent-deep)]"
          >
            添加地点
          </Link>
        }
      />
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-2">
        <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-1 flex-col gap-2 sm:flex-row">
            <label className="flex min-w-0 flex-1 items-center gap-3 rounded-2xl border border-[var(--border-soft)] bg-white/82 p-2 shadow-[0_8px_20px_rgba(67,31,15,0.05)]">
              <span className="rounded-xl bg-[var(--surface-muted)] px-2.5 py-2 text-xs font-semibold text-[var(--ink-strong)]">
                本地搜索
              </span>
              <input
                type="search"
                value={searchQuery}
                onChange={(event) => {
                  setSearchQuery(event.target.value);
                  setActivePlaceId(null);
                }}
            placeholder="按名称、国家、城市或分类搜索"
                className="min-w-0 flex-1 rounded-xl bg-transparent px-1 py-2 text-sm font-semibold text-[var(--ink-strong)] outline-none placeholder:text-[var(--ink-soft)]"
                aria-label="按名称、城市或分类搜索地图地点"
              />
              {hasActiveSearch ? (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery(emptyPlaceSearchQuery);
                    setActivePlaceId(null);
                  }}
                  className="rounded-xl border border-[var(--border-soft)] bg-[var(--surface-muted)] px-3 py-2 text-xs font-semibold text-[var(--ink-strong)] transition hover:border-[var(--accent)] hover:text-[var(--accent)]"
                >
                  清除搜索
                </button>
              ) : null}
            </label>
            <MapLocationFilter places={places} value={locationFilter} onChange={handleLocationChange} />
          </div>
          <p className="px-1 text-xs leading-5 text-[var(--ink-soft)]">
            {locationFilter.selectedCountry
              ? `正在查看 ${formatHierarchyLocationLabel(locationFilter.selectedCountry, locationFilter.selectedCity, locationFilter.selectedDistrict)}`
              : hasActiveSearch
                ? `共匹配 ${selectedPlaceCount} 条已收藏地点`
                : `共 ${places.length} 条已收藏地点`}
          </p>
        </div>
      </div>

      {hasActiveSearch && searchResults.length > 0 ? (
        <div className="rounded-[24px] border border-[var(--border-soft)] bg-white/82 p-3 shadow-[0_8px_20px_rgba(67,31,15,0.05)]">
          <div className="flex items-center justify-between gap-3 px-1">
            <p className="text-xs font-semibold tracking-[0.16em] text-[var(--accent-deep)] uppercase">
              搜索结果
            </p>
            <p className="text-xs leading-5 text-[var(--ink-soft)]">
              选择后会定位到地图并打开信息卡片
            </p>
          </div>
          <div className="mt-3 grid gap-2">
            {searchResults.map((place) => {
              const isActive = place.id === activePlaceId;

              return (
                <button
                  key={place.id}
                  type="button"
                  onClick={() => setActivePlaceId(place.id)}
                  className={`rounded-[18px] border px-4 py-3 text-left transition ${
                    isActive
                      ? "border-[var(--accent)] bg-[var(--surface-muted)] shadow-[0_12px_28px_rgba(255,91,0,0.12)]"
                      : "border-[var(--border-soft)] bg-white hover:border-[var(--accent)]"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-[var(--ink-strong)]">{place.name}</p>
                      <p className="mt-1 text-xs leading-5 text-[var(--ink-soft)]">
                        {formatHierarchyLocationLabel(place.country, place.city, place.district)}
                        {place.category ? ` · ${getPlaceCategoryLabel(place.category)}` : ""}
                      </p>
                    </div>
                    {place.approximate ? (
                      <span className="rounded-full bg-[#fff3e8] px-2 py-1 text-[11px] font-semibold text-[var(--accent-deep)]">
                        近似位置
                      </span>
                    ) : null}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      ) : null}

      {uiState === "city_empty" ? (
        <MapStateCard
          title={locationFilter.selectedCountry ? `${formatHierarchyLocationLabel(locationFilter.selectedCountry, locationFilter.selectedCity, locationFilter.selectedDistrict)} 暂时没有匹配地点` : "暂时没有匹配地点"}
          description={
            hasActiveSearch
              ? "试试更短的关键词，或切换城市后继续查看你的已收藏地点。"
              : "换一个国家或城市，或切回全部地点继续查看你的已收藏地点。"
          }
          action={
            <button
              type="button"
              onClick={() => {
                handleLocationChange({
                  selectedCountry: allCountriesFilterValue,
                  selectedCity: allCitiesFilterValue,
                  selectedDistrict: "",
                });
                setSearchQuery(emptyPlaceSearchQuery);
                setActivePlaceId(null);
              }}
              className="rounded-full border border-[var(--border-soft)] bg-white px-4 py-2.5 text-sm font-semibold text-[var(--ink-strong)] transition hover:border-[var(--accent)] hover:text-[var(--accent)]"
            >
              {hasActiveSearch ? "清除筛选条件" : "查看全部地点"}
            </button>
          }
        />
      ) : (
        <>
          <div className="rounded-[28px] border border-[var(--border-soft)] bg-[linear-gradient(135deg,rgba(255,91,0,0.16),rgba(255,211,186,0.58))] p-4">
            <MapLibreFoundation
              className="relative aspect-[4/5] overflow-hidden rounded-[24px] border border-white/60 bg-[linear-gradient(180deg,rgba(255,255,255,0.78),rgba(255,243,234,0.9))] sm:aspect-[16/10]"
              placeMarkers={display.markers}
              activeMarkerId={activePlaceId}
            />
          </div>

          <p className="rounded-[20px] border border-[var(--border-soft)] bg-[var(--surface-muted)] px-3 py-2.5 text-xs leading-6 text-[var(--ink-soft)]">
            当前显示 {display.markers.length} 个地图标记。{getUnresolvedSummary(display.unresolved)}
          </p>
        </>
      )}
    </div>
  );
}
