import Link from "next/link";
import { unstable_noStore as noStore } from "next/cache";
import { redirect } from "next/navigation";
import { AIEnrichmentCard } from "@/components/ai-enrichment-card";
import { AppShell } from "@/components/app-shell";
import { ExtractionConfirmationCard } from "@/components/extraction-confirmation-card";
import { ManualEvidenceRecoveryCard } from "@/components/manual-evidence-recovery-card";
import { PlaceholderCard } from "@/components/placeholder-card";
import { ReviewFinalPreviewCard } from "@/components/review-final-preview-card";
import { ReviewCollectionSelector } from "@/components/review-collection-selector";
import { SourceReviewCard } from "@/components/source-review-card";
import { requireAuthenticatedUser } from "@/lib/auth/require-user";
import {
  buildAIEnrichmentResultFromSnapshot,
  getMissingAIReviewFields,
  normalizeAIEnrichmentResult,
  runAIEnrichment,
  type AIProposedFieldName,
} from "@/lib/restaurants/ai-enrichment";
import { applyAcceptedAIEnrichment } from "@/lib/restaurants/ai-enrichment-merge";
import {
  appendAIReviewDraftState,
  clearAIReviewDraftState,
  getAIReviewDraftState,
  parseAIReviewDraftState,
} from "@/lib/restaurants/ai-review-state";
import { deepSeekAIEnrichmentProvider } from "@/lib/restaurants/deepseek-provider";
import { runExtractionPipelineWithWebsiteFetch } from "@/lib/restaurants/extraction-architecture";
import { mergePlaceDraftSources } from "@/lib/restaurants/place-draft-merge";
import {
  buildManualEvidenceExtractionResult,
  isWebsiteRecoveryRequired,
  normalizeManualEvidenceText,
} from "@/lib/restaurants/manual-evidence";
import { getCurrentUserCollectionOptions } from "@/lib/restaurants/queries";
import { extractFirstHttpUrl } from "@/lib/restaurants/source-url";
import { getReviewCollectionIds, type ReviewSearchParams } from "@/lib/restaurants/review-form";

type RestaurantReviewPageProps = {
  searchParams?: Promise<ReviewSearchParams & {
    source_url?: string;
    source_urls?: string | string[];
    additional_source_url?: string;
    collection_message?: string;
    collection_error?: string;
    ai_accept?: string | string[];
    ai_accept_factual?: string | string[];
    ai_accept_understanding?: string | string[];
    ai_accepted?: string | string[];
    ai_snapshot?: string | string[];
    ai_snapshot_confidence?: string;
    ai_snapshot_reason?: string;
    ai_reject?: string;
    ai_reject_factual?: string;
    ai_reject_understanding?: string;
    manual_evidence?: string;
    ai_refresh?: string;
  }>;
};

function getAcceptedAIFields(
  ...valuesToAccept: Array<string | string[] | undefined>
): AIProposedFieldName[] {
  const values = valuesToAccept.flatMap((value) =>
    Array.isArray(value) ? value : value ? [value] : [],
  );
  const allowed = new Set<AIProposedFieldName>([
    "address",
    "phone",
    "city",
    "category",
    "cuisine",
    "summary",
  ]);

  return values.filter((field): field is AIProposedFieldName => allowed.has(field as AIProposedFieldName));
}

function getReviewSourceUrls(params: {
  source_url?: string;
  source_urls?: string | string[];
  additional_source_url?: string;
}) {
  const inputs = [
    params.source_url,
    ...(Array.isArray(params.source_urls)
      ? params.source_urls
      : params.source_urls
        ? [params.source_urls]
        : []),
    params.additional_source_url,
  ].filter((value): value is string => Boolean(value?.trim()));

  return Array.from(
    new Set(
      inputs
        .map((input) => extractFirstHttpUrl(input))
        .filter((value): value is string => Boolean(value)),
    ),
  );
}

export default async function RestaurantReviewPage({
  searchParams,
}: RestaurantReviewPageProps) {
  noStore();
  const user = await requireAuthenticatedUser();
  const params = (await searchParams) ?? {};
  const { collections: collectionOptions } = await getCurrentUserCollectionOptions();
  const selectedCollectionIds = getReviewCollectionIds(params.collection_ids);
  const sourceUrls = getReviewSourceUrls(params);
  const normalizedSourceUrl = sourceUrls[0] ?? null;

  if (!normalizedSourceUrl) {
    redirect(
      `/restaurants/new?source_error=${encodeURIComponent(
        "请先粘贴有效的来源链接或分享文案。",
      )}`,
    );
  }

  const extractionPipelines = await Promise.all(
    sourceUrls.map((sourceUrl) => runExtractionPipelineWithWebsiteFetch(sourceUrl)),
  );
  const manualEvidenceAttempted = params.manual_evidence !== undefined;
  const normalizedManualEvidence = manualEvidenceAttempted
    ? normalizeManualEvidenceText(params.manual_evidence)
    : null;
  const manualEvidenceText = normalizedManualEvidence?.ok ? normalizedManualEvidence.text : null;
  const manualEvidenceError = normalizedManualEvidence && !normalizedManualEvidence.ok
    ? normalizedManualEvidence.error
    : null;
  const manualEvidenceResult = manualEvidenceText
    ? buildManualEvidenceExtractionResult(normalizedSourceUrl, manualEvidenceText)
    : null;
  const extractionResults = [
    ...extractionPipelines.map((pipeline) => pipeline.result),
    ...(manualEvidenceResult ? [manualEvidenceResult] : []),
  ];
  const aiExtractionResults = manualEvidenceResult
    ? extractionResults.filter(
        (result) =>
          result === manualEvidenceResult ||
          result.extractionStatus !== "unavailable" ||
          result.sourceType !== "website",
      )
    : extractionResults;
  const mergedDraft = mergePlaceDraftSources(extractionResults, {
    ...(params.name !== undefined ? { name: params.name } : {}),
    ...(params.city !== undefined ? { city: params.city } : {}),
    ...(params.category !== undefined ? { category: params.category } : {}),
    ...(params.address !== undefined ? { address: params.address } : {}),
    ...(params.cuisine !== undefined ? { cuisine: params.cuisine } : {}),
    ...(params.note !== undefined ? { notes: params.note } : {}),
  });
  const isForcedReanalysis = params.ai_refresh === "1";
  const storedAIState = isForcedReanalysis ? null : parseAIReviewDraftState(params);
  const acceptedAIFields = isForcedReanalysis
    ? []
    : storedAIState?.acceptedFields ?? getAcceptedAIFields(
    params.ai_accept,
    params.ai_accept_factual,
    params.ai_accept_understanding,
  );
  const rejectedAIGroups = storedAIState?.rejectedGroups ?? [];
  const rawAIEnrichment = manualEvidenceAttempted && !manualEvidenceText
    ? {
        status: "no_changes" as const,
        message: manualEvidenceError ?? "请先粘贴网页中可见的文字。",
        proposal: null,
      }
    : isForcedReanalysis
    ? await runAIEnrichment(
        {
          mergedPlaceDraft: mergedDraft,
          extractedSourceData: aiExtractionResults,
          sourceUrls,
          missingFields: getMissingAIReviewFields(mergedDraft),
          userId: user.userId,
          forceRefresh: true,
        },
        deepSeekAIEnrichmentProvider,
      )
    : params.ai_reject === "1"
    ? {
        status: "no_changes" as const,
        message: "AI suggestions were rejected without changing the current draft.",
        proposal: null,
      }
    : storedAIState
      ? buildAIEnrichmentResultFromSnapshot(
          storedAIState.snapshot,
          storedAIState.confidence,
          storedAIState.reasoningSummary,
        )
    : await runAIEnrichment(
        {
          mergedPlaceDraft: mergedDraft,
          extractedSourceData: aiExtractionResults,
          sourceUrls,
          missingFields: getMissingAIReviewFields(mergedDraft),
          userId: user.userId,
        },
        deepSeekAIEnrichmentProvider,
      );
  const aiEnrichment = normalizeAIEnrichmentResult(rawAIEnrichment);
  const aiDraftState = getAIReviewDraftState(
    aiEnrichment,
    acceptedAIFields,
    rejectedAIGroups,
  );

  if (!storedAIState && aiDraftState) {
    const query = new URLSearchParams();

    for (const [key, value] of Object.entries(params)) {
      if (Array.isArray(value)) {
        value.forEach((entry) => query.append(key, entry));
      } else if (typeof value === "string") {
        query.set(key, value);
      }
    }

    const stateQuery = appendAIReviewDraftState(query, aiDraftState);
    stateQuery.delete("ai_refresh");

    if (manualEvidenceText) {
      stateQuery.set("manual_evidence", manualEvidenceText);
    }

    redirect(`/restaurants/review?${stateQuery.toString()}`);
  }

  if (isForcedReanalysis) {
    const refreshedQuery = clearAIReviewDraftState(new URLSearchParams(
      Object.entries(params).flatMap(([key, value]) =>
        Array.isArray(value)
          ? value.map((entry) => [key, entry] as [string, string])
          : typeof value === "string"
            ? [[key, value] as [string, string]]
            : [],
      ),
    ));
    refreshedQuery.delete("ai_refresh");
    redirect(`/restaurants/review?${refreshedQuery.toString()}`);
  }

  if (manualEvidenceText && params.manual_evidence !== manualEvidenceText) {
    const normalizedQuery = new URLSearchParams();

    for (const [key, value] of Object.entries(params)) {
      if (Array.isArray(value)) {
        value.forEach((entry) => normalizedQuery.append(key, entry));
      } else if (typeof value === "string") {
        normalizedQuery.set(key, value);
      }
    }

    normalizedQuery.set("manual_evidence", manualEvidenceText);
    redirect(`/restaurants/review?${normalizedQuery.toString()}`);
  }
  const reviewDraft = applyAcceptedAIEnrichment(
    mergedDraft,
    aiEnrichment,
    acceptedAIFields,
  );
  const websiteRecoveryPipelines = extractionPipelines.filter(
    (pipeline) => isWebsiteRecoveryRequired({
      sourceType: pipeline.detection.sourceType,
      extractionStatus: pipeline.result.extractionStatus,
      fetchStatus: pipeline.fetchResult?.fetchStatus,
    }),
  );
  const showManualEvidenceRecovery = websiteRecoveryPipelines.length > 0 || Boolean(manualEvidenceAttempted);
  const recoveryMessage = manualEvidenceError ?? undefined;
  const refreshParams = Object.entries(params).flatMap(([key, value]) =>
    Array.isArray(value)
      ? value.map((entry) => [key, entry] as const)
      : typeof value === "string"
        ? [[key, value] as const]
        : [],
  ).filter(([key]) => key !== "ai_refresh");
  refreshParams.push(["ai_refresh", "1"]);

  return (
    <AppShell
      currentPath="/restaurants/new"
      eyebrow="保存前确认"
      title="先检查地点字段，再决定是否保存"
      description="当前 V1 会把多个来源统一到同一个确认页。各来源先分别解析，再按字段优先级合并成可编辑草稿。"
      userEmail={user.email}
      userId={user.userId}
      actions={
        <>
          <Link
            href="/restaurants/new"
            className="inline-flex rounded-full bg-[var(--accent)] px-5 py-3 text-sm font-semibold text-white shadow-[0_18px_38px_rgba(255,91,0,0.28)] transition hover:bg-[var(--accent-deep)]"
          >
            返回来源入口
          </Link>
          <Link
            href="/restaurants"
            className="inline-flex rounded-full border border-[var(--border-soft)] bg-white px-5 py-3 text-sm font-medium text-[var(--ink-strong)] transition hover:border-[var(--accent)] hover:text-[var(--accent)]"
          >
            回到已收藏
          </Link>
        </>
      }
    >
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
        <div className="space-y-4">
          <SourceReviewCard
            sourceUrl={normalizedSourceUrl}
            extractionResults={extractionResults}
            mergedDraft={mergedDraft}
            sourceUrls={sourceUrls}
          />
          <ReviewFinalPreviewCard
            draft={reviewDraft}
            extractionResults={extractionResults}
            collectionOptions={collectionOptions}
            selectedCollectionIds={selectedCollectionIds}
          />
          <ReviewCollectionSelector
            collectionOptions={collectionOptions}
            selectedCollectionIds={selectedCollectionIds}
            sourceUrl={normalizedSourceUrl}
            message={params.collection_message ?? params.collection_error}
            aiDraftState={aiDraftState}
            draftValues={{
              ...(params.name !== undefined ? { name: params.name } : {}),
              ...(params.city !== undefined ? { city: params.city } : {}),
              ...(params.address !== undefined ? { address: params.address } : {}),
              ...(params.category !== undefined ? { category: params.category } : {}),
              ...(params.cuisine !== undefined ? { cuisine: params.cuisine } : {}),
              ...(params.note !== undefined ? { note: params.note } : {}),
            }}
            manualEvidence={manualEvidenceText ?? undefined}
          />
          <ExtractionConfirmationCard
            sourceUrl={normalizedSourceUrl}
            searchParams={params}
            mergedDraft={reviewDraft}
            sourceUrls={sourceUrls}
            acceptedAIFields={acceptedAIFields}
          />
        </div>

        <div className="space-y-4">
          {showManualEvidenceRecovery ? (
            <ManualEvidenceRecoveryCard
              sourceUrl={normalizedSourceUrl}
              sourceUrls={sourceUrls}
              value={manualEvidenceText ?? ""}
              error={recoveryMessage ?? websiteRecoveryPipelines[0]?.result.message}
              aiDraftState={aiDraftState}
              selectedCollectionIds={selectedCollectionIds}
              draftValues={{
                ...(params.name !== undefined ? { name: params.name } : {}),
                ...(params.city !== undefined ? { city: params.city } : {}),
                ...(params.address !== undefined ? { address: params.address } : {}),
                ...(params.category !== undefined ? { category: params.category } : {}),
                ...(params.cuisine !== undefined ? { cuisine: params.cuisine } : {}),
                ...(params.note !== undefined ? { note: params.note } : {}),
              }}
            />
          ) : null}
          <AIEnrichmentCard
            result={aiEnrichment}
            sourceUrl={normalizedSourceUrl}
            sourceUrls={sourceUrls}
            rejectedGroups={rejectedAIGroups}
            acceptedFields={acceptedAIFields}
            refreshParams={refreshParams}
          />
          <PlaceholderCard
            title="这一步现在重点做什么"
            description="这个入口现在把来源入口、单页获取、字段解析、来源合并、手动复核和最终保存拆成清晰的边界。"
            items={[
              "网站来源只获取当前 URL 的单页 HTML，不会跟随页面链接。",
              "确认页只负责显示和编辑准备保存的字段。",
              "点击保存前不会写入任何地点记录。",
            ]}
          />
          <PlaceholderCard
            title="为后续提取预留边界"
            description="网站获取失败时仍会保留确认页和手动录入，不会影响其他来源的现有行为。"
            items={[
              "当前不会做 Xiaohongshu、Douyin 或其他来源抓取。",
              "不会做图片提取、AI parsing、地理编码或坐标补全。",
              "不会影响现有地图、城市过滤和已保存地点行为。",
            ]}
          />
        </div>
      </div>
    </AppShell>
  );
}
