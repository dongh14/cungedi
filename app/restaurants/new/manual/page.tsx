import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { RestaurantFormCard } from "@/components/restaurant-form-card";
import { requireAuthenticatedUser } from "@/lib/auth/require-user";

type ManualRestaurantPageProps = {
  searchParams?: Promise<Record<string, string | undefined>>;
};

export default async function ManualRestaurantPage({ searchParams }: ManualRestaurantPageProps) {
  const user = await requireAuthenticatedUser();
  const params = (await searchParams) ?? {};

  return (
    <AppShell
      currentPath="/restaurants/new/manual"
      eyebrow="添加地点"
      title="手动添加"
      description="自己填写一个地点，确认后再保存。"
      userEmail={user.email}
      userId={user.userId}
      actions={<Link href="/restaurants/new" className="app-text-link">返回选择方式</Link>}
    >
      <section className="focused-add-step" aria-labelledby="manual-add-title">
        <div className="focused-add-step-heading">
          <p className="app-page-eyebrow">手动填写</p>
          <h2 id="manual-add-title">填写地点信息</h2>
        </div>
        <RestaurantFormCard searchParams={params} />
      </section>
    </AppShell>
  );
}
