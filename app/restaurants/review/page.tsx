import Link from "next/link";
import { unstable_noStore as noStore } from "next/cache";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { ExtractionConfirmationCard } from "@/components/extraction-confirmation-card";
import { PlaceholderCard } from "@/components/placeholder-card";
import { SourceReviewCard } from "@/components/source-review-card";
import { requireAuthenticatedUser } from "@/lib/auth/require-user";
import { runExtractionPipelineWithWebsiteFetch } from "@/lib/restaurants/extraction-architecture";
import { mergePlaceDraftSources } from "@/lib/restaurants/place-draft-merge";
import { extractFirstHttpUrl } from "@/lib/restaurants/source-url";
import type { ReviewSearchParams } from "@/lib/restaurants/review-form";

type RestaurantReviewPageProps = {
  searchParams?: Promise<ReviewSearchParams & {
    source_url?: string;
    source_urls?: string | string[];
    additional_source_url?: string;
  }>;
};

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
  const extractionResults = extractionPipelines.map((pipeline) => pipeline.result);
  const mergedDraft = mergePlaceDraftSources(extractionResults, {
    ...(params.name !== undefined ? { name: params.name } : {}),
    ...(params.city !== undefined ? { city: params.city } : {}),
    ...(params.category !== undefined ? { category: params.category } : {}),
    ...(params.address !== undefined ? { address: params.address } : {}),
    ...(params.note !== undefined ? { notes: params.note } : {}),
  });

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
          <ExtractionConfirmationCard
            sourceUrl={normalizedSourceUrl}
            searchParams={params}
            mergedDraft={mergedDraft}
            sourceUrls={sourceUrls}
          />
        </div>

        <div className="space-y-4">
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
