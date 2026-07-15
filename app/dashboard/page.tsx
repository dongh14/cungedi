import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { PlaceCard } from "@/components/place-card";
import { PlaceholderCard } from "@/components/placeholder-card";
import { SurfaceCard } from "@/components/surface-card";
import { requireAuthenticatedUser } from "@/lib/auth/require-user";
import { getCurrentUserDiscoveryData } from "@/lib/restaurants/queries";

type DashboardPageProps = {
  searchParams?: Promise<{
    message?: string;
  }>;
};

export default async function DashboardPage({
  searchParams,
}: DashboardPageProps) {
  const params = (await searchParams) ?? {};
  const user = await requireAuthenticatedUser();
  const { places, collections, error } = await getCurrentUserDiscoveryData();

  return (
    <AppShell
      currentPath="/dashboard"
      eyebrow="已登录主页面"
      title="欢迎回来，先从最近保存的地点开始"
      description="这里是你的轻量地点发现页：最近保存的地点、已有合集亮点，以及继续添加和回看地图的入口都集中在一起。"
      userEmail={user.email}
      userId={user.userId}
      message={params.message}
      actions={
        <>
          <Link
            href="/restaurants/new"
            className="inline-flex rounded-full bg-[var(--accent)] px-5 py-3 text-sm font-semibold text-white shadow-[0_18px_38px_rgba(255,91,0,0.28)] transition hover:bg-[var(--accent-deep)]"
          >
            打开添加入口
          </Link>
          <Link
            href="/restaurants"
            className="inline-flex rounded-full border border-[var(--border-soft)] bg-white px-5 py-3 text-sm font-medium text-[var(--ink-strong)] transition hover:border-[var(--accent)] hover:text-[var(--accent)]"
          >
            查看已收藏
          </Link>
          <Link
            href="/map"
            className="inline-flex rounded-full border border-[var(--border-soft)] bg-[var(--surface-muted)] px-5 py-3 text-sm font-medium text-[var(--ink-strong)] transition hover:border-[var(--accent)] hover:text-[var(--accent)]"
          >
            查看地图页
          </Link>
        </>
      }
    >
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
        <div className="space-y-4">
          <SurfaceCard className="p-5 sm:p-6">
            <div className="space-y-4">
              <div>
                <p className="text-xs font-semibold tracking-[0.18em] text-[var(--accent-deep)] uppercase">
                  Recently saved
                </p>
                <h2 className="mt-2 [font-family:var(--font-display)] text-2xl font-semibold tracking-[-0.03em] text-[var(--ink-strong)]">
                  最近保存的地点
                </h2>
                <p className="mt-2 text-sm leading-7 text-[var(--ink-soft)]">
                  这里只按保存时间展示已有记录，不加入推荐算法或额外排序。
                </p>
              </div>
              {error ? (
                <div className="rounded-[24px] border border-amber-200 bg-amber-50 p-4 text-sm leading-7 text-amber-800">
                  合集信息暂时无法读取，地点仍然可以继续浏览：{error.message}
                </div>
              ) : null}
              {places.length > 0 ? (
                <div className="grid gap-4 sm:grid-cols-2">
                  {places.slice(0, 6).map((place) => (
                    <PlaceCard key={place.id} place={place} />
                  ))}
                </div>
              ) : (
                <div className="rounded-[24px] border border-dashed border-[var(--border-soft)] bg-[var(--surface-muted)] p-5 text-sm leading-7 text-[var(--ink-soft)]">
                  你还没有保存地点。先添加一个地点，这里就会出现第一张地点卡片。
                </div>
              )}
              {places.length > 6 ? (
                <Link href="/restaurants" className="inline-flex text-sm font-semibold text-[var(--accent-deep)] underline underline-offset-4">
                  查看全部已收藏地点 →
                </Link>
              ) : null}
            </div>
          </SurfaceCard>
        </div>

        <div className="space-y-4">
          <SurfaceCard className="p-5 sm:p-6">
            <div className="space-y-4">
              <div>
                <p className="text-xs font-semibold tracking-[0.18em] text-[var(--accent-deep)] uppercase">
                  Collection highlights
                </p>
                <h2 className="mt-2 [font-family:var(--font-display)] text-2xl font-semibold tracking-[-0.03em] text-[var(--ink-strong)]">
                  合集亮点
                </h2>
              </div>
              {collections.length > 0 ? (
                <div className="space-y-3">
                  {collections.slice(0, 4).map((collection) => (
                    <Link
                      key={collection.id}
                      href="/collections"
                      className="block rounded-[22px] border border-[var(--border-soft)] bg-[var(--surface-muted)] p-4 transition hover:border-[var(--accent)]/45"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <span className="font-semibold text-[var(--ink-strong)]">{collection.name}</span>
                        <span className="rounded-full bg-white px-3 py-1 text-xs text-[var(--ink-soft)]">
                          {collection.place_count} 个地点
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="rounded-[22px] border border-dashed border-[var(--border-soft)] bg-[var(--surface-muted)] p-4 text-sm leading-7 text-[var(--ink-soft)]">
                  还没有合集。创建一个 Coffee、Tokyo Trip 或 Favorites 合集后，它会出现在这里。
                </p>
              )}
              <Link href="/collections" className="inline-flex text-sm font-semibold text-[var(--accent-deep)] underline underline-offset-4">
                管理合集 →
              </Link>
            </div>
          </SurfaceCard>

          <PlaceholderCard
            title="继续探索"
            description="没有单独的 Favorites 字段，因此这里不会虚构重要地点排序；你可以用合集表达自己的重点。"
            items={[
              "添加地点：继续从来源链接或手动输入开始。",
              "已收藏：查看完整列表和编辑入口。",
              "地图视图：回到已有地点的地图展示。",
            ]}
          />
          <PlaceholderCard
            title="你也可以回到公开页面"
            description="如果想重新检查项目配置或从未登录视角看首页，可以随时返回。"
            actionHref="/"
            actionLabel="返回首页"
            footer={
              <div className="pt-2">
                <Link
                  href="/setup"
                  className="text-sm font-medium text-[var(--ink-strong)] underline underline-offset-4"
                >
                  去设置检查页
                </Link>
              </div>
            }
          />
        </div>
      </div>
    </AppShell>
  );
}
