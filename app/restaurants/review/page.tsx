import Link from "next/link";
import { unstable_noStore as noStore } from "next/cache";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { ExtractionConfirmationCard } from "@/components/extraction-confirmation-card";
import { PlaceholderCard } from "@/components/placeholder-card";
import { SourceReviewCard } from "@/components/source-review-card";
import { requireAuthenticatedUser } from "@/lib/auth/require-user";
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

  return (
    <AppShell
      currentPath="/restaurants/new"
      eyebrow="保存前确认"
      title="先检查地点字段，再决定是否保存"
      description="当前 V1 会把来源入口和手动录入统一到同一个确认页。这里先只做本地来源识别和字段确认，不会调用外部抓取、AI 解析或地理补全。"
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
          <ExtractionConfirmationCard sourceUrl={normalizedSourceUrl} searchParams={params} />
        </div>

        <div className="space-y-4">
          <PlaceholderCard
            title="这一步现在重点做什么"
            description="这个入口现在只负责把来源入口、手动录入和最终保存拆成清晰的三层。"
            items={[
              "来源入口只识别 URL、域名和来源类型，不在这里抓取网页。",
              "确认页只负责显示和编辑准备保存的字段。",
              "点击保存前不会写入任何地点记录。",
            ]}
          />
          <PlaceholderCard
            title="为后续提取预留边界"
            description="未来如果接入来源提取，也会继续沿用现在这条 intake → review → create 的边界。"
            items={[
              "当前不会做 Xiaohongshu、Douyin、Google Maps 或其他来源抓取。",
              "不会做图片提取、AI parsing、地理编码或坐标补全。",
              "不会影响现有地图、城市过滤和已保存地点行为。",
            ]}
          />
        </div>
      </div>
    </AppShell>
  );
}
