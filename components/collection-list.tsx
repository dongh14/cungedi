import Link from "next/link";
import { AppIcon } from "@/components/app-icon";
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
    <div className="collection-list-grid">
      {collections.map((collection) => (
        <section key={collection.id} id={`collection-${collection.id}`} className="collection-card">
          <Link href={`/collections#collection-${collection.id}`} className="collection-card-cover">
            <span className="collection-cover-icon"><AppIcon name="folder" size={25} /></span>
            <span className="collection-card-date">{formatSavedDate(collection.created_at)}</span>
          </Link>
          <div className="collection-card-body">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0"><h3>{collection.name}</h3><p>{collection.place_count} 个地点</p></div>
              <AppIcon name="chevron" size={16} className="mt-1 shrink-0 text-[var(--ink-muted)]" />
            </div>

          {collection.places?.length ? (
            <div className="collection-card-places">
              {collection.places.map((place) => {
                const placeCard = getCollectionPlaceCardDisplayData(place);

                return (
                  <Link
                    key={place.id}
                    href={placeCard.detailHref}
                    className="collection-mini-place"
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
          </div>
        </section>
      ))}
    </div>
  );
}
