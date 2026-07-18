import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { PlaceCard } from "@/components/place-card";
import { PlaceholderCard } from "@/components/placeholder-card";
import { SurfaceCard } from "@/components/surface-card";
import { requireAuthenticatedUser } from "@/lib/auth/require-user";
import {
  getHomepageCategoryCounts,
  getHomepageCategoryHref,
  getHomepageCollectionSummary,
  getHomepageMapHref,
  getHomepageRecentPlaces,
  homepageCategories,
  homepageEmptyCollectionsDescription,
  homepageEmptyPlacesDescription,
  homepageEmptyPlacesTitle,
  homepagePrimaryActionHref,
} from "@/lib/restaurants/home-discovery";
import { getCurrentUserDiscoveryData } from "@/lib/restaurants/queries";

type DashboardPageProps = {
  searchParams?: Promise<{
    message?: string;
  }>;
};

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const params = (await searchParams) ?? {};
  const user = await requireAuthenticatedUser();
  const { places, collections, error } = await getCurrentUserDiscoveryData();
  const recentPlaces = getHomepageRecentPlaces(places, 4);
  const categoryCounts = getHomepageCategoryCounts(places);

  return (
    <AppShell
      currentPath="/dashboard"
      eyebrow="存个地"
      title="把想去的地方存下来"
      description="一个只属于你的地点收藏面板。先保存灵感，再按合集、分类或地图慢慢回看。"
      userEmail={user.email}
      userId={user.userId}
      message={params.message}
      actions={
        <Link
          href={homepagePrimaryActionHref}
          className="inline-flex min-h-12 items-center rounded-full bg-[var(--accent)] px-6 py-3 text-sm font-semibold text-white shadow-[0_18px_38px_rgba(255,91,0,0.28)] transition hover:bg-[var(--accent-deep)]"
        >
          添加地点
        </Link>
      }
    >
      <div className="space-y-4">
        <SurfaceCard className="p-5 sm:p-6">
          <div className="space-y-4">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="text-xs font-semibold tracking-[0.18em] text-[var(--accent-deep)] uppercase">
                  Recently saved
                </p>
                <h2 className="mt-2 [font-family:var(--font-display)] text-2xl font-semibold tracking-[-0.03em] text-[var(--ink-strong)]">
                  最近收藏
                </h2>
              </div>
              <Link
                href="/restaurants"
                className="text-sm font-semibold text-[var(--accent-deep)] underline underline-offset-4"
              >
                查看全部
              </Link>
            </div>

            {error ? (
              <div className="rounded-[22px] border border-amber-200 bg-amber-50 p-4 text-sm leading-7 text-amber-800">
                合集暂时无法加载，地点仍然可以继续浏览。
              </div>
            ) : null}

            {recentPlaces.length > 0 ? (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {recentPlaces.map((place) => (
                  <PlaceCard key={place.id} place={place} />
                ))}
              </div>
            ) : (
              <div className="rounded-[24px] border border-dashed border-[var(--border-soft)] bg-[var(--surface-muted)] p-6">
                <p className="text-base font-semibold text-[var(--ink-strong)]">{homepageEmptyPlacesTitle}</p>
                <p className="mt-2 text-sm leading-7 text-[var(--ink-soft)]">{homepageEmptyPlacesDescription}</p>
                <Link
                  href={homepagePrimaryActionHref}
                  className="mt-4 inline-flex min-h-11 items-center rounded-full bg-[var(--ink-strong)] px-5 py-3 text-sm font-medium text-white transition hover:bg-[var(--accent)]"
                >
                  添加第一个地点
                </Link>
              </div>
            )}
          </div>
        </SurfaceCard>

        <div className="grid gap-4 xl:grid-cols-2">
          <SurfaceCard className="p-5 sm:p-6">
            <div className="space-y-4">
              <div className="flex flex-wrap items-end justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold tracking-[0.18em] text-[var(--accent-deep)] uppercase">
                    Collections
                  </p>
                  <h2 className="mt-2 [font-family:var(--font-display)] text-2xl font-semibold tracking-[-0.03em] text-[var(--ink-strong)]">
                    收藏夹
                  </h2>
                </div>
                <Link
                  href="/collections"
                  className="text-sm font-semibold text-[var(--accent-deep)] underline underline-offset-4"
                >
                  查看全部
                </Link>
              </div>
              {collections.length > 0 ? (
                <div className="grid gap-3 sm:grid-cols-2">
                  {collections.slice(0, 4).map((collection) => {
                    const summary = getHomepageCollectionSummary(collection);

                    return (
                    <Link
                      key={collection.id}
                      href={summary.href}
                      className="min-h-20 rounded-[22px] border border-[var(--border-soft)] bg-[var(--surface-muted)] p-4 transition hover:border-[var(--accent)]/45 focus:outline-none focus-visible:ring-4 focus-visible:ring-[var(--accent-glow)]"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <span className="truncate font-semibold text-[var(--ink-strong)]">{summary.name}</span>
                        <span className="shrink-0 rounded-full bg-white px-3 py-1 text-xs text-[var(--ink-soft)]">
                          {summary.placeCount} 个地点
                        </span>
                      </div>
                    </Link>
                    );
                  })}
                </div>
              ) : (
                <div className="rounded-[22px] border border-dashed border-[var(--border-soft)] bg-[var(--surface-muted)] p-5 text-sm leading-7 text-[var(--ink-soft)]">
                  {homepageEmptyCollectionsDescription}
                </div>
              )}
            </div>
          </SurfaceCard>

          <SurfaceCard className="p-5 sm:p-6">
            <div className="space-y-4">
              <div>
                <p className="text-xs font-semibold tracking-[0.18em] text-[var(--accent-deep)] uppercase">
                  Categories
                </p>
                <h2 className="mt-2 [font-family:var(--font-display)] text-2xl font-semibold tracking-[-0.03em] text-[var(--ink-strong)]">
                  按分类浏览
                </h2>
              </div>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {homepageCategories.map((category) => (
                  <Link
                    key={category}
                    href={getHomepageCategoryHref(category)}
                    className="min-h-20 rounded-[22px] border border-[var(--border-soft)] bg-[var(--surface-muted)] p-4 transition hover:border-[var(--accent)]/45 focus:outline-none focus-visible:ring-4 focus-visible:ring-[var(--accent-glow)]"
                  >
                    <span className="block truncate text-sm font-semibold text-[var(--ink-strong)]">{category}</span>
                    <span className="mt-2 block text-xs text-[var(--ink-soft)]">{categoryCounts[category]} 个地点</span>
                  </Link>
                ))}
              </div>
            </div>
          </SurfaceCard>
        </div>

        <SurfaceCard className="p-5 sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-semibold tracking-[0.18em] text-[var(--accent-deep)] uppercase">Explore</p>
              <h2 className="mt-2 [font-family:var(--font-display)] text-2xl font-semibold tracking-[-0.03em] text-[var(--ink-strong)]">
                继续浏览
              </h2>
              <p className="mt-2 text-sm leading-7 text-[var(--ink-soft)]">
                地图页保留现有本地搜索、城市筛选和地点标记；这里不另建一套搜索系统。
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link
                href={getHomepageMapHref()}
                className="inline-flex min-h-11 items-center rounded-full bg-[var(--ink-strong)] px-5 py-3 text-sm font-medium text-white transition hover:bg-[var(--accent)]"
              >
                查看地图
              </Link>
              <Link
                href="/map"
                className="inline-flex min-h-11 items-center rounded-full border border-[var(--border-soft)] bg-white px-5 py-3 text-sm font-medium text-[var(--ink-strong)] transition hover:border-[var(--accent)] hover:text-[var(--accent)]"
              >
                在地图中搜索
              </Link>
            </div>
          </div>
        </SurfaceCard>

        <PlaceholderCard
          eyebrow="存个地"
          title="只整理你的地点"
          description="首页不加入推荐、社交或重要地点排序。你可以用收藏夹表达自己的主题，用分类和地图找到已经保存的内容。"
        />
      </div>
    </AppShell>
  );
}
