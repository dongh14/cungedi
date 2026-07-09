import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { PlaceholderCard } from "@/components/placeholder-card";
import { SurfaceCard } from "@/components/surface-card";
import { requireAuthenticatedUser } from "@/lib/auth/require-user";

export default async function RestaurantsPage() {
  const user = await requireAuthenticatedUser();

  return (
    <AppShell
      currentPath="/restaurants"
      eyebrow="收藏列表占位"
      title="收藏列表页面已经具备可访问结构"
      description="列表页的主要作用是让已登录用户知道未来在哪里查看自己的餐厅收藏。现在先提供空状态与信息层次，不提前接入真实数据读取。"
      userEmail={user.email}
      userId={user.userId}
      actions={
        <>
          <Link
            href="/restaurants/new"
            className="inline-flex rounded-full bg-[var(--accent)] px-5 py-3 text-sm font-semibold text-white shadow-[0_18px_38px_rgba(255,91,0,0.28)] transition hover:bg-[var(--accent-deep)]"
          >
            查看添加入口
          </Link>
          <Link
            href="/map"
            className="inline-flex rounded-full border border-[var(--border-soft)] bg-white px-5 py-3 text-sm font-medium text-[var(--ink-strong)] transition hover:border-[var(--accent)] hover:text-[var(--accent)]"
          >
            去地图页
          </Link>
        </>
      }
    >
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
        <SurfaceCard className="p-5 sm:p-6">
          <div className="space-y-4">
            <div>
              <p className="text-xs font-semibold tracking-[0.18em] text-[var(--accent-deep)] uppercase">
                空状态
              </p>
              <h2 className="[font-family:var(--font-display)] text-2xl font-semibold tracking-[-0.03em] text-[var(--ink-strong)]">
                这里会显示你的餐厅收藏
              </h2>
              <p className="mt-2 text-sm leading-7 text-[var(--ink-soft)]">
                Step 6 只负责把页面结构和导航位置固定下来，所以当前不读取 `restaurants`
                表，也不展示真实记录。
              </p>
            </div>

            <div className="space-y-3">
              {[
                "列表卡片会在 Step 8 接入真实餐厅数据。",
                "后续会展示名称、城市、来源链接和隐私状态等核心字段。",
                "在没有地图坐标时，餐厅仍然应该能先出现在列表页。",
              ].map((item) => (
                <div
                  key={item}
                  className="rounded-[24px] border border-[var(--border-soft)] bg-[var(--surface-muted)] p-4 text-sm leading-7 text-[var(--ink-soft)]"
                >
                  {item}
                </div>
              ))}
            </div>
          </div>
        </SurfaceCard>

        <div className="space-y-4">
          <PlaceholderCard
            title="为什么现在先放空状态"
            description="这样可以先验证页面节奏、信息层级和手机端浏览感受，而不会把 Step 7 或 Step 8 的数据逻辑提前耦合进来。"
          />
          <PlaceholderCard
            title="继续查看其他主页面"
            description="你可以继续切换到添加页或地图页，确认整个主导航是否顺手。"
            actionHref="/dashboard"
            actionLabel="返回总览页"
          />
        </div>
      </div>
    </AppShell>
  );
}
