import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { SourceIntakeCard } from "@/components/source-intake-card";
import { requireAuthenticatedUser } from "@/lib/auth/require-user";

type SourceRestaurantPageProps = {
  searchParams?: Promise<{
    source_error?: string;
    source_message?: string;
    intake_input?: string;
  }>;
};

export default async function SourceRestaurantPage({ searchParams }: SourceRestaurantPageProps) {
  const user = await requireAuthenticatedUser();
  const params = (await searchParams) ?? {};

  return (
    <AppShell
      currentPath="/restaurants/new/source"
      eyebrow="添加地点"
      title="粘贴链接"
      description="粘贴一条链接，下一步再查看和编辑结果。"
      userEmail={user.email}
      userId={user.userId}
      actions={<Link href="/restaurants/new" className="app-text-link">返回选择方式</Link>}
    >
      <section className="focused-add-step" aria-labelledby="source-add-title">
        <div className="focused-add-step-heading">
          <p className="app-page-eyebrow">添加地点</p>
          <h2 id="source-add-title">粘贴链接</h2>
        </div>
        <SourceIntakeCard searchParams={params} />
      </section>
    </AppShell>
  );
}
