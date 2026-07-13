"use client";

import Link from "next/link";
import { useState } from "react";
import { MapCityFilter } from "@/components/map-city-filter";
import { MapLibreFoundation } from "@/components/maplibre-foundation";
import {
  allCitiesFilterValue,
  createFilteredMapDisplay,
  getMapCityOptions,
} from "@/lib/map/place-filter";
import { getMapPlaceUiState } from "@/lib/map/map-page-state";
import type { RestaurantMapItem } from "@/lib/restaurants/types";

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
  const [selectedCity, setSelectedCity] = useState(allCitiesFilterValue);
  const cities = getMapCityOptions(places);
  const display = createFilteredMapDisplay(places, selectedCity);
  const selectedPlaceCount = selectedCity
    ? places.filter((place) => place.city === selectedCity).length
    : places.length;
  const uiState = getMapPlaceUiState({
    isLoading: false,
    hasError: Boolean(placeLoadError),
    totalPlaces: places.length,
    selectedPlaces: selectedPlaceCount,
  });

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
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <MapCityFilter
          cities={cities}
          selectedCity={selectedCity}
          onCityChange={setSelectedCity}
        />
        <p className="px-1 text-xs leading-5 text-[var(--ink-soft)]">
          {selectedCity ? `正在查看 ${selectedCity}` : `共 ${places.length} 条已收藏地点`}
        </p>
      </div>

      {uiState === "city_empty" ? (
        <MapStateCard
          title={`${selectedCity} 暂时没有地点`}
          description="换一个城市，或切回全部城市继续查看你的已收藏地点。"
          action={
            <button
              type="button"
              onClick={() => setSelectedCity(allCitiesFilterValue)}
              className="rounded-full border border-[var(--border-soft)] bg-white px-4 py-2.5 text-sm font-semibold text-[var(--ink-strong)] transition hover:border-[var(--accent)] hover:text-[var(--accent)]"
            >
              查看全部城市
            </button>
          }
        />
      ) : (
        <>
          <div className="rounded-[28px] border border-[var(--border-soft)] bg-[linear-gradient(135deg,rgba(255,91,0,0.16),rgba(255,211,186,0.58))] p-4">
            <MapLibreFoundation
              className="relative aspect-[4/5] overflow-hidden rounded-[24px] border border-white/60 bg-[linear-gradient(180deg,rgba(255,255,255,0.78),rgba(255,243,234,0.9))] sm:aspect-[16/10]"
              placeMarkers={display.markers}
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
