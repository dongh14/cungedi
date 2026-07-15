import { SurfaceCard } from "@/components/surface-card";
import type { AIEnrichmentResult } from "@/lib/restaurants/ai-enrichment";

function getStatusLabel(status: AIEnrichmentResult["status"]) {
  switch (status) {
    case "suggestions_available":
      return "有待确认建议";
    case "no_changes":
      return "无需补充";
    case "failed":
      return "暂时失败";
    default:
      return "暂不可用";
  }
}

export function AIEnrichmentCard({ result }: { result: AIEnrichmentResult }) {
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

          {result.proposal?.proposedFields.length ? (
            <ul className="mt-4 space-y-3">
              {result.proposal.proposedFields.map((field) => (
                <li
                  key={field.field}
                  className="flex flex-col gap-2 rounded-[18px] bg-white p-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <span className="text-sm text-[var(--ink-strong)]">
                    {field.field}: {field.value}
                  </span>
                  <span className="flex gap-2">
                    <button type="button" disabled className="rounded-full border px-3 py-1 text-xs">
                      接受
                    </button>
                    <button type="button" disabled className="rounded-full border px-3 py-1 text-xs">
                      拒绝
                    </button>
                  </span>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      </div>
    </SurfaceCard>
  );
}
