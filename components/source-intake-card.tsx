import { startSourceIntakeAction } from "@/app/restaurants/actions";
import { SurfaceCard } from "@/components/surface-card";

type SourceIntakeCardProps = {
  searchParams: {
    source_error?: string;
    source_message?: string;
    intake_input?: string;
  };
};

export function SourceIntakeCard({ searchParams }: SourceIntakeCardProps) {
  return (
    <SurfaceCard className="p-5 sm:p-6">
      <div className="space-y-5">
        <div className="space-y-3">
          <span className="inline-flex rounded-full bg-[var(--accent-soft)] px-3 py-1 text-xs font-semibold tracking-[0.18em] text-[var(--accent-deep)] uppercase">
            Step 10 来源入口
          </span>
          <div>
            <h2 className="[font-family:var(--font-display)] text-2xl font-semibold tracking-[-0.03em] text-[var(--ink-strong)]">
              先粘贴来源链接或分享文案
            </h2>
            <p className="mt-2 text-sm leading-7 text-[var(--ink-soft)]">
              这一步先把来源入口接好。当前会先识别并标准化其中的链接，再进入提取确认起点；真正的页面抓取和信息提取会留到下一步。
            </p>
          </div>
        </div>

        {searchParams.source_message ? (
          <div className="rounded-[24px] border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            {searchParams.source_message}
          </div>
        ) : null}

        {searchParams.source_error ? (
          <div className="rounded-[24px] border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {searchParams.source_error}
          </div>
        ) : null}

        <form action={startSourceIntakeAction} className="space-y-4">
          <div className="space-y-2">
            <label
              htmlFor="source_input"
              className="text-sm font-medium text-[var(--ink-strong)]"
            >
              来源链接或分享文案
              <span className="ml-1 text-[var(--accent)]">*</span>
            </label>
            <textarea
              id="source_input"
              name="source_input"
              rows={5}
              required
              defaultValue={searchParams.intake_input ?? ""}
              className="w-full rounded-[22px] border border-[var(--border-soft)] bg-[var(--surface-muted)] px-4 py-3.5 text-sm text-[var(--ink-strong)] outline-none transition focus:border-[var(--accent)] focus:ring-4 focus:ring-[var(--accent-glow)]"
              placeholder="可以直接粘贴 Google Maps 或公开网页链接，也可以粘贴一整段小红书 / 抖音分享文案"
            />
            <p className="text-xs leading-6 text-[var(--ink-muted)]">
              当前 V1 官方支持普通公开网页和 Google Maps。小红书、抖音会按 best-effort 方式接入。系统只会先提取其中第一个有效的 http 或 https 链接。
            </p>
          </div>

          <button
            type="submit"
            className="w-full rounded-full bg-[var(--accent)] px-5 py-3.5 text-sm font-semibold text-white shadow-[0_18px_38px_rgba(255,91,0,0.28)] transition hover:bg-[var(--accent-deep)]"
          >
            开始来源确认
          </button>
        </form>
      </div>
    </SurfaceCard>
  );
}
