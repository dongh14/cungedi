import { createRestaurantAction } from "@/app/restaurants/actions";
import { ReviewSaveButton } from "@/components/review-save-button";
import { AIRefreshControl } from "@/components/ai-refresh-control";
import { RestaurantFormFields } from "@/components/restaurant-form-fields";
import { SurfaceCard } from "@/components/surface-card";
import type { AIEnrichmentStatus } from "@/lib/restaurants/ai-enrichment";
import type { NormalizedExtractionResult } from "@/lib/restaurants/extraction-architecture";
import type { MergedPlaceDraft } from "@/lib/restaurants/place-draft-merge";
import { getInitialDraftFormValues, getMissingDraftFields, type ReviewSearchParams } from "@/lib/restaurants/review-form";

function getSourceHost(sourceUrl: string) {
  try {
    return new URL(sourceUrl).hostname.replace(/^www\./, "");
  } catch {
    return "来源链接";
  }
}

function getSourceLabel(result: NormalizedExtractionResult | undefined) {
  switch (result?.sourceType) {
    case "google_maps":
      return "Google Maps";
    case "xiaohongshu":
      return "小红书链接";
    case "douyin":
      return "抖音链接";
    default:
      return "网页链接";
  }
}

function getSourceStatus(
  results: NormalizedExtractionResult[],
  aiStatus: AIEnrichmentStatus,
) {
  const hasUsableExtraction = results.some(
    (result) => result.extractionStatus === "success" || result.extractionStatus === "partial",
  );

  if (hasUsableExtraction || aiStatus === "suggestions_available") {
    return "已整理";
  }

  if (aiStatus === "failed" || aiStatus === "unavailable") {
    return "部分信息需补充";
  }

  return "链接无法读取";
}

function getSourceResolutionLabel(status: ReviewSearchParams["source_resolution_status"]) {
  switch (status) {
    case "resolved":
      return "短链接已解析";
    case "timeout":
    case "blocked":
    case "invalid":
    case "redirect_limit":
    case "failed":
      return "短链接解析失败，仍可继续";
    case "not_required":
      return "链接已识别";
    default:
      return null;
  }
}

export function ExtractionConfirmationCard({
  sourceUrl,
  searchParams,
  mergedDraft,
  sourceUrls,
  extractionResults = [],
  aiStatus = "unavailable",
  refreshParams = [],
  hideSave = false,
}: {
  sourceUrl: string;
  searchParams: ReviewSearchParams;
  mergedDraft: MergedPlaceDraft;
  sourceUrls?: string[];
  extractionResults?: NormalizedExtractionResult[];
  aiStatus?: AIEnrichmentStatus;
  refreshParams?: Array<readonly [string, string]>;
  hideSave?: boolean;
}) {
  const values = getInitialDraftFormValues(searchParams, sourceUrl, mergedDraft);
  const missingFields = getMissingDraftFields(values);
  const requiredMissingFields = missingFields.filter((field) => field.required);
  const sourceResult = extractionResults[0];
  const sourceStatus = getSourceStatus(extractionResults, aiStatus);
  const sourceLabel = getSourceLabel(sourceResult);
  const sourceResolutionLabel = getSourceResolutionLabel(searchParams.source_resolution_status);

  return (
    <SurfaceCard className="form-surface p-4 sm:p-5">
      <div className="space-y-4">
        <div className="review-source-status">
          <span className="status-dot" aria-hidden="true" />
          <span>已从 {getSourceHost(sourceUrl)} 自动整理</span>
          <strong>{sourceStatus}</strong>
          <small>{sourceLabel}</small>
        </div>
        {sourceResolutionLabel ? (
          <p className="text-sm text-[var(--ink-soft)]">{sourceResolutionLabel}</p>
        ) : null}

        {searchParams.message ? (
          <div className="review-inline-message review-inline-message-success">{searchParams.message}</div>
        ) : null}
        {searchParams.error ? (
          <div className="review-inline-message review-inline-message-error">{searchParams.error}</div>
        ) : null}

        {requiredMissingFields.length > 0 ? (
          <div className="review-missing-note">
            <strong>还需要补充少量信息</strong>
            <span>{requiredMissingFields.map((field) => field.label).join("、")}</span>
          </div>
        ) : missingFields.length > 0 ? (
          <p className="review-optional-note">可选信息暂未填写，不影响保存。</p>
        ) : null}

        <form id="review-save-form" action={createRestaurantAction} className="review-edit-form">
          <input type="hidden" name="return_to" value="review" />
          <input type="hidden" name="review_source_url" value={sourceUrl} />
          {searchParams.resolved_source_url ? <input type="hidden" name="resolved_source_url" value={searchParams.resolved_source_url} /> : null}
          {searchParams.source_resolution_status ? <input type="hidden" name="source_resolution_status" value={searchParams.source_resolution_status} /> : null}
          {searchParams.source_resolution_redirect_count ? <input type="hidden" name="source_resolution_redirect_count" value={searchParams.source_resolution_redirect_count} /> : null}
          {searchParams.manual_evidence ? (
            <input type="hidden" name="manual_evidence" value={searchParams.manual_evidence} />
          ) : null}
          {sourceUrls?.slice(1).map((additionalSourceUrl) => (
            <input key={additionalSourceUrl} type="hidden" name="source_urls" value={additionalSourceUrl} />
          ))}
          <RestaurantFormFields
            values={{ ...values, district: values.district ?? "" }}
            persistToUrl
            compactReview
            sourceLabel="来源链接"
            sourceHint="来源仅作为外部参考保存，不会在你点击保存前创建地点记录。"
          />
          {!hideSave ? (
            <div className="review-final-action">
              <p>确认无误后再保存，地点不会自动创建。</p>
              <ReviewSaveButton />
            </div>
          ) : null}
        </form>
        {refreshParams.length > 0 && (aiStatus === "suggestions_available" || aiStatus === "no_changes") ? (
          <details className="review-more-details">
            <summary>更多操作</summary>
            <div className="review-more-details-content">
              <AIRefreshControl params={refreshParams} />
            </div>
          </details>
        ) : null}
      </div>
    </SurfaceCard>
  );
}
