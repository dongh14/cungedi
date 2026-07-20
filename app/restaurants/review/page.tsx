import Link from "next/link";
import { unstable_noStore as noStore } from "next/cache";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { ExtractionConfirmationCard } from "@/components/extraction-confirmation-card";
import { ManualEvidenceRecoveryCard } from "@/components/manual-evidence-recovery-card";
import { ReviewCollectionSelector } from "@/components/review-collection-selector";
import { requireAuthenticatedUser } from "@/lib/auth/require-user";
import {
  buildAIEnrichmentResultFromSnapshot,
  getMissingAIReviewFields,
  normalizeAIEnrichmentResult,
  runAIEnrichment,
  type AIProposedFieldName,
} from "@/lib/restaurants/ai-enrichment";
import {
  applyAcceptedAIEnrichment,
  getAutoAppliedAIFields,
} from "@/lib/restaurants/ai-enrichment-merge";
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
import { logWorkflowDiagnostic } from "@/lib/restaurants/workflow-diagnostics";

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
    "country",
    "phone",
    "city",
    "district",
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
  const { collections: collectionOptions, error: collectionOptionsError } = await getCurrentUserCollectionOptions();
  const selectedCollectionIds = getReviewCollectionIds(params.collection_ids);
  const sourceUrls = getReviewSourceUrls(params);
  const normalizedSourceUrl = sourceUrls[0] ?? null;

  if (!normalizedSourceUrl) {
    redirect(
      `/restaurants/new/source?source_error=${encodeURIComponent(
        "请先粘贴有效的来源链接或分享文案。",
      )}`,
    );
  }

  const extractionStartedAt = Date.now();
  const extractionPipelines = await Promise.all(
    sourceUrls.map((sourceUrl) => runExtractionPipelineWithWebsiteFetch(sourceUrl)),
  );
  for (const pipeline of extractionPipelines) {
    logWorkflowDiagnostic({
      event: "source_detected",
      sourceUrls: [pipeline.detection.sourceUrl ?? normalizedSourceUrl],
      sourceType: pipeline.detection.sourceType,
    });
    logWorkflowDiagnostic({
      event: "extraction_completed",
      sourceUrls: [pipeline.detection.sourceUrl ?? normalizedSourceUrl],
      sourceType: pipeline.detection.sourceType,
      extractionStatus: pipeline.result.extractionStatus,
      durationMs: Date.now() - extractionStartedAt,
    });
  }
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
    ...(params.country !== undefined ? { country: params.country } : {}),
    ...(params.district !== undefined ? { district: params.district } : {}),
    ...(params.category !== undefined ? { category: params.category } : {}),
    ...(params.address !== undefined ? { address: params.address } : {}),
    ...(params.cuisine !== undefined ? { cuisine: params.cuisine } : {}),
    ...(params.note !== undefined ? { notes: params.note } : {}),
  });
  const isForcedReanalysis = params.ai_refresh === "1";
  const storedAIState = isForcedReanalysis ? null : parseAIReviewDraftState(params);
  const requestedAcceptedAIFields = isForcedReanalysis
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
  const autoAcceptedAIFields = getAutoAppliedAIFields(
    mergedDraft,
    aiEnrichment,
    rejectedAIGroups,
  );
  const acceptedAIFields = Array.from(
    new Set([...requestedAcceptedAIFields, ...autoAcceptedAIFields]),
  );
  logWorkflowDiagnostic({
    event: "ai_completed",
    sourceUrls,
    aiStatus: aiEnrichment.status,
  });
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
  if (acceptedAIFields.length > 0) {
    logWorkflowDiagnostic({
      event: "suggestion_applied",
      sourceUrls,
      suggestionCount: acceptedAIFields.length,
    });
  }
  logWorkflowDiagnostic({
    event: "review_ready",
    sourceUrls,
    aiStatus: aiEnrichment.status,
  });
  const websiteRecoveryPipelines = extractionPipelines.filter(
    (pipeline) => isWebsiteRecoveryRequired({
      sourceType: pipeline.detection.sourceType,
      extractionStatus: pipeline.result.extractionStatus,
      fetchStatus: pipeline.fetchResult?.fetchStatus,
    }),
  );
  const showManualEvidenceRecovery = websiteRecoveryPipelines.length > 0 || Boolean(manualEvidenceAttempted);
  const recoveryMessage = manualEvidenceError ?? undefined;
  const reviewDraftValues = {
    name: reviewDraft.name ?? "",
    city: reviewDraft.city ?? "",
    country: reviewDraft.country ?? "",
    district: reviewDraft.district ?? "",
    address: reviewDraft.address ?? "",
    category: reviewDraft.category ?? "",
    cuisine: reviewDraft.cuisine ?? "",
    note: reviewDraft.notes ?? "",
  };
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
      title="确认地点信息并保存"
      description="信息已自动整理到可编辑表单。检查后再保存，不会自动创建记录。"
      userEmail={user.email}
      userId={user.userId}
      actions={<Link href="/restaurants/new" className="app-text-link">返回添加入口</Link>}
    >
      <div className="review-layout">
        <ExtractionConfirmationCard
          sourceUrl={normalizedSourceUrl}
          sourceInput={params.source_input}
          searchParams={params}
          mergedDraft={reviewDraft}
          sourceUrls={sourceUrls}
          extractionResults={extractionResults}
          aiStatus={aiEnrichment.status}
          refreshParams={refreshParams}
        />
        {showManualEvidenceRecovery ? <ManualEvidenceRecoveryCard sourceUrl={normalizedSourceUrl} sourceUrls={sourceUrls} sourceInput={params.source_input} resolvedSourceUrl={params.resolved_source_url} sourceResolutionStatus={params.source_resolution_status} sourceResolutionRedirectCount={params.source_resolution_redirect_count} value={manualEvidenceText ?? ""} error={recoveryMessage ?? websiteRecoveryPipelines[0]?.result.message} aiDraftState={aiDraftState} selectedCollectionIds={selectedCollectionIds} draftValues={reviewDraftValues} /> : null}
        <ReviewCollectionSelector collectionOptions={collectionOptions} collectionOptionsError={Boolean(collectionOptionsError)} selectedCollectionIds={selectedCollectionIds} sourceUrl={normalizedSourceUrl} sourceInput={params.source_input} resolvedSourceUrl={params.resolved_source_url} sourceResolutionStatus={params.source_resolution_status} sourceResolutionRedirectCount={params.source_resolution_redirect_count} message={params.collection_message ?? params.collection_error} aiDraftState={aiDraftState} draftValues={reviewDraftValues} manualEvidence={manualEvidenceText ?? undefined} />
      </div>
    </AppShell>
  );
}
