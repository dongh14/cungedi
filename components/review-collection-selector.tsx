import { createCollectionAction } from "@/app/restaurants/actions";
import { SurfaceCard } from "@/components/surface-card";
import type { CollectionOptionItem } from "@/lib/restaurants/types";

export function ReviewCollectionSelector({
  collectionOptions,
  selectedCollectionIds,
  sourceUrl,
  message,
  formId = "review-save-form",
}: {
  collectionOptions: CollectionOptionItem[];
  selectedCollectionIds: number[];
  sourceUrl: string;
  message?: string;
  formId?: string;
}) {
  return (
    <SurfaceCard className="p-5 sm:p-6">
      <div className="space-y-4">
        <div>
          <p className="text-xs font-semibold tracking-[0.16em] text-[var(--accent-deep)] uppercase">
            组织保存
          </p>
          <h2 className="mt-2 [font-family:var(--font-display)] text-2xl font-semibold tracking-[-0.03em] text-[var(--ink-strong)]">
            选择合集
          </h2>
          <p className="mt-2 text-sm leading-7 text-[var(--ink-soft)]">
            可以选择一个或多个已有合集；不选择也可以直接保存。
          </p>
        </div>

        {message ? (
          <div className="rounded-[22px] border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            {message}
          </div>
        ) : null}

        {collectionOptions.length > 0 ? (
          <div className="grid gap-3">
            {collectionOptions.map((collection) => (
              <label key={collection.id} className="flex cursor-pointer items-center gap-3 rounded-[20px] border border-[var(--border-soft)] bg-[var(--surface-muted)] p-4 transition hover:border-[var(--accent)]/45">
                <input
                  type="checkbox"
                  name="collection_ids"
                  value={collection.id}
                  form={formId}
                  defaultChecked={selectedCollectionIds.includes(collection.id)}
                  className="h-4 w-4 accent-[var(--accent)]"
                />
                <span className="text-sm font-medium text-[var(--ink-strong)]">{collection.name}</span>
              </label>
            ))}
          </div>
        ) : (
          <p className="rounded-[20px] border border-dashed border-[var(--border-soft)] bg-[var(--surface-muted)] p-4 text-sm leading-7 text-[var(--ink-soft)]">
            还没有合集，可以先创建一个，再回到这里选择。
          </p>
        )}

        <form action={createCollectionAction} className="flex flex-col gap-3 sm:flex-row">
          <input type="hidden" name="return_to" value="review" />
          <input type="hidden" name="source_url" value={sourceUrl} />
          <input
            name="name"
            required
            className="min-w-0 flex-1 rounded-full border border-[var(--border-soft)] bg-white px-4 py-3 text-sm text-[var(--ink-strong)] outline-none transition focus:border-[var(--accent)] focus:ring-4 focus:ring-[var(--accent-glow)]"
            placeholder="新合集名称"
          />
          <button type="submit" className="rounded-full border border-[var(--border-soft)] bg-white px-5 py-3 text-sm font-semibold text-[var(--ink-strong)] transition hover:border-[var(--accent)] hover:text-[var(--accent)]">
            创建合集
          </button>
        </form>
      </div>
    </SurfaceCard>
  );
}
