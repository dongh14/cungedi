import Link from "next/link";
import { AppIcon } from "@/components/app-icon";
import type { RestaurantListItem } from "@/lib/restaurants/types";
import { getPlaceCategoryLabel, getPlaceSubtypeLabel } from "@/lib/restaurants/constants";
import { cn } from "@/lib/utils";
import { formatHierarchyLocationLabel } from "@/lib/location-hierarchy";

type RestaurantListCardProps = {
  restaurant: RestaurantListItem;
  isNewlyCreated?: boolean;
  returnTo?: string;
};

function getSourceHostLabel(value: string) {
  try { return new URL(value).hostname.replace(/^www\./, ""); } catch { return "原始来源"; }
}

function getReturnAwareHref(path: string, returnTo: string) {
  return returnTo === "/restaurants" ? path : `${path}?return_to=${encodeURIComponent(returnTo)}`;
}

export function RestaurantListCard({ restaurant, isNewlyCreated = false, returnTo = "/restaurants" }: RestaurantListCardProps) {
  const detailHref = getReturnAwareHref(`/restaurants/${restaurant.id}`, returnTo);

  return (
    <article className={cn("saved-place-row", isNewlyCreated && "saved-place-row-new")}>
      <Link href={detailHref} className="saved-place-thumb" aria-label={`查看${restaurant.name}`}>
        <span className="brand-mark-star">✦</span>
      </Link>
      <div className="saved-place-main">
        <div className="saved-place-heading">
          <div className="min-w-0"><h3 className="place-name-title"><Link href={detailHref}>{restaurant.name}</Link></h3><p className="place-card-metadata">{getPlaceCategoryLabel(restaurant.category)}{formatHierarchyLocationLabel(restaurant.country, restaurant.city, restaurant.district) ? ` · ${formatHierarchyLocationLabel(restaurant.country, restaurant.city, restaurant.district)}` : ""}</p></div>
          {isNewlyCreated ? <span className="saved-place-new-label">刚刚保存</span> : <AppIcon name="chevron" size={16} className="shrink-0 text-[var(--ink-muted)]" />}
        </div>
        <div className="saved-place-meta">
          <span>{getPlaceSubtypeLabel(restaurant.cuisine, restaurant.category) || restaurant.address || "还可以继续补充"}</span>
          <span>{getSourceHostLabel(restaurant.source_url)}</span>
        </div>
        <div className="saved-place-actions">
          <Link href={`/restaurants/${restaurant.id}/edit`}><AppIcon name="edit" size={14} />编辑</Link>
          <a href={restaurant.source_url} target="_blank" rel="noreferrer"><AppIcon name="external" size={14} />来源</a>
        </div>
      </div>
    </article>
  );
}
