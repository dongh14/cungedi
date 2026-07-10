import { createRestaurantAction } from "@/app/restaurants/actions";
import { RestaurantFormFields } from "@/components/restaurant-form-fields";
import { SurfaceCard } from "@/components/surface-card";
import type { RestaurantExtractionResult } from "@/lib/restaurants/extraction-types";
import {
  getInitialDraftFormValues,
  getMissingCandidateFields,
  type ReviewSearchParams,
} from "@/lib/restaurants/review-form";

type ExtractionConfirmationCardProps = {
  result: RestaurantExtractionResult;
  searchParams: ReviewSearchParams;
};

function getSaveButtonLabel(result: RestaurantExtractionResult) {
  return result.status === "success" ? "确认并保存这家餐厅" : "手动补全并保存";
}

export function ExtractionConfirmationCard({
  result,
  searchParams,
}: ExtractionConfirmationCardProps) {
  const values = getInitialDraftFormValues(result, searchParams);
  const missingFields = getMissingCandidateFields(result);

  return (
    <SurfaceCard className="p-5 sm:p-6">
      <div className="space-y-5">
        <div className="space-y-3">
          <span className="inline-flex rounded-full bg-[var(--accent-soft)] px-3 py-1 text-xs font-semibold tracking-[0.18em] text-[var(--accent-deep)] uppercase">
            Step 12 确认后保存
          </span>
          <div>
            <h2 className="[font-family:var(--font-display)] text-2xl font-semibold tracking-[-0.03em] text-[var(--ink-strong)]">
              先确认这家餐厅，再决定是否保存
            </h2>
            <p className="mt-2 text-sm leading-7 text-[var(--ink-soft)]">
              这里只会展示当前已接受的提取结果，并允许你继续修改全部 V1 字段。只有你点击保存后，记录才会进入现有的服务端创建流程。
            </p>
          </div>
        </div>

        {searchParams.message ? (
          <div className="rounded-[24px] border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            {searchParams.message}
          </div>
        ) : null}

        {searchParams.error ? (
          <div className="rounded-[24px] border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {searchParams.error}
          </div>
        ) : null}

        <div className="rounded-[24px] border border-[var(--border-soft)] bg-[var(--surface-muted)] p-4">
          <p className="text-xs font-semibold tracking-[0.16em] text-[var(--accent-deep)] uppercase">
            当前保存边界
          </p>
          <ul className="mt-3 space-y-2 text-sm leading-7 text-[var(--ink-soft)]">
            <li>- 不会自动保存任何提取结果。</li>
            <li>- `source_url` 会和这条候选记录一起被保存。</li>
            <li>- 你现在看到或填写的值，会作为最终保存的记录内容。</li>
          </ul>
        </div>

        <div className="rounded-[24px] border border-dashed border-[var(--border-soft)] bg-white/70 p-4">
          <p className="text-sm font-semibold text-[var(--ink-strong)]">仍需你手动确认的字段</p>
          {missingFields.length > 0 ? (
            <div className="mt-3 flex flex-wrap gap-2">
              {missingFields.map((field) => (
                <span
                  key={field.key}
                  className="rounded-full border border-[var(--border-soft)] bg-[var(--surface-muted)] px-3 py-1 text-xs font-medium text-[var(--ink-soft)]"
                >
                  {field.label}
                  {field.required ? " · 必填" : " · 可选"}
                </span>
              ))}
            </div>
          ) : (
            <p className="mt-2 text-sm leading-7 text-[var(--ink-soft)]">
              当前必填字段都已经有草稿，但你仍然可以继续修改名称、城市、地址、菜系、备注和可见范围。
            </p>
          )}
        </div>

        <form action={createRestaurantAction} className="space-y-5">
          <input type="hidden" name="return_to" value="review" />
          <input type="hidden" name="review_source_url" value={result.sourceUrl} />
          <RestaurantFormFields
            values={values}
            sourceLabel="来源链接"
            sourceHint="保存时仍会只写入第一个有效的 http 或 https 链接。你可以修改这条来源，但在点击保存前不会自动创建任何记录。"
          />

          <button
            type="submit"
            className="w-full rounded-full bg-[var(--accent)] px-5 py-3.5 text-sm font-semibold text-white shadow-[0_18px_38px_rgba(255,91,0,0.28)] transition hover:bg-[var(--accent-deep)]"
          >
            {getSaveButtonLabel(result)}
          </button>
        </form>
      </div>
    </SurfaceCard>
  );
}
