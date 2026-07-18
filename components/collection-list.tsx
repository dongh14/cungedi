import Link from "next/link";
import { SurfaceCard } from "@/components/surface-card";
import { getCollectionPlaceCardDisplayData } from "@/lib/restaurants/collection-place-card";
import type { CollectionListItem } from "@/lib/restaurants/types";

type CollectionListProps = {
  collections: CollectionListItem[];
};

function formatSavedDate(value: string) {
  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(value));
}

export function CollectionList({ collections }: CollectionListProps) {
  return (
    <div className="space-y-3">
      {collections.map((collection) => (
        <SurfaceCard key={collection.id} id={`collection-${collection.id}`} className="p-5 sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h3 className="text-lg font-semibold tracking-[-0.03em] text-[var(--ink-strong)]">
                {collection.name}
              </h3>
              <p className="mt-2 text-sm leading-7 text-[var(--ink-soft)]">
                目前包含 {collection.place_count} 条地点记录。
              </p>
            </div>
            <span className="rounded-full bg-[var(--surface-muted)] px-3 py-1 text-xs font-medium text-[var(--ink-soft)]">
              创建于 {formatSavedDate(collection.created_at)}
            </span>
          </div>

          {collection.places?.length ? (
            <div className="mt-5 grid gap-2 sm:grid-cols-2">
              {collection.places.map((place) => {
                const placeCard = getCollectionPlaceCardDisplayData(place);

                return (
                  <Link
                    key={place.id}
                    href={placeCard.detailHref}
                    className="rounded-[22px] border border-[var(--border-soft)] bg-white/75 p-4 transition hover:border-[var(--accent)]/45 focus:outline-none focus-visible:ring-4 focus-visible:ring-[var(--accent-glow)]"
                  >
                    <p className="truncate text-sm font-semibold text-[var(--ink-strong)]">{placeCard.name}</p>
                    <p className="mt-1 truncate text-xs text-[var(--ink-soft)]">
                      {placeCard.metadata}
                    </p>
                  </Link>
                );
              })}
            </div>
          ) : null}
        </SurfaceCard>
      ))}
    </div>
  );
}
