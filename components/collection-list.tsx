import { SurfaceCard } from "@/components/surface-card";
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
        <SurfaceCard key={collection.id} className="p-5 sm:p-6">
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
        </SurfaceCard>
      ))}
    </div>
  );
}
