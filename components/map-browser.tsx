"use client";

import { useState } from "react";
import { MapCityFilter } from "@/components/map-city-filter";
import { MapLibreFoundation } from "@/components/maplibre-foundation";
import {
  allCitiesFilterValue,
  createFilteredMapDisplay,
  getMapCityOptions,
} from "@/lib/map/place-filter";
import type { RestaurantMapItem } from "@/lib/restaurants/types";

type MapBrowserProps = {
  places: RestaurantMapItem[];
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

export function MapBrowser({ places }: MapBrowserProps) {
  const [selectedCity, setSelectedCity] = useState(allCitiesFilterValue);
  const cities = getMapCityOptions(places);
  const display = createFilteredMapDisplay(places, selectedCity);

  return (
    <div className="space-y-3">
      <MapCityFilter
        cities={cities}
        selectedCity={selectedCity}
        onCityChange={setSelectedCity}
      />

      <div className="rounded-[28px] border border-[var(--border-soft)] bg-[linear-gradient(135deg,rgba(255,91,0,0.16),rgba(255,211,186,0.58))] p-4">
        <MapLibreFoundation
          className="relative aspect-[4/5] overflow-hidden rounded-[24px] border border-white/60 bg-[linear-gradient(180deg,rgba(255,255,255,0.78),rgba(255,243,234,0.9))] sm:aspect-[16/10]"
          placeMarkers={display.markers}
        />
      </div>

      <p className="rounded-[20px] border border-[var(--border-soft)] bg-[var(--surface-muted)] px-3 py-2.5 text-xs leading-6 text-[var(--ink-soft)]">
        当前显示 {display.markers.length} 个地图标记。{getUnresolvedSummary(display.unresolved)}
      </p>
    </div>
  );
}
