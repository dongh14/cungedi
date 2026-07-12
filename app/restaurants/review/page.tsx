import Link from "next/link";
import { unstable_noStore as noStore } from "next/cache";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { ExtractionConfirmationCard } from "@/components/extraction-confirmation-card";
import { ExtractionPreviewCard } from "@/components/extraction-preview-card";
import { PlaceholderCard } from "@/components/placeholder-card";
import { SourceReviewCard } from "@/components/source-review-card";
import { requireAuthenticatedUser } from "@/lib/auth/require-user";
import { extractRestaurantDraftFromSource } from "@/lib/restaurants/source-extraction";
import { extractFirstHttpUrl } from "@/lib/restaurants/source-url";
import type { ReviewSearchParams } from "@/lib/restaurants/review-form";

type RestaurantReviewPageProps = {
  searchParams?: Promise<ReviewSearchParams & {
    source_url?: string;
  }>;
};

export default async function RestaurantReviewPage({
  searchParams,
}: RestaurantReviewPageProps) {
  noStore();
  const user = await requireAuthenticatedUser();
  const params = (await searchParams) ?? {};
  const sourceUrl = params.source_url?.trim();
  const normalizedSourceUrl = sourceUrl ? extractFirstHttpUrl(sourceUrl) : null;

  if (!sourceUrl || !normalizedSourceUrl || normalizedSourceUrl !== sourceUrl) {
    redirect(
      `/restaurants/new?source_error=${encodeURIComponent(
        "请先粘贴有效的来源链接或分享文案。",
      )}`,
    );
  }

  const extractionResult = await extractRestaurantDraftFromSource(normalizedSourceUrl);

  return (
    <AppShell
      currentPath="/restaurants/new"
      eyebrow="来源提取"
      title="先生成一个地点草稿，再交给你确认和补全"
      description="当前这一步会用简单、受限、best-effort 的服务端提取读取公开页面信息。自动提取目前仍以美食来源最稳妥，并新增了强结构化住宿页、景点页、购物页、玩乐页，以及极少量强通用结构化其他地点页的保守支持；其他地点仍然可以继续手动保存。"
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
          <SourceReviewCard sourceUrl={normalizedSourceUrl} />
          <ExtractionPreviewCard result={extractionResult} />
          <ExtractionConfirmationCard result={extractionResult} searchParams={params} />
        </div>

        <div className="space-y-4">
          <PlaceholderCard
            title="这一步现在重点做什么"
            description="Step 12 把单地点草稿正式接上“确认后保存”体验，但仍然保持 Step 11 的保守提取边界。"
            items={[
              "只显示已被接受的提取字段，不展示被拒绝或低置信度内容。",
              "所有 V1 字段都仍可手动修改；美食会继续预填推断出来的菜系或类型，住宿、景点、购物、玩乐与少量其他地点只会在强证据足够时预填分类与类型细分。",
              "点击保存前不会写入任何地点记录。",
            ]}
          />
          <PlaceholderCard
            title="这一步还没有做什么"
            description="为了不越过 Step 12，这里仍然只处理单个地点候选确认，不会提前进入多候选或后续地图能力。"
            items={[
              "不会提前做多地点候选列表或多选保存。",
              "不会做 POI enrichment、地理编码或坐标补全。",
              "不会启动地图展示或 Step 13 之后的流程。",
            ]}
          />
        </div>
      </div>
    </AppShell>
  );
}
