import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { PlaceholderCard } from "@/components/placeholder-card";
import { SurfaceCard } from "@/components/surface-card";
import { requireAuthenticatedUser } from "@/lib/auth/require-user";

export default async function MapPage() {
  const user = await requireAuthenticatedUser();

  return (
    <AppShell
      currentPath="/map"
      eyebrow="地图页占位"
      title="地图页面已经纳入主导航"
      description="这里先建立地图页在整体产品中的位置和视觉层次。真实地图、坐标点、地理编码与缩放交互都会留到后续步骤实现。"
      userEmail={user.email}
      userId={user.userId}
      actions={
        <>
          <Link
            href="/restaurants"
            className="inline-flex rounded-full bg-[var(--accent)] px-5 py-3 text-sm font-semibold text-white shadow-[0_18px_38px_rgba(255,91,0,0.28)] transition hover:bg-[var(--accent-deep)]"
          >
            去收藏列表页
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
                地图预留区域
              </p>
              <h2 className="[font-family:var(--font-display)] text-2xl font-semibold tracking-[-0.03em] text-[var(--ink-strong)]">
                当前只展示地图页面的布局节奏
              </h2>
              <p className="mt-2 text-sm leading-7 text-[var(--ink-soft)]">
                真正的地图 SDK、定位点和城市浏览能力还没有接入，现在只保留后续内容会出现的大致信息区块。
              </p>
            </div>

            <div className="rounded-[28px] border border-[var(--border-soft)] bg-[linear-gradient(135deg,rgba(255,91,0,0.16),rgba(255,211,186,0.58))] p-4">
              <div className="flex aspect-[4/5] items-center justify-center rounded-[24px] border border-white/60 bg-[linear-gradient(180deg,rgba(255,255,255,0.7),rgba(255,243,234,0.88))] sm:aspect-[16/10]">
                <div className="max-w-sm text-center">
                  <p className="[font-family:var(--font-display)] text-2xl font-semibold tracking-[-0.03em] text-[var(--ink-strong)]">
                    地图组件将在后续步骤接入
                  </p>
                  <p className="mt-3 text-sm leading-7 text-[var(--ink-soft)]">
                    现在先验证手机和桌面下的视觉比例、留白和导航切换是否自然。
                  </p>
                </div>
              </div>
            </div>
          </div>
        </SurfaceCard>

        <div className="space-y-4">
          <PlaceholderCard
            title="未来会出现在这里的内容"
            description="先把功能边界说清楚，避免 Step 6 看起来像已经开始做地图能力。"
            items={[
              "餐厅位置点与城市聚焦会在后续步骤加入。",
              "没有坐标的餐厅仍会保留在列表，不会在这里强行展示。",
              "地图页会继续服从用户专属数据范围，不做公共发现。",
            ]}
          />
          <PlaceholderCard
            title="先验证导航体验"
            description="你可以在底部导航和桌面顶部导航之间切换，确认这个页面是否容易找到。"
            actionHref="/dashboard"
            actionLabel="回到总览页"
          />
        </div>
      </div>
    </AppShell>
  );
}
