import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { PlaceholderCard } from "@/components/placeholder-card";
import { MapLibreFoundation } from "@/components/maplibre-foundation";
import { SurfaceCard } from "@/components/surface-card";
import { requireAuthenticatedUser } from "@/lib/auth/require-user";

export default async function MapPage() {
  const user = await requireAuthenticatedUser();

  return (
    <AppShell
      currentPath="/map"
      eyebrow="本地 PMTiles 底图"
      title="地图页已接入本地 PMTiles 底图能力"
      description="这一步把 `/map` 从空白样式升级为本地、自托管的开源 PMTiles 底图入口，同时继续保持现有页面壳层、移动端布局和 MapLibre 基础行为稳定。"
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
              <MapLibreFoundation className="relative aspect-[4/5] overflow-hidden rounded-[24px] border border-white/60 bg-[linear-gradient(180deg,rgba(255,255,255,0.78),rgba(255,243,234,0.9))] sm:aspect-[16/10]" />
            </div>

            <div className="rounded-[24px] border border-[var(--border-soft)] bg-white/72 px-4 py-4 text-sm leading-7 text-[var(--ink-soft)]">
              默认底图文件路径是 `public/maps/base.pmtiles`，也可以通过 `NEXT_PUBLIC_PM_TILES_BASEMAP_PATH` 改成其他同源 public 路径。当前仍然没有加入已保存地点标记、城市筛选或坐标补全逻辑。
            </div>
          </div>
        </SurfaceCard>

        <div className="space-y-4">
          <PlaceholderCard
            title="这一步刻意还没开始的内容"
            description="先把边界收紧，避免把后续地图步骤提前揉进这次提交。"
            items={[
              "还没有接入已保存地点标记、弹层或聚合。",
              "还没有开始城市筛选或没有坐标地点的城市级回退。",
              "还没有开始 geocoding、搜索或 Step 13 相关能力。",
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
