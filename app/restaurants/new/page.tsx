import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { PlaceholderCard } from "@/components/placeholder-card";
import { RestaurantFormCard } from "@/components/restaurant-form-card";
import { requireAuthenticatedUser } from "@/lib/auth/require-user";

type NewRestaurantPageProps = {
  searchParams?: Promise<{
    error?: string;
    message?: string;
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
      eyebrow="手动创建"
      title="把想去的餐厅先手动存下来"
      description="这一步先提供最直接的手动录入方式，确保即使还没有 URL 提取能力，你也能把旅行中看到的餐厅先收进自己的账号里。"
      userEmail={user.email}
      userId={user.userId}
      actions={
        <>
          <Link
            href="/restaurants"
            className="inline-flex rounded-full bg-[var(--accent)] px-5 py-3 text-sm font-semibold text-white shadow-[0_18px_38px_rgba(255,91,0,0.28)] transition hover:bg-[var(--accent-deep)]"
          >
            查看已保存结果
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
      <div className="grid gap-4 xl:grid-cols-2">
        <PlaceholderCard
          title="这一步已经支持手动保存"
          description="表单现在会直接写入你自己的 `restaurants` 记录，并继续遵守已经验证通过的 RLS 规则。"
          items={[
            "必填字段是：餐厅名称、城市、来源链接、可见范围。",
            "选填字段是：地址、菜系、备注。",
            "当前不会显示纬度、经度，也不会做地理编码。",
          ]}
        />

        <RestaurantFormCard searchParams={params} />
      </div>
    </AppShell>
  );
}
