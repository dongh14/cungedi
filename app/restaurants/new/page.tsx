import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { PlaceholderCard } from "@/components/placeholder-card";
import { RestaurantFormCard } from "@/components/restaurant-form-card";
import { SourceIntakeCard } from "@/components/source-intake-card";
import { requireAuthenticatedUser } from "@/lib/auth/require-user";

type NewRestaurantPageProps = {
  searchParams?: Promise<{
    error?: string;
    message?: string;
    category?: string;
    source_error?: string;
    source_message?: string;
    intake_input?: string;
  }>;
};

export default async function NewRestaurantPage({
  searchParams,
}: NewRestaurantPageProps) {
  const user = await requireAuthenticatedUser();
  const params = (await searchParams) ?? {};

  return (
    <AppShell
      currentPath="/restaurants/new"
      eyebrow="添加地点"
      title="先粘贴来源，或直接手动录入地点"
      description="这个入口现在优先接受来源链接，再进入保存前确认；如果你已经知道地点信息，也可以直接手动填写后进入同一个确认页。"
      userEmail={user.email}
      userId={user.userId}
      actions={
        <>
          <Link
            href="/restaurants"
            className="inline-flex rounded-full bg-[var(--accent)] px-5 py-3 text-sm font-semibold text-white shadow-[0_18px_38px_rgba(255,91,0,0.28)] transition hover:bg-[var(--accent-deep)]"
          >
            查看已收藏
          </Link>
          <Link
            href="/map"
            className="inline-flex rounded-full border border-[var(--border-soft)] bg-white px-5 py-3 text-sm font-medium text-[var(--ink-strong)] transition hover:border-[var(--accent)] hover:text-[var(--accent)]"
          >
            去地图页
          </Link>
        </>
      }
    >
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
        <div className="space-y-4">
          <SourceIntakeCard searchParams={params} />
          <PlaceholderCard
            title="手动创建仍然保留"
            description="即使来源入口还没有接上自动提取，你也可以继续直接手动填写地点，并在保存前做最后确认。"
            items={[
              "手动创建适合所有分类的兜底流程，也适合非餐饮地点。",
              "来源入口当前只做链接识别与流程跳转，不会抓取页面。",
              "当前不会显示纬度、经度，也不会做地理编码。",
            ]}
          />
        </div>

        <RestaurantFormCard searchParams={params} />
      </div>
    </AppShell>
  );
}
