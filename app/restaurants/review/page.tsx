import Link from "next/link";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { PlaceholderCard } from "@/components/placeholder-card";
import { SourceReviewCard } from "@/components/source-review-card";
import { requireAuthenticatedUser } from "@/lib/auth/require-user";
import { extractFirstHttpUrl } from "@/lib/restaurants/source-url";

type RestaurantReviewPageProps = {
  searchParams?: Promise<{
    source_url?: string;
  }>;
};

export default async function RestaurantReviewPage({
  searchParams,
}: RestaurantReviewPageProps) {
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
      eyebrow="来源确认"
      title="先把来源入口接进来，再进入后续提取流程"
      description="当前这一步只负责确认和展示来源链接本身，让 URL 保存链路先完整跑通。真正的页面抓取、候选生成与字段提取会留到 Step 11。"
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
        <SourceReviewCard sourceUrl={normalizedSourceUrl} />

        <div className="space-y-4">
          <PlaceholderCard
            title="这一步现在已经做到什么"
            description="Step 10 的目标不是提取餐厅信息，而是把来源输入、链接校验和提取流程入口先接好。"
            items={[
              "支持直接 URL，也支持整段小红书 / 抖音分享文案。",
              "会提取并标准化其中第一个有效的 http 或 https 链接。",
              "当前不会抓取来源页面，也不会推断餐厅字段。",
            ]}
          />
          <PlaceholderCard
            title="下一步会接入什么"
            description="真正的来源抓取、候选餐厅生成和后续确认编辑，会在 Step 11 再接上。"
            items={[
              "不会提前获取网页内容。",
              "不会提前推断名称、城市、地址或菜系。",
              "不会提前进入地理编码或地图流程。",
            ]}
          />
        </div>
      </div>
    </AppShell>
  );
}
