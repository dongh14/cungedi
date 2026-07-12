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
      eyebrow="MapLibre 基础"
      title="地图页已接入最小可复用的 MapLibre 基础"
      description="这一步只替换 `/map` 占位内容，先让本地 MapLibre 画布和基础缩放控件稳定运行。底图、已保存地点标记和更完整的浏览能力会在后续已验证步骤里继续加入。"
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
                空白地图画布
              </p>
              <h2 className="[font-family:var(--font-display)] text-2xl font-semibold tracking-[-0.03em] text-[var(--ink-strong)]">
                先把地图容器、初始化和移动端控件边界搭好
              </h2>
              <p className="mt-2 text-sm leading-7 text-[var(--ink-soft)]">
                当前样式是本地空样式，不会请求外部瓦片或第三方地图服务。你现在看到的是后续地图能力的稳定基础层。
              </p>
            </div>

            <div className="rounded-[28px] border border-[var(--border-soft)] bg-[linear-gradient(135deg,rgba(255,91,0,0.16),rgba(255,211,186,0.58))] p-4">
              <MapLibreFoundation className="relative aspect-[4/5] overflow-hidden rounded-[24px] border border-white/60 bg-[linear-gradient(180deg,rgba(255,255,255,0.78),rgba(255,243,234,0.9))] sm:aspect-[16/10]" />
            </div>

            <div className="rounded-[24px] border border-[var(--border-soft)] bg-white/72 px-4 py-4 text-sm leading-7 text-[var(--ink-soft)]">
              底图数据会在后续已验证步骤中接入，已保存地点标记也会在后续步骤加入。这一步只确保 `/map` 页面已经从占位说明切换到可复用的 MapLibre 基础组件。
            </div>
          </div>
        </SurfaceCard>

        <div className="space-y-4">
          <PlaceholderCard
            title="这一步刻意还没开始的内容"
            description="先把边界收紧，避免把后续地图步骤提前揉进这次提交。"
            items={[
              "PMTiles 底图还没有接入。",
              "已保存地点标记、弹层和筛选都还没有开始。",
              "没有坐标的地点处理方式会放到后续已验证步骤继续实现。",
            ]}
          />
          <PlaceholderCard
            title="这一步先验证什么"
            description="先确认地图页仍然服从现有导航和移动端壳层，且空白地图画布能稳定加载。"
            actionHref="/dashboard"
            actionLabel="回到总览页"
          />
        </div>
      </div>
    </AppShell>
  );
}
