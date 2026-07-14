import Link from "next/link";
import { buildSourceIntake } from "@/lib/restaurants/source-intake";
import { SurfaceCard } from "@/components/surface-card";
import type { ExtractedField } from "@/lib/restaurants/extraction-architecture";

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

const reviewFieldLabels: Record<ExtractedField, string> = {
  name: "地点名称",
  category: "分类",
  city: "城市",
  address: "地址",
  latitude: "纬度",
  longitude: "经度",
  notes: "备注",
};

function getConfidenceLabel(confidence: ReturnType<typeof buildSourceIntake>["extractionResult"]["confidence"]) {
  switch (confidence) {
    case "high":
      return "高置信度";
    case "medium":
      return "中置信度";
    default:
      return "低置信度";
  }
}

export function SourceReviewCard({ sourceUrl }: SourceReviewCardProps) {
  const intake = buildSourceIntake(sourceUrl);
  const extractionLabel =
    intake.extractionStatus === "success"
      ? "提取可用"
      : intake.extractionStatus === "partial"
        ? "部分提取"
        : "提取不可用";
  const extractedFields = intake.extractionResult.extractedFields;
  const reviewFields: ExtractedField[] = ["name", "address", "category", "city"];
  const hasCoordinates =
    extractedFields.includes("latitude") && extractedFields.includes("longitude");
  const foundFields = extractedFields.filter(
    (field) => field !== "latitude" && field !== "longitude",
  );
  const fieldsNeedingReview = reviewFields.filter(
    (field) => !extractedFields.includes(field),
  );

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

        <div className="rounded-[24px] border border-[var(--border-soft)] bg-white/70 p-4">
          <p className="text-xs font-semibold tracking-[0.16em] text-[var(--accent-deep)] uppercase">
            提取质量
          </p>
          <p className="mt-3 text-sm leading-7 text-[var(--ink-soft)]">
            {intake.extractionResult.message} · {getConfidenceLabel(intake.extractionResult.confidence)}
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div className="rounded-[20px] bg-emerald-50 p-3">
              <p className="text-xs font-semibold text-emerald-700">已找到的信息</p>
              {foundFields.length > 0 || hasCoordinates ? (
                <ul className="mt-2 space-y-1 text-sm text-emerald-800">
                  {foundFields.map((field) => (
                    <li key={field}>✓ {reviewFieldLabels[field]}</li>
                  ))}
                  {hasCoordinates ? <li>✓ 坐标</li> : null}
                </ul>
              ) : (
                <p className="mt-2 text-sm text-emerald-800">暂无可安全使用的信息</p>
              )}
            </div>
            <div className="rounded-[20px] bg-amber-50 p-3">
              <p className="text-xs font-semibold text-amber-700">仍需手动确认</p>
              {fieldsNeedingReview.length > 0 ? (
                <ul className="mt-2 space-y-1 text-sm text-amber-800">
                  {fieldsNeedingReview.map((field) => (
                    <li key={field}>○ {reviewFieldLabels[field]}</li>
                  ))}
                </ul>
              ) : (
                <p className="mt-2 text-sm text-amber-800">核心字段已找到</p>
              )}
            </div>
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
              当前提取器只读取 URL 中明确存在的信息，不会抓取网页、调用外部 API 或自动解析图片和文案。
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
