import Link from "next/link";
import { createCollectionAction } from "@/app/restaurants/actions";
import { AppShell } from "@/components/app-shell";
import { CollectionList } from "@/components/collection-list";
import { PlaceholderCard } from "@/components/placeholder-card";
import { SurfaceCard } from "@/components/surface-card";
import { requireAuthenticatedUser } from "@/lib/auth/require-user";
import { getCurrentUserCollections } from "@/lib/restaurants/queries";

type CollectionsPageProps = {
  searchParams?: Promise<{
    error?: string;
    message?: string;
  }>;
};

export default async function CollectionsPage({ searchParams }: CollectionsPageProps) {
  const user = await requireAuthenticatedUser();
  const params = (await searchParams) ?? {};
  const { collections, error } = await getCurrentUserCollections();

  return (
    <AppShell
      currentPath="/collections"
      eyebrow="个人合集"
      title="用简单合集整理你保存过的地点"
      description="合集是当前账号下的私有组织方式。它只关联已保存地点，不复制数据，也不会影响现有地图、搜索或城市筛选。"
      userEmail={user.email}
      userId={user.userId}
      message={params.message}
      actions={
        <>
          <Link
            href="/restaurants"
            className="inline-flex rounded-full bg-[var(--accent)] px-5 py-3 text-sm font-semibold text-white shadow-[0_18px_38px_rgba(255,91,0,0.28)] transition hover:bg-[var(--accent-deep)]"
          >
            返回已收藏
          </Link>
          <Link
            href="/restaurants/new"
            className="inline-flex rounded-full border border-[var(--border-soft)] bg-white px-5 py-3 text-sm font-medium text-[var(--ink-strong)] transition hover:border-[var(--accent)] hover:text-[var(--accent)]"
          >
            继续添加地点
          </Link>
        </>
      }
    >
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
        <div className="space-y-4">
          <SurfaceCard className="p-5 sm:p-6">
            <div className="space-y-4">
              <div>
                <p className="text-xs font-semibold tracking-[0.18em] text-[var(--accent-deep)] uppercase">
                  Collections
                </p>
                <h2 className="[font-family:var(--font-display)] text-2xl font-semibold tracking-[-0.03em] text-[var(--ink-strong)]">
                  创建并查看你的合集
                </h2>
                <p className="mt-2 text-sm leading-7 text-[var(--ink-soft)]">
                  适合先按主题或场景做最轻量的组织，比如 Tokyo Trip、Coffee、Favorites。
                </p>
              </div>

              {params.error ? (
                <div className="rounded-[24px] border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                  {params.error}
                </div>
              ) : null}

              {error ? (
                <div className="rounded-[24px] border border-rose-200 bg-rose-50 p-4 text-sm leading-7 text-rose-700">
                  读取合集时出现问题：{error.message}
                </div>
              ) : null}

              {!error && collections.length === 0 ? (
                <div className="rounded-[24px] border border-dashed border-[var(--border-soft)] bg-[var(--surface-muted)] p-5 text-sm leading-7 text-[var(--ink-soft)]">
                  你还没有创建任何合集。先建一个最常用的合集，再到地点详情页里分配归属。
                </div>
              ) : null}
            </div>
          </SurfaceCard>

          {!error && collections.length > 0 ? <CollectionList collections={collections} /> : null}
        </div>

        <div className="space-y-4">
          <SurfaceCard className="p-5 sm:p-6">
            <div className="space-y-4">
              <div>
                <p className="text-xs font-semibold tracking-[0.18em] text-[var(--accent-deep)] uppercase">
                  New Collection
                </p>
                <h2 className="[font-family:var(--font-display)] text-2xl font-semibold tracking-[-0.03em] text-[var(--ink-strong)]">
                  创建一个新合集
                </h2>
              </div>
              <form action={createCollectionAction} className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="collection-name" className="text-sm font-medium text-[var(--ink-strong)]">
                    合集名称
                  </label>
                  <input
                    id="collection-name"
                    name="name"
                    className="w-full rounded-[22px] border border-[var(--border-soft)] bg-[var(--surface-muted)] px-4 py-3.5 text-sm text-[var(--ink-strong)] outline-none transition focus:border-[var(--accent)] focus:ring-4 focus:ring-[var(--accent-glow)]"
                    placeholder="例如：Tokyo Trip"
                  />
                </div>
                <button
                  type="submit"
                  className="inline-flex justify-center rounded-full bg-[var(--accent)] px-5 py-3.5 text-sm font-semibold text-white shadow-[0_18px_38px_rgba(255,91,0,0.28)] transition hover:bg-[var(--accent-deep)]"
                >
                  创建合集
                </button>
              </form>
            </div>
          </SurfaceCard>

          <PlaceholderCard
            title="V1 边界"
            description="合集目前只服务于个人组织，不会扩展到分享或协作。"
            items={[
              "没有公开合集。",
              "没有共享成员。",
              "不会加入推荐或排序算法。",
            ]}
          />
        </div>
      </div>
    </AppShell>
  );
}
