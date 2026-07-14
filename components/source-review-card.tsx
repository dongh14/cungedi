import Link from "next/link";
import { buildSourceIntake } from "@/lib/restaurants/source-intake";
import { SurfaceCard } from "@/components/surface-card";

type SourceReviewCardProps = {
  sourceUrl: string;
};

function getSourceTypeLabel(sourceType: ReturnType<typeof buildSourceIntake>["sourceType"]) {
  switch (sourceType) {
    case "google_maps":
      return "Google Maps";
    case "xiaohongshu":
      return "小红书";
    case "douyin":
      return "抖音";
    case "instagram":
      return "Instagram";
    case "tiktok":
      return "TikTok";
    case "unknown":
      return "未知来源";
    default:
      return "普通网站";
  }
}

export function SourceReviewCard({ sourceUrl }: SourceReviewCardProps) {
  const intake = buildSourceIntake(sourceUrl);
  const extractionLabel =
    intake.extractionStatus === "success"
      ? "提取可用"
      : intake.extractionStatus === "not_implemented"
        ? "提取不可用（接口已准备，暂未实现）"
        : "提取不可用";

  return (
    <SurfaceCard className="p-5 sm:p-6">
      <div className="space-y-5">
        <div className="space-y-3">
          <span className="inline-flex rounded-full bg-[var(--accent-soft)] px-3 py-1 text-xs font-semibold tracking-[0.18em] text-[var(--accent-deep)] uppercase">
            Step 11 来源检查
          </span>
          <div>
            <h2 className="[font-family:var(--font-display)] text-2xl font-semibold tracking-[-0.03em] text-[var(--ink-strong)]">
              来源链接已经进入保存前确认
            </h2>
            <p className="mt-2 text-sm leading-7 text-[var(--ink-soft)]">
              这一步先只做本地来源识别和保存前确认：系统会记录标准化后的原始链接、识别来源域名，并把地点字段交给你手动检查和补全。自动抓取和 AI 解析还没有在这个入口启用。
            </p>
          </div>
        </div>

        <div className="rounded-[24px] border border-[var(--border-soft)] bg-[var(--surface-muted)] p-4">
          <p className="text-xs font-semibold tracking-[0.16em] text-[var(--accent-deep)] uppercase">
            已识别来源
          </p>
          <p className="mt-3 break-all text-sm leading-7 text-[var(--ink-strong)]">
            {sourceUrl}
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <span className="rounded-full bg-white px-3 py-1 text-xs font-medium text-[var(--ink-soft)]">
              来源域名：{intake.domain}
            </span>
            <span className="rounded-full bg-white px-3 py-1 text-xs font-medium text-[var(--ink-soft)]">
              来源类型：{getSourceTypeLabel(intake.sourceType)}
            </span>
            <span className="rounded-full bg-white px-3 py-1 text-xs font-medium text-[var(--ink-soft)]">
              {extractionLabel}
            </span>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-[24px] bg-[var(--surface-muted)] p-4">
            <p className="text-sm font-semibold text-[var(--ink-strong)]">
              当前这个入口会做什么
            </p>
            <p className="mt-2 text-sm leading-7 text-[var(--ink-soft)]">
              识别来源域名，选择对应的提取器，并把字段带入下一步确认表单。
            </p>
          </div>
          <div className="rounded-[24px] bg-[var(--surface-muted)] p-4">
            <p className="text-sm font-semibold text-[var(--ink-strong)]">
              当前这个入口不会做什么
            </p>
            <p className="mt-2 text-sm leading-7 text-[var(--ink-soft)]">
              当前提取器只返回“暂未实现”状态，不会抓取网页、调用外部 API 或自动解析图片和文案。
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <Link
            href={`/restaurants/new?source_input=${encodeURIComponent(sourceUrl)}&message=${encodeURIComponent("已带入来源链接，你可以先继续手动补全并保存。")}`}
            className="inline-flex justify-center rounded-full bg-[var(--accent)] px-5 py-3.5 text-sm font-semibold text-white shadow-[0_18px_38px_rgba(255,91,0,0.28)] transition hover:bg-[var(--accent-deep)]"
          >
            返回编辑来源
          </Link>
          <a
            href={sourceUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex justify-center rounded-full border border-[var(--border-soft)] bg-white px-5 py-3.5 text-sm font-medium text-[var(--ink-strong)] transition hover:border-[var(--accent)] hover:text-[var(--accent)]"
          >
            打开来源链接
          </a>
        </div>
      </div>
    </SurfaceCard>
  );
}
