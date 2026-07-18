import { SurfaceCard } from "@/components/surface-card";
import type { AIReviewDraftState } from "@/lib/restaurants/ai-review-state";

type ManualEvidenceRecoveryCardProps = {
  sourceUrl: string;
  sourceUrls: string[];
  value: string;
  error?: string;
  aiDraftState?: AIReviewDraftState | null;
  selectedCollectionIds?: number[];
  draftValues?: Partial<Record<"name" | "city" | "address" | "category" | "cuisine" | "note", string>>;
};

export function ManualEvidenceRecoveryCard({
  sourceUrl,
  sourceUrls,
  value,
  error,
  aiDraftState,
  selectedCollectionIds = [],
  draftValues = {},
}: ManualEvidenceRecoveryCardProps) {
  return (
    <SurfaceCard className="p-5 sm:p-6">
      <div className="space-y-4">
        <div>
          <span className="inline-flex rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold tracking-[0.16em] text-amber-800 uppercase">
            网站读取恢复
          </span>
          <h2 className="mt-3 [font-family:var(--font-display)] text-2xl font-semibold tracking-[-0.03em] text-[var(--ink-strong)]">
            无法自动读取网页
          </h2>
          <p className="mt-2 text-sm leading-7 text-[var(--ink-soft)]">
            你可以粘贴网页中可见的介绍、地址或联系方式，系统会重新整理。
          </p>
        </div>

        {error ? (
          <div className="rounded-[20px] border border-rose-200 bg-rose-50 px-4 py-3 text-sm leading-7 text-rose-700">
            {error}
          </div>
        ) : null}

        <form method="get" action="/restaurants/review" className="space-y-3">
          <input type="hidden" name="source_url" value={sourceUrl} />
          {sourceUrls.slice(1).map((url) => (
            <input key={url} type="hidden" name="source_urls" value={url} />
          ))}
          {selectedCollectionIds.map((collectionId) => (
            <input key={collectionId} type="hidden" name="collection_ids" value={collectionId} />
          ))}
          {Object.entries(draftValues).map(([field, fieldValue]) => (
            <input key={field} type="hidden" name={field} value={fieldValue} />
          ))}
          {aiDraftState?.snapshot.map((field) => (
            <input
              key={`ai-snapshot-${field.field}`}
              type="hidden"
              name="ai_snapshot"
              value={JSON.stringify(field)}
            />
          ))}
          {aiDraftState?.acceptedFields.map((field) => (
            <input key={`ai-accepted-${field}`} type="hidden" name="ai_accepted" value={field} />
          ))}
          {aiDraftState ? (
            <>
              <input type="hidden" name="ai_snapshot_confidence" value={aiDraftState.confidence} />
              <input type="hidden" name="ai_snapshot_reason" value={aiDraftState.reasoningSummary} />
              {aiDraftState.rejectedGroups.map((group) => (
                <input key={`ai-reject-${group}`} type="hidden" name={`ai_reject_${group}`} value="1" />
              ))}
            </>
          ) : null}
          <label htmlFor="manual-evidence" className="text-sm font-semibold text-[var(--ink-strong)]">
            粘贴网页文字
          </label>
          <textarea
            id="manual-evidence"
            name="manual_evidence"
            rows={7}
            defaultValue={value}
            maxLength={2400}
            className="w-full rounded-[22px] border border-[var(--border-soft)] bg-[var(--surface-muted)] px-4 py-3.5 text-sm leading-7 text-[var(--ink-strong)] outline-none transition focus:border-[var(--accent)] focus:ring-4 focus:ring-[var(--accent-glow)]"
            placeholder="例如：地点名称、城市、地址、电话和网页介绍"
          />
          <div className="flex items-center justify-between gap-3 text-xs text-[var(--ink-muted)]">
            <span>只处理可见文字，不保存原始网页内容。</span>
            <span>最多 2400 字符</span>
          </div>
          <button
            type="submit"
            className="w-full rounded-full bg-[var(--accent)] px-5 py-3.5 text-sm font-semibold text-white shadow-[0_18px_38px_rgba(255,91,0,0.22)] transition hover:bg-[var(--accent-deep)]"
          >
            重新提取
          </button>
        </form>
        <p className="text-xs leading-6 text-[var(--ink-muted)]">
          也可以跳过这一步，直接在下方编辑表单中手动填写。重新提取不会创建地点记录。
        </p>
      </div>
    </SurfaceCard>
  );
}
