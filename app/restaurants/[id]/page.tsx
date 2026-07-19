import Link from "next/link";
import { notFound } from "next/navigation";
import { AppIcon } from "@/components/app-icon";
import { AppShell } from "@/components/app-shell";
import { PlaceLocationPreview } from "@/components/place-location-preview";
import { requireAuthenticatedUser } from "@/lib/auth/require-user";
import { getPlaceDetailsDisplayData } from "@/lib/restaurants/place-details";
import { getCurrentUserCollectionsForRestaurant, getCurrentUserRestaurantById } from "@/lib/restaurants/queries";

type RestaurantDetailsPageProps = {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ return_to?: string }>;
};

export default async function RestaurantDetailsPage({ params, searchParams }: RestaurantDetailsPageProps) {
  const user = await requireAuthenticatedUser();
  const routeParams = await params;
  const pageParams = (await searchParams) ?? {};
  const restaurantId = Number(routeParams.id);
  if (!Number.isInteger(restaurantId) || restaurantId <= 0) notFound();

  const { restaurant, error } = await getCurrentUserRestaurantById(restaurantId);
  if (error || !restaurant) notFound();

  const { collections, error: collectionsError } = await getCurrentUserCollectionsForRestaurant(restaurant.id);
  const details = getPlaceDetailsDisplayData({ ...restaurant, collections });
  const hasLocationPreview = details.location.status === "resolved";
  const returnTo = pageParams.return_to?.startsWith("/restaurants") ? pageParams.return_to : "/restaurants";
  const editHref = returnTo === "/restaurants"
    ? details.editHref
    : `${details.editHref}?return_to=${encodeURIComponent(returnTo)}`;

  return (
    <AppShell currentPath="/restaurants" eyebrow="地点" title={details.name} description="查看已保存地点的完整信息。" userEmail={user.email} userId={user.userId}>
      <div className="detail-top-actions">
        <Link href={returnTo} className="icon-text-link"><AppIcon name="back" size={17} />返回地点</Link>
        <Link href={editHref} className="detail-edit-button"><AppIcon name="edit" size={16} />编辑</Link>
      </div>

      <section className="detail-hero">
        <div className="detail-hero-image"><span className="brand-mark-star">✦</span><small>暂无图片</small></div>
        <div className="detail-hero-copy">
          <span className="detail-category">{details.category}{details.subcategory ? ` · ${details.subcategory}` : ""}</span>
          <h1>{details.name}</h1>
          {details.locationLabel ? <p><AppIcon name="pin" size={14} />{details.locationLabel}</p> : null}
        </div>
      </section>

      <div className="detail-grid">
        <div className="detail-column">
          <section className="detail-section">
            <div className="detail-section-heading"><h2>地点信息</h2><span>已保存</span></div>
            <div className="detail-fields">
              <DetailField label="分类" value={details.category} />
              <DetailField label="子分类" value={details.subcategory} />
              <DetailField label="地点位置" value={details.locationLabel} />
              <DetailField label="地址" value={details.address} />
              {details.notes ? <DetailField label="备注" value={details.notes} multiline /> : null}
            </div>
          </section>

          <section className="detail-section">
            <div className="detail-section-heading"><h2>收藏集</h2><span>{details.collections.length} 个</span></div>
            {collectionsError ? <p className="detail-muted">暂时无法读取收藏集，请稍后再试。</p> : details.collections.length > 0 ? <div className="detail-collection-chips">{details.collections.map((collection) => <Link key={collection.id} href={`/collections#collection-${collection.id}`}>{collection.name}</Link>)}</div> : <p className="detail-muted">还没有加入收藏集。</p>}
          </section>
        </div>

        <div className="detail-column">
          <section className="detail-section">
            <div className="detail-section-heading"><h2>来源</h2></div>
            <div className="detail-source"><span className="source-dot"><AppIcon name="external" size={14} /></span><div><strong>{details.sourceLabel}</strong><p>作为外部参考链接保存</p></div></div>
            {details.sourceHref ? <a href={details.sourceHref} target="_blank" rel="noopener noreferrer" className="detail-source-link">查看来源 <AppIcon name="external" size={14} /></a> : null}
          </section>

          <section className="detail-section">
            <div className="detail-section-heading"><h2>地图位置</h2></div>
            <div className="detail-location-copy"><strong>{details.location.label}</strong><p>{details.location.description}</p></div>
            {hasLocationPreview ? <PlaceLocationPreview place={restaurant} /> : null}
          </section>
        </div>
      </div>
    </AppShell>
  );
}

function DetailField({ label, value, multiline = false }: { label: string; value: string | null; multiline?: boolean }) {
  if (!value) return null;
  return <div className={multiline ? "detail-field detail-field-wide" : "detail-field"}><span>{label}</span><p>{value}</p></div>;
}
