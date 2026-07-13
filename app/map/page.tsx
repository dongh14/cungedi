import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { PlaceholderCard } from "@/components/placeholder-card";
import { MapLibreFoundation } from "@/components/maplibre-foundation";
import { SurfaceCard } from "@/components/surface-card";
import { requireAuthenticatedUser } from "@/lib/auth/require-user";
import { createPlaceMarkerData } from "@/lib/map/place-markers";
import { getCurrentUserRestaurantsForMap } from "@/lib/restaurants/queries";

export default async function MapPage() {
  const user = await requireAuthenticatedUser();
  const { restaurants, error } = await getCurrentUserRestaurantsForMap();
  const placeMarkers = createPlaceMarkerData(restaurants);

  return (
    <AppShell
      currentPath="/map"
      eyebrow="本地 PMTiles 地图"
      title="在地图上回看已收藏地点"
      description="地图会读取当前账号在现有 RLS 规则下可访问的地点，并只展示有精确坐标或明确城市级近似位置的记录。"
      userEmail={user.email}
      userId={user.userId}
      actions={
        <>
          <Link
            href="/restaurants"
            className="inline-flex rounded-full bg-[var(--accent)] px-5 py-3 text-sm font-semibold text-white shadow-[0_18px_38px_rgba(255,91,0,0.28)] transition hover:bg-[var(--accent-deep)]"
          >
            去已收藏
          </Link>
          <Link
            href="/restaurants/new"
            className="inline-flex rounded-full border border-[var(--border-soft)] bg-white px-5 py-3 text-sm font-medium text-[var(--ink-strong)] transition hover:border-[var(--accent)] hover:text-[var(--accent)]"
          >
            去添加入口
          </Link>
        </>
      }
    >
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
        <SurfaceCard className="overflow-hidden p-5 sm:p-6">
          <div className="space-y-4">
            <div>
              <p className="text-xs font-semibold tracking-[0.18em] text-[var(--accent-deep)] uppercase">
                本地开源底图
              </p>
              <h2 className="[font-family:var(--font-display)] text-2xl font-semibold tracking-[-0.03em] text-[var(--ink-strong)]">
                现在期望从本地 `PMTiles` 文件加载底图
              </h2>
              <p className="mt-2 text-sm leading-7 text-[var(--ink-soft)]">
                地图会优先读取仓库 `public` 目录下的本地 PMTiles 底图文件，不依赖付费地图 SDK、公共 OSM 瓦片服务器或第三方托管样式资源。
              </p>
            </div>

            <div className="rounded-[28px] border border-[var(--border-soft)] bg-[linear-gradient(135deg,rgba(255,91,0,0.16),rgba(255,211,186,0.58))] p-4">
              <MapLibreFoundation
                className="relative aspect-[4/5] overflow-hidden rounded-[24px] border border-white/60 bg-[linear-gradient(180deg,rgba(255,255,255,0.78),rgba(255,243,234,0.9))] sm:aspect-[16/10]"
                placeMarkers={placeMarkers}
              />
            </div>

            <div className="rounded-[24px] border border-[var(--border-soft)] bg-white/72 px-4 py-4 text-sm leading-7 text-[var(--ink-soft)]">
              默认底图文件路径是 `public/maps/base.pmtiles`，也可以通过 `NEXT_PUBLIC_PM_TILES_BASEMAP_PATH` 改成其他同源 public 路径。已保存地点会显示为地图标记；城市级回退标记会在点开后明确说明是近似位置。
            </div>

            {error ? (
              <div className="rounded-[24px] border border-rose-200 bg-rose-50 px-4 py-4 text-sm leading-7 text-rose-700">
                读取地图地点时出现问题：{error.message}
              </div>
            ) : null}
          </div>
        </SurfaceCard>

        <div className="space-y-4">
          <PlaceholderCard
            title="这一步刻意还没开始的内容"
            description="先把边界收紧，避免把后续地图步骤提前揉进这次提交。"
            items={[
              "还没有开始城市筛选、搜索或聚合。",
              "不会把城市级近似位置写回已保存数据。",
              "还没有开始 geocoding、地图编辑或 Step 13 相关能力。",
            ]}
          />
          <PlaceholderCard
            title="这一步先验证什么"
            description="先确认地图页仍然服从现有导航和移动端壳层，且本地 PMTiles 底图在文件存在时可加载、缺失时可清晰回退。"
            actionHref="/dashboard"
            actionLabel="回到总览页"
          />
        </div>
      </div>
    </AppShell>
  );
}
