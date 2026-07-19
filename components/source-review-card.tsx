import Link from "next/link";
import { buildSourceIntake } from "@/lib/restaurants/source-intake";
import { SurfaceCard } from "@/components/surface-card";
import { getPlaceCategoryLabel, getPlaceSubtypeLabel } from "@/lib/restaurants/constants";
import type {
  NormalizedExtractionResult,
} from "@/lib/restaurants/extraction-architecture";
import {
  mergePlaceDraftSources,
  type MergedPlaceDraft,
  type PlaceDraftField,
  type PlaceDraftSource,
} from "@/lib/restaurants/place-draft-merge";

type SourceReviewCardProps = {
  sourceUrl: string;
  extractionResult?: NormalizedExtractionResult;
  extractionResults?: NormalizedExtractionResult[];
  mergedDraft?: MergedPlaceDraft;
  sourceUrls?: string[];
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

const reviewFieldLabels: Record<PlaceDraftField, string> = {
  name: "地点名称",
  description: "描述",
  category: "分类",
  cuisine: "子分类",
    city: "城市",
    country: "国家/地区",
    district: "区域 / 街区",
  address: "地址",
  phone: "电话",
  latitude: "纬度",
  longitude: "经度",
  websiteUrl: "官网链接",
  imageUrl: "图片",
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

function getFriendlyExtractionMessage(message: string | null) {
  if (!message) return null;
  if (message.includes("Extraction completed successfully")) return "已找到可用信息";
  if (message.includes("Website blocked the request")) return "网页暂时无法读取，请手动补充";
  if (message.includes("Website unavailable")) return "网页暂时不可用，请手动补充";
  if (message.includes("no extractable metadata")) return "网页没有可直接读取的信息";
  return message.replaceAll("玩乐", "娱乐");
}

export function SourceReviewCard({
  sourceUrl,
  extractionResult,
  extractionResults,
  mergedDraft,
  sourceUrls,
}: SourceReviewCardProps) {
  const intake = buildSourceIntake(sourceUrl);
  const results = extractionResults ?? (extractionResult ? [extractionResult] : [intake.extractionResult]);
  const merged = mergedDraft ?? mergePlaceDraftSources(results);
  const sourceList = sourceUrls?.length ? sourceUrls : [sourceUrl];
  const extractionLabel =
    results.length > 1
      ? `${results.length} 个来源已合并`
      : results[0].extractionStatus === "success"
        ? "信息完整"
        : results[0].extractionStatus === "partial"
          ? "部分信息"
          : "需要补充";
  const reviewDisplayFields: PlaceDraftField[] = [
    "name",
    "address",
    "phone",
    "description",
    "city",
    "country",
    "category",
    "notes",
  ];
  const reviewFields: PlaceDraftField[] = [
    "name",
    "address",
    "phone",
    "city",
    "country",
    "category",
    "notes",
  ];
  const hasDraftValue = (field: PlaceDraftField) => {
    const value = merged[field];

    return typeof value === "number" ? Number.isFinite(value) : Boolean(value?.trim());
  };
  const hasCoordinates = hasDraftValue("latitude") && hasDraftValue("longitude");
  const foundFields = reviewDisplayFields.filter(hasDraftValue);
  const fieldsNeedingReview = reviewFields.filter((field) => !hasDraftValue(field));
  const extractionMessages = Array.from(
    new Set(results.map((result) => getFriendlyExtractionMessage(result.message)).filter(Boolean)),
  );
  const sourceHosts = Array.from(new Set(sourceList.map((value) => {
    try { return new URL(value).hostname.replace(/^www\./, ""); } catch { return "未知来源"; }
  })));
  const getFieldSourceLabel = (source: PlaceDraftSource | undefined) => {
    if (source === "manual") {
      return "手动编辑";
    }

    if (source === "google_maps") {
      return "Google Maps";
    }

    if (source === "manual_evidence") {
      return "用户粘贴的网页文字";
    }

    return source === "website" ? "Website" : source ?? "未知来源";
  };

  return (
    <SurfaceCard className="p-5 sm:p-6">
      <div className="space-y-5">
        <div className="space-y-3">
          <div>
            <div className="form-card-title"><span className="form-card-icon"><span className="status-dot" /></span><h2>来源摘要</h2></div>
            <p className="form-card-subtitle">找到的信息会先放进下面的可编辑表单。</p>
          </div>
        </div>

        <div className="rounded-[24px] border border-[var(--border-soft)] bg-white/70 p-4">
          <p className="text-xs font-semibold tracking-[0.16em] text-[var(--accent-deep)] uppercase">
            提取质量
          </p>
          <p className="mt-3 text-sm leading-7 text-[var(--ink-soft)]">
            {extractionLabel} · {extractionMessages.join(" · ")} · {getConfidenceLabel(
              results.some((result) => result.confidence === "high")
                ? "high"
                : results.some((result) => result.confidence === "medium")
                  ? "medium"
                  : "low",
            )}
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div className="rounded-[20px] bg-emerald-50 p-3">
              <p className="text-xs font-semibold text-emerald-700">已找到的信息</p>
              {foundFields.length > 0 || hasCoordinates ? (
                <ul className="mt-2 space-y-1 text-sm text-emerald-800">
                  {foundFields.map((field) => (
                    <li key={field}>
                      <span>✓ {reviewFieldLabels[field]}</span>
                      <span className="ml-2 text-emerald-700/75">
                        {field === "category"
                          ? getPlaceCategoryLabel(String(merged[field]))
                          : field === "cuisine"
                            ? getPlaceSubtypeLabel(String(merged[field]), merged.category)
                            : String(merged[field])} · {getFieldSourceLabel(merged.fieldSources[field])}
                      </span>
                    </li>
                  ))}
                  {hasCoordinates ? (
                    <li>
                      ✓ 坐标 · {getFieldSourceLabel(merged.fieldSources.latitude)}
                    </li>
                  ) : null}
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
          <p className="mt-3 text-sm leading-7 text-[var(--ink-strong)]">
            {sourceHosts.join("、")}
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

        <form
          method="get"
          action="/restaurants/review"
          className="rounded-[24px] border border-dashed border-[var(--border-soft)] bg-white/70 p-4"
        >
          <input type="hidden" name="source_url" value={sourceUrl} />
          {sourceList.slice(1).map((additionalSourceUrl) => (
            <input
              key={additionalSourceUrl}
              type="hidden"
              name="source_urls"
              value={additionalSourceUrl}
            />
          ))}
          <div className="space-y-3">
            <div>
              <p className="text-sm font-semibold text-[var(--ink-strong)]">合并另一个来源</p>
              <p className="mt-1 text-xs leading-6 text-[var(--ink-muted)]">
                可以再加入一个 Google Maps 或官网链接，系统会在保存前按字段优先级合并。
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <input
                name="additional_source_url"
                type="url"
                required
                className="min-w-0 flex-1 rounded-full border border-[var(--border-soft)] bg-[var(--surface-muted)] px-4 py-3 text-sm text-[var(--ink-strong)] outline-none transition focus:border-[var(--accent)] focus:ring-4 focus:ring-[var(--accent-glow)]"
                placeholder="https://..."
              />
              <button
                type="submit"
                className="rounded-full border border-[var(--border-soft)] bg-white px-5 py-3 text-sm font-semibold text-[var(--ink-strong)] transition hover:border-[var(--accent)] hover:text-[var(--accent)]"
              >
                合并来源
              </button>
            </div>
          </div>
        </form>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-[24px] bg-[var(--surface-muted)] p-4">
            <p className="text-sm font-semibold text-[var(--ink-strong)]">
              当前这个入口会做什么
            </p>
            <p className="mt-2 text-sm leading-7 text-[var(--ink-soft)]">
              已识别来源，并把安全字段带入确认表单。官网只读取当前页面。
            </p>
          </div>
          <div className="rounded-[24px] bg-[var(--surface-muted)] p-4">
            <p className="text-sm font-semibold text-[var(--ink-strong)]">
              当前这个入口不会做什么
            </p>
            <p className="mt-2 text-sm leading-7 text-[var(--ink-soft)]">
              不会爬取其他链接、执行脚本或公开你的地点。
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <Link
            href={`/restaurants/new/manual?source_input=${encodeURIComponent(sourceUrl)}&message=${encodeURIComponent("已带入来源链接，你可以先继续手动补全并保存。")}`}
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
