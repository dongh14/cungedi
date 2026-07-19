"use client";

import Link from "next/link";
import { AppIcon } from "@/components/app-icon";
import { MapLibreFoundation } from "@/components/maplibre-foundation";
import { createMapMarkerResolution, type PlaceMarkerInput } from "@/lib/map/place-markers";

type DashboardMapPreviewProps = {
  places: PlaceMarkerInput[];
  placeLoadError?: boolean;
  hasActiveFilter?: boolean;
  onClearFilter?: () => void;
};

export function DashboardMapPreview({ places, placeLoadError = false, hasActiveFilter = false, onClearFilter }: DashboardMapPreviewProps) {
  const display = createMapMarkerResolution(places);

  return (
    <section className="dashboard-map-preview" aria-label="已保存地点地图" data-testid="dashboard-map-preview">
      <div className="dashboard-map-frame">
        <MapLibreFoundation
          className="dashboard-map-canvas"
          placeMarkers={display.markers}
        />
        {placeLoadError ? (
          <div className="dashboard-map-empty">
            <AppIcon name="pin" size={24} />
            <strong>暂时无法读取地点</strong>
            <p>请稍后再试，已保存的地点不会受到影响。</p>
          </div>
        ) : display.markers.length === 0 ? (
          <div className="dashboard-map-empty">
            <AppIcon name="pin" size={24} />
            {hasActiveFilter ? (
              <>
                <strong>没有符合条件的地点</strong>
                {onClearFilter ? (
                  <button type="button" onClick={onClearFilter}>清除筛选</button>
                ) : null}
              </>
            ) : (
              <>
                <strong>还没有地点</strong>
                <p>添加地点后会显示在地图上</p>
                <Link href="/restaurants/new">添加地点</Link>
              </>
            )}
          </div>
        ) : null}
      </div>
    </section>
  );
}
