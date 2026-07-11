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
      eyebrow="添加餐厅"
      title="先粘贴来源，再决定是等待提取还是直接手动补全"
      description="现在这个页面同时承担两个入口：你可以先粘贴来源链接进入提取确认起点，也可以继续使用已经验证过的手动创建方式。"
      userEmail={user.email}
      userId={user.userId}
      actions={
        <>
          <Link
            href="/restaurants"
            className="inline-flex rounded-full bg-[var(--accent)] px-5 py-3 text-sm font-semibold text-white shadow-[0_18px_38px_rgba(255,91,0,0.28)] transition hover:bg-[var(--accent-deep)]"
          >
            查看已保存列表
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
            description="即使来源提取还没接通完整能力，你也可以继续直接手动补全并保存，不会影响已经验证通过的 Step 7 到 Step 9 行为。"
            items={[
              "手动创建适合提取还没完成时的兜底流程。",
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
