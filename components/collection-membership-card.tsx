"use client";

import { useMemo } from "react";
import { updateRestaurantCollectionsAction } from "@/app/restaurants/actions";
import { SurfaceCard } from "@/components/surface-card";
import type { CollectionOptionItem } from "@/lib/restaurants/types";

type CollectionMembershipCardProps = {
  restaurantId: number;
  collectionOptions: CollectionOptionItem[];
  selectedCollectionIds: number[];
  message?: string;
  error?: string;
};

export function CollectionMembershipCard({
  restaurantId,
  collectionOptions,
  selectedCollectionIds,
  message,
  error,
}: CollectionMembershipCardProps) {
  const selectedCollections = useMemo(
    () =>
      collectionOptions.filter((collection) => selectedCollectionIds.includes(collection.id)),
    [collectionOptions, selectedCollectionIds],
  );

  return (
    <SurfaceCard className="p-5 sm:p-6">
      <div className="space-y-5">
        <div className="space-y-2">
          <span className="inline-flex rounded-full bg-[var(--accent-soft)] px-3 py-1 text-xs font-semibold tracking-[0.18em] text-[var(--accent-deep)] uppercase">
            合集归类
          </span>
          <div>
            <h2 className="[font-family:var(--font-display)] text-2xl font-semibold tracking-[-0.03em] text-[var(--ink-strong)]">
              把这条地点放进一个或多个合集
            </h2>
            <p className="mt-2 text-sm leading-7 text-[var(--ink-soft)]">
              合集只负责组织已保存地点，不会复制地点数据，也不会影响现有地图和搜索流程。
            </p>
          </div>
        </div>

        {message ? (
          <div className="rounded-[24px] border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            {message}
          </div>
        ) : null}

        {error ? (
          <div className="rounded-[24px] border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {error}
          </div>
        ) : null}

        <div className="space-y-3">
          <p className="text-sm font-medium text-[var(--ink-strong)]">当前所属合集</p>
          {selectedCollections.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {selectedCollections.map((collection) => (
                <span
                  key={collection.id}
                  className="rounded-full bg-[var(--surface-muted)] px-3 py-1 text-xs font-medium text-[var(--ink-soft)]"
                >
                  {collection.name}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-sm leading-7 text-[var(--ink-soft)]">
              这条地点还没有加入任何合集。
            </p>
          )}
        </div>

        {collectionOptions.length > 0 ? (
          <form action={updateRestaurantCollectionsAction} className="space-y-4">
            <input type="hidden" name="restaurant_id" value={restaurantId} />
            <div className="grid gap-3">
              {collectionOptions.map((collection) => (
                <label
                  key={collection.id}
                  className="flex cursor-pointer items-start gap-3 rounded-[24px] border border-[var(--border-soft)] bg-[var(--surface-muted)] p-4 transition hover:border-[var(--accent)]/45"
                >
                  <input
                    type="checkbox"
                    name="collection_ids"
                    value={collection.id}
                    defaultChecked={selectedCollectionIds.includes(collection.id)}
                    className="mt-1 h-4 w-4 accent-[var(--accent)]"
                  />
                  <span className="text-sm font-medium text-[var(--ink-strong)]">
                    {collection.name}
                  </span>
                </label>
              ))}
            </div>

            <button
              type="submit"
              className="inline-flex justify-center rounded-full bg-[var(--accent)] px-5 py-3.5 text-sm font-semibold text-white shadow-[0_18px_38px_rgba(255,91,0,0.28)] transition hover:bg-[var(--accent-deep)]"
            >
              更新合集归属
            </button>
          </form>
        ) : (
          <p className="text-sm leading-7 text-[var(--ink-soft)]">
            你还没有创建任何合集。先去合集页创建一个，再回来把这条地点归进去。
          </p>
        )}
      </div>
    </SurfaceCard>
  );
}
