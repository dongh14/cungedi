import { SurfaceCard } from "@/components/surface-card";
import type { CollectionOptionItem } from "@/lib/restaurants/types";
import type { NormalizedExtractionResult } from "@/lib/restaurants/extraction-architecture";
import { getConflictingReviewFields, getReviewSourceBadges } from "@/lib/restaurants/review-final";
import type { MergedPlaceDraft, PlaceDraftField, PlaceDraftSource } from "@/lib/restaurants/place-draft-merge";

const fieldLabels: Record<PlaceDraftField, string> = {
  name: "地点名称",
  category: "分类",
  cuisine: "子分类",
  city: "城市",
  address: "地址",
  phone: "电话",
  notes: "备注",
  description: "描述",
  latitude: "纬度",
  longitude: "经度",
  websiteUrl: "官网链接",
  imageUrl: "图片",
};

function sourceLabel(source: PlaceDraftSource) {
  switch (source) {
    case "google_maps":
      return "Google Maps";
    case "website":
      return "Website";
    case "manual":
      return "Manual input";
    case "ai_suggestion":
      return "AI suggestion";
    default:
      return source;
  }
}

function hasValue(value: string | number | null) {
  return typeof value === "number" ? Number.isFinite(value) : Boolean(value?.trim());
}

export function ReviewFinalPreviewCard({
  draft,
  extractionResults,
  collectionOptions,
  selectedCollectionIds,
}: {
  draft: MergedPlaceDraft;
  extractionResults: NormalizedExtractionResult[];
  collectionOptions: CollectionOptionItem[];
  selectedCollectionIds: number[];
}) {
  const confirmedFields: PlaceDraftField[] = ["name", "category", "cuisine", "city", "address", "phone", "notes"];
  const missingOptionalFields = ["address", "phone", "notes"].filter(
    (field) => !hasValue(draft[field as PlaceDraftField]),
  ) as PlaceDraftField[];
  const conflicts = getConflictingReviewFields(extractionResults);
  const sourceBadges = getReviewSourceBadges(draft);
  const selectedCollections = collectionOptions.filter((collection) =>
    selectedCollectionIds.includes(collection.id),
  );

  return (
    <SurfaceCard className="p-5 sm:p-6">
      <div className="space-y-5">
        <div>
          <span className="inline-flex rounded-full bg-[var(--accent-soft)] px-3 py-1 text-xs font-semibold tracking-[0.16em] text-[var(--accent-deep)] uppercase">
            最终预览
          </span>
          <h2 className="mt-3 [font-family:var(--font-display)] text-2xl font-semibold tracking-[-0.03em] text-[var(--ink-strong)]">
            保存前快速确认
          </h2>
          <p className="mt-2 text-sm leading-7 text-[var(--ink-soft)]">
            下方是当前合并草稿的预览。任何字段都可以继续编辑，确认后才会保存。
          </p>
        </div>

        <div className="rounded-[24px] border border-[var(--border-soft)] bg-[var(--surface-muted)] p-4">
          <dl className="space-y-3">
            {confirmedFields.map((field) => (
              <div key={field} className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between sm:gap-4">
                <dt className="text-xs font-semibold tracking-[0.12em] text-[var(--ink-muted)] uppercase">
                  {fieldLabels[field]}
                </dt>
                <dd className="text-sm text-[var(--ink-strong)]">
                  {hasValue(draft[field]) ? String(draft[field]) : "未填写"}
                </dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="space-y-2">
          <p className="text-xs font-semibold tracking-[0.14em] text-[var(--ink-muted)] uppercase">
            图片
          </p>
          {hasValue(draft.imageUrl) ? (
            <div className="overflow-hidden rounded-[22px] border border-[var(--border-soft)] bg-[var(--surface-muted)]">
              <img
                src={draft.imageUrl ?? undefined}
                alt={draft.name ?? "地点图片预览"}
                className="max-h-72 w-full object-cover"
              />
              <p className="px-4 py-3 text-xs text-[var(--ink-soft)]">
                来源：{sourceLabel(draft.fieldSources.imageUrl ?? "manual")}
              </p>
            </div>
          ) : (
            <p className="rounded-[22px] border border-dashed border-[var(--border-soft)] bg-[var(--surface-muted)] px-4 py-4 text-sm text-[var(--ink-soft)]">
              暂无图片
            </p>
          )}
        </div>

        <div className="space-y-2">
          <p className="text-xs font-semibold tracking-[0.14em] text-[var(--ink-muted)] uppercase">
            来源
          </p>
          <div className="flex flex-wrap gap-2">
            {sourceBadges.length > 0 ? (
              sourceBadges.map((source) => (
                <span key={source} className="rounded-full bg-[var(--surface-muted)] px-3 py-1 text-xs font-medium text-[var(--ink-soft)]">
                  {sourceLabel(source)}
                </span>
              ))
            ) : (
              <span className="text-sm text-[var(--ink-soft)]">暂无来源归属</span>
            )}
          </div>
        </div>

        {missingOptionalFields.length > 0 ? (
          <div className="rounded-[22px] border border-amber-200 bg-amber-50 p-4 text-sm leading-7 text-amber-800">
            <p className="font-semibold">Optional information missing</p>
            <p className="mt-1">{missingOptionalFields.map((field) => fieldLabels[field]).join("、")} 未填写，可以保存后再补充。</p>
          </div>
        ) : null}

        {conflicts.length > 0 ? (
          <div className="rounded-[22px] border border-orange-200 bg-orange-50 p-4 text-sm leading-7 text-orange-800">
            <p className="font-semibold">有字段存在来源冲突</p>
            <p className="mt-1">{conflicts.map((field) => fieldLabels[field]).join("、")} 已按现有优先级合并，请在下方表单中确认。</p>
          </div>
        ) : null}

        <div className="space-y-2">
          <p className="text-xs font-semibold tracking-[0.14em] text-[var(--ink-muted)] uppercase">
            保存到合集
          </p>
          <div className="flex flex-wrap gap-2">
            {selectedCollections.length > 0 ? (
              selectedCollections.map((collection) => (
                <span key={collection.id} className="rounded-full bg-[var(--accent-soft)] px-3 py-1 text-xs font-medium text-[var(--accent-deep)]">
                  {collection.name}
                </span>
              ))
            ) : (
              <span className="text-sm text-[var(--ink-soft)]">未选择合集</span>
            )}
          </div>
        </div>
      </div>
    </SurfaceCard>
  );
}
