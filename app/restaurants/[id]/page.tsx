import Link from "next/link";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { PlaceLocationPreview } from "@/components/place-location-preview";
import { PlaceholderCard } from "@/components/placeholder-card";
import { SurfaceCard } from "@/components/surface-card";
import { requireAuthenticatedUser } from "@/lib/auth/require-user";
import {
  getCurrentUserCollectionsForRestaurant,
  getCurrentUserRestaurantById,
} from "@/lib/restaurants/queries";
import { getPlaceDetailsDisplayData } from "@/lib/restaurants/place-details";

type RestaurantDetailsPageProps = {
  params: Promise<{ id: string }>;
};

export default async function RestaurantDetailsPage({
  params,
}: RestaurantDetailsPageProps) {
  const user = await requireAuthenticatedUser();
  const routeParams = await params;
  const restaurantId = Number(routeParams.id);

  if (!Number.isInteger(restaurantId) || restaurantId <= 0) {
    notFound();
  }

  const { restaurant, error } = await getCurrentUserRestaurantById(restaurantId);

  if (error || !restaurant) {
    notFound();
  }

  const { collections } = await getCurrentUserCollectionsForRestaurant(restaurant.id);
  const details = getPlaceDetailsDisplayData({ ...restaurant, collections });
  const hasLocationPreview = details.location.status === "resolved";

  return (
    <AppShell
      currentPath="/restaurants"
      eyebrow="地点详情"
      title={details.name}
      description="这是已保存地点的只读详情页。查看完整信息后，可以进入编辑页修正内容，但不会在这里直接修改记录。"
      userEmail={user.email}
      userId={user.userId}
      actions={
        <>
          <Link
            href={details.editHref}
            className="inline-flex min-h-12 items-center rounded-full bg-[var(--accent)] px-5 py-3 text-sm font-semibold text-white shadow-[0_18px_38px_rgba(255,91,0,0.28)] transition hover:bg-[var(--accent-deep)]"
          >
            编辑地点
          </Link>
          <Link
            href="/restaurants"
            className="inline-flex min-h-12 items-center rounded-full border border-[var(--border-soft)] bg-white px-5 py-3 text-sm font-medium text-[var(--ink-strong)] transition hover:border-[var(--accent)] hover:text-[var(--accent)]"
          >
            返回已收藏
          </Link>
        </>
      }
    >
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
        <div className="space-y-4">
          <SurfaceCard className="overflow-hidden">
            <div className="flex min-h-[14rem] flex-col justify-between bg-[linear-gradient(135deg,rgba(255,91,0,0.2),rgba(255,238,219,0.96))] p-6 sm:min-h-[18rem] sm:p-8">
              <div className="flex items-start justify-between gap-4">
                <span className="rounded-full bg-white/80 px-3 py-1 text-xs font-semibold tracking-[0.16em] text-[var(--accent-deep)] uppercase">
                  暂无图片
                </span>
              </div>
              <div>
                <p className="text-sm font-medium text-[var(--accent-deep)]">{details.category}</p>
                <h2 className="mt-2 [font-family:var(--font-display)] text-3xl font-semibold tracking-[-0.05em] text-[var(--ink-strong)] sm:text-4xl">
                  {details.name}
                </h2>
                {details.city ? (
                  <p className="mt-3 text-sm text-[var(--ink-soft)]">{details.city}</p>
                ) : null}
              </div>
            </div>
          </SurfaceCard>

          <SurfaceCard className="p-5 sm:p-6">
            <div className="space-y-4">
              <div>
                <p className="text-xs font-semibold tracking-[0.18em] text-[var(--accent-deep)] uppercase">
                  Saved information
                </p>
                <h2 className="mt-2 [font-family:var(--font-display)] text-2xl font-semibold tracking-[-0.03em] text-[var(--ink-strong)]">
                  已确认信息
                </h2>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <DetailField label="分类" value={details.category} />
                <DetailField label="子分类" value={details.subcategory} />
                <DetailField label="城市" value={details.city} />
                <DetailField label="地址" value={details.address} />
                <DetailField label="保存时间" value={details.createdAtLabel} />
              </div>
              {details.notes ? (
                <DetailField label="备注" value={details.notes} multiline />
              ) : null}
            </div>
          </SurfaceCard>
        </div>

        <div className="space-y-4">
          <SurfaceCard className="p-5 sm:p-6">
            <div className="space-y-4">
              <div>
                <p className="text-xs font-semibold tracking-[0.18em] text-[var(--accent-deep)] uppercase">
                  Collections
                </p>
                <h2 className="mt-2 [font-family:var(--font-display)] text-2xl font-semibold tracking-[-0.03em] text-[var(--ink-strong)]">
                  所属合集
                </h2>
              </div>
              {details.collections.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {details.collections.map((collection) => (
                    <Link
                      key={collection.id}
                      href={`/collections#collection-${collection.id}`}
                      className="rounded-full bg-[var(--accent-soft)] px-3 py-2 text-sm font-medium text-[var(--accent-deep)] transition hover:bg-[var(--accent)] hover:text-white"
                    >
                      {collection.name}
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="rounded-[22px] border border-dashed border-[var(--border-soft)] bg-[var(--surface-muted)] p-4 text-sm leading-7 text-[var(--ink-soft)]">
                  尚未加入任何合集。
                </p>
              )}
            </div>
          </SurfaceCard>

          <SurfaceCard className="p-5 sm:p-6">
            <div className="space-y-4">
              <div>
                <p className="text-xs font-semibold tracking-[0.18em] text-[var(--accent-deep)] uppercase">
                  Source
                </p>
                <h2 className="mt-2 [font-family:var(--font-display)] text-2xl font-semibold tracking-[-0.03em] text-[var(--ink-strong)]">
                  原始来源
                </h2>
              </div>
              <div className="rounded-[22px] bg-[var(--surface-muted)] p-4">
                <p className="text-sm font-semibold text-[var(--ink-strong)]">{details.sourceLabel}</p>
                <p className="mt-2 text-xs leading-6 text-[var(--ink-muted)]">
                  仅显示来源主机名，避免在详情页暴露不必要的查询参数。
                </p>
              </div>
              {details.sourceHref ? (
                <a
                  href={details.sourceHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-12 items-center rounded-full bg-[var(--ink-strong)] px-5 py-3 text-sm font-medium text-white transition hover:bg-[var(--accent)]"
                >
                  打开来源链接
                </a>
              ) : null}
            </div>
          </SurfaceCard>

          <SurfaceCard className="p-5 sm:p-6">
            <div className="space-y-4">
              <div>
                <p className="text-xs font-semibold tracking-[0.18em] text-[var(--accent-deep)] uppercase">
                  Location
                </p>
                <h2 className="mt-2 [font-family:var(--font-display)] text-2xl font-semibold tracking-[-0.03em] text-[var(--ink-strong)]">
                  地图位置
                </h2>
              </div>
              <div className="rounded-[22px] bg-[var(--surface-muted)] p-4">
                <p className="text-sm font-semibold text-[var(--ink-strong)]">{details.location.label}</p>
                <p className="mt-2 text-sm leading-7 text-[var(--ink-soft)]">{details.location.description}</p>
              </div>
              {hasLocationPreview ? <PlaceLocationPreview place={restaurant} /> : null}
            </div>
          </SurfaceCard>

          <PlaceholderCard
            eyebrow="Read only"
            title="想要修正内容？"
            description="详情页不会直接写入数据库。进入编辑页后，现有的字段编辑和合集归属操作仍按原流程执行。"
            actionHref={details.editHref}
            actionLabel="进入编辑页"
          />
        </div>
      </div>
    </AppShell>
  );
}

function DetailField({
  label,
  value,
  multiline = false,
}: {
  label: string;
  value: string | null;
  multiline?: boolean;
}) {
  if (!value) {
    return null;
  }

  return (
    <div className={`rounded-[22px] bg-[var(--surface-muted)] px-4 py-3 ${multiline ? "sm:col-span-2" : ""}`}>
      <p className="text-xs font-medium tracking-[0.08em] text-[var(--ink-muted)] uppercase">{label}</p>
      <p className="mt-2 whitespace-pre-wrap text-sm leading-7 text-[var(--ink-strong)]">{value}</p>
    </div>
  );
}
