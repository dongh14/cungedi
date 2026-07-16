import { SurfaceCard } from "@/components/surface-card";
import type {
  AIEnrichmentResult,
  AIEnrichmentSnapshotField,
  AIProposedFieldName,
  AIProposedField,
  AIProposedFieldGroup,
} from "@/lib/restaurants/ai-enrichment";

function getStatusLabel(status: AIEnrichmentResult["status"]) {
  switch (status) {
    case "suggestions_available":
      return "AI improvement available";
    case "no_changes":
      return "No AI changes needed";
    case "failed":
      return "AI enrichment failed";
    default:
      return "AI enrichment unavailable";
  }
}

const fieldLabels: Record<string, string> = {
  address: "地址",
  phone: "电话",
  city: "城市",
  category: "分类",
  country: "国家/地区",
  cuisine: "子分类",
  tags: "标签",
  summary: "简短总结",
  placeType: "地点类型",
};

const groupLabels: Record<AIProposedFieldGroup, string> = {
  factual: "Verified information",
  understanding: "AI understanding suggestions",
};

const persistedFields = new Set(["address", "phone", "city", "category", "cuisine", "summary"]);

export function AIEnrichmentCard({
  result,
  sourceUrl,
  sourceUrls,
  rejectedGroups = [],
  acceptedFields = [],
}: {
  result: AIEnrichmentResult;
  sourceUrl: string;
  sourceUrls: string[];
  rejectedGroups?: AIProposedFieldGroup[];
  acceptedFields?: AIProposedFieldName[];
}) {
  const groups: AIProposedFieldGroup[] = ["factual", "understanding"];
  const accepted = new Set(acceptedFields);
  const visibleFields = result.proposal?.proposedFields.filter(
    (field) => !rejectedGroups.includes(field.group),
  ) ?? [];

  function renderSnapshotInputs() {
    return (
      <>
        {visibleFields.map((field: AIProposedField) => {
          const snapshot: AIEnrichmentSnapshotField = {
            field: field.field,
            group: field.group,
            value: field.value,
          };

          return (
            <input
              key={`snapshot-${field.field}`}
              type="hidden"
              name="ai_snapshot"
              value={JSON.stringify(snapshot)}
            />
          );
        })}
        {acceptedFields.map((field) => (
          <input key={`accepted-${field}`} type="hidden" name="ai_accepted" value={field} />
        ))}
        <input
          type="hidden"
          name="ai_snapshot_confidence"
          value={result.proposal?.confidence ?? "medium"}
        />
        <input
          type="hidden"
          name="ai_snapshot_reason"
          value={result.proposal?.reasoningSummary ?? ""}
        />
      </>
    );
  }

  function renderGroup(group: AIProposedFieldGroup) {
    const fields = visibleFields.filter((field) => field.group === group);
    const persistableGroupFields = fields.filter((field) => persistedFields.has(field.field));
    const canAccept = persistableGroupFields.some((field) => !accepted.has(field.field));

    if (fields.length === 0) {
      return null;
    }

    return (
      <div key={group} className="space-y-3 rounded-[20px] border border-[var(--border-soft)] bg-white p-3">
        <div>
          <p className="text-sm font-semibold text-[var(--ink-strong)]">{groupLabels[group]}</p>
          <p className="mt-1 text-xs leading-6 text-[var(--ink-soft)]">
            {group === "factual"
              ? "仅显示证据明确支持的地址、电话、城市或国家/地区。"
              : "可根据名称和描述进行分类理解，但不会新增事实。"}
          </p>
        </div>
        <form method="get" action="/restaurants/review" className="space-y-3">
          <input type="hidden" name="source_url" value={sourceUrl} />
          {sourceUrls.slice(1).map((url) => (
            <input key={url} type="hidden" name="source_urls" value={url} />
          ))}
          {renderSnapshotInputs()}
          <ul className="space-y-3">
            {fields.map((field: AIProposedField) => (
              <li key={field.field} className="flex items-start gap-3 rounded-[18px] bg-[var(--surface-muted)] p-3">
                {persistedFields.has(field.field) ? (
                  <input
                    id={`ai-${field.field}`}
                    type="checkbox"
                    name={`ai_accept_${group}`}
                    value={field.field}
                    className="mt-1 h-4 w-4 accent-[var(--accent)]"
                    defaultChecked={accepted.has(field.field)}
                  />
                ) : (
                  <span className="mt-1 inline-flex shrink-0 rounded-full border border-[var(--border-soft)] px-2 py-0.5 text-[10px] font-semibold text-[var(--ink-muted)]">
                    暂不保存
                  </span>
                )}
                <label
                  htmlFor={persistedFields.has(field.field) ? `ai-${field.field}` : undefined}
                  className="min-w-0 text-sm text-[var(--ink-strong)]"
                >
                  <span className="font-semibold">{fieldLabels[field.field] ?? field.field}</span>
                  <span className="ml-2 break-words text-[var(--ink-soft)]">{field.value}</span>
                  {accepted.has(field.field) ? (
                    <span className="ml-2 text-xs font-semibold text-emerald-700">已接受</span>
                  ) : null}
                  {!persistedFields.has(field.field) ? (
                    <span className="mt-1 block text-xs text-[var(--ink-muted)]">
                      当前地点模型没有对应保存字段，仅作为预览展示，不会写入保存结果
                    </span>
                  ) : null}
                </label>
              </li>
            ))}
          </ul>
          <button
            type="submit"
            disabled={!canAccept}
            className="w-full rounded-full bg-[var(--accent)] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[var(--accent-deep)] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {canAccept ? "接受本组所选建议" : "本组建议已填入表单"}
          </button>
        </form>
        <form method="get" action="/restaurants/review">
          <input type="hidden" name="source_url" value={sourceUrl} />
          {sourceUrls.slice(1).map((url) => (
            <input key={url} type="hidden" name="source_urls" value={url} />
          ))}
          {renderSnapshotInputs()}
          <input type="hidden" name={`ai_reject_${group}`} value="1" />
          <button type="submit" className="w-full rounded-full border border-[var(--border-soft)] bg-white px-4 py-3 text-sm font-semibold text-[var(--ink-strong)] transition hover:border-[var(--accent)] hover:text-[var(--accent)]">
            拒绝本组建议
          </button>
        </form>
      </div>
    );
  }

  return (
    <SurfaceCard className="p-5 sm:p-6">
      <div className="space-y-4">
        <div>
          <span className="inline-flex rounded-full bg-[var(--surface-muted)] px-3 py-1 text-xs font-semibold tracking-[0.16em] text-[var(--ink-soft)] uppercase">
            AI enrichment
          </span>
          <h2 className="mt-3 [font-family:var(--font-display)] text-2xl font-semibold tracking-[-0.03em] text-[var(--ink-strong)]">
            可选的智能补充
          </h2>
          <p className="mt-2 text-sm leading-7 text-[var(--ink-soft)]">
            AI 只会提出建议，不会自动覆盖来源提取结果或手动编辑，也不会直接保存到地点记录。
          </p>
        </div>

        <div className="rounded-[22px] border border-[var(--border-soft)] bg-[var(--surface-muted)] p-4">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-semibold text-[var(--ink-strong)]">
              {getStatusLabel(result.status)}
            </p>
            <span className="rounded-full bg-white px-3 py-1 text-xs font-medium text-[var(--ink-soft)]">
              {result.status}
            </span>
          </div>
          <p className="mt-2 text-sm leading-7 text-[var(--ink-soft)]">{result.message}</p>

          {visibleFields.length ? (
            <>
              <div className="mt-4 rounded-[18px] bg-white p-3 text-sm leading-7 text-[var(--ink-soft)]">
                <p><span className="font-semibold text-[var(--ink-strong)]">置信度：</span>{result.proposal?.confidence ?? "-"}</p>
                <p><span className="font-semibold text-[var(--ink-strong)]">原因：</span>{result.proposal?.reasoningSummary ?? "-"}</p>
              </div>
              <div className="mt-4 space-y-3">{groups.map(renderGroup)}</div>
            </>
          ) : null}
        </div>
      </div>
    </SurfaceCard>
  );
}
