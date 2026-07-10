import Link from "next/link";
import { unstable_noStore as noStore } from "next/cache";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { ExtractionPreviewCard } from "@/components/extraction-preview-card";
import { PlaceholderCard } from "@/components/placeholder-card";
import { SourceReviewCard } from "@/components/source-review-card";
import { requireAuthenticatedUser } from "@/lib/auth/require-user";
import { extractRestaurantDraftFromSource } from "@/lib/restaurants/source-extraction";
import { extractFirstHttpUrl } from "@/lib/restaurants/source-url";

type RestaurantReviewPageProps = {
  searchParams?: Promise<{
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
      title="先生成一个草稿，再交给你确认和补全"
      description="当前这一步会用简单、受限、best-effort 的服务端提取读取公开页面信息。提取出的内容不会自动保存，信号不足时会直接回退到手动补全。"
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
            回到收藏列表
          </Link>
        </>
      }
    >
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
        <div className="space-y-4">
          <SourceReviewCard sourceUrl={normalizedSourceUrl} />
          <ExtractionPreviewCard result={extractionResult} />
        </div>

        <div className="space-y-4">
          <PlaceholderCard
            title="这一步现在已经做到什么"
            description="Step 11 已经接入了受限抓取、元数据读取和正文文本解析，但仍保持 V1 的轻量边界。"
            items={[
              "官方支持普通公开网页和 Google Maps。",
              "小红书 / 抖音只做 best-effort，不会接入定制抓取系统。",
              "提取结果不会直接保存，仍然需要进入手动表单确认。",
            ]}
          />
          <PlaceholderCard
            title="这一步还没有做什么"
            description="为了不越过 Step 12，当前页面还只是生成草稿或回退到手动补全，不会直接在这里完成最终编辑保存。"
            items={[
              "不会自动保存任何提取结果。",
              "不会提前做多餐厅候选列表。",
              "不会提前进入地理编码或地图流程。",
            ]}
          />
        </div>
      </div>
    </AppShell>
  );
}
