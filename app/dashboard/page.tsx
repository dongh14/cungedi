import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { PlaceholderCard } from "@/components/placeholder-card";
import { SurfaceCard } from "@/components/surface-card";
import { requireAuthenticatedUser } from "@/lib/auth/require-user";

type DashboardPageProps = {
  searchParams?: Promise<{
    message?: string;
  }>;
};

export default async function DashboardPage({
  searchParams,
}: DashboardPageProps) {
  const params = (await searchParams) ?? {};
  const user = await requireAuthenticatedUser();

  return (
    <AppShell
      currentPath="/dashboard"
      eyebrow="已登录主页面"
      title="欢迎回来，主导航已经准备好"
      description="你现在已经可以手动保存餐厅，并通过主导航在总览、添加页、最小结果页和地图页之间切换。这里会继续作为已登录用户的主入口。"
      userEmail={user.email}
      userId={user.userId}
      message={params.message}
      actions={
        <>
          <Link
            href="/restaurants/new"
            className="inline-flex rounded-full bg-[var(--accent)] px-5 py-3 text-sm font-semibold text-white shadow-[0_18px_38px_rgba(255,91,0,0.28)] transition hover:bg-[var(--accent-deep)]"
          >
            打开添加入口
          </Link>
          <Link
            href="/restaurants"
            className="inline-flex rounded-full border border-[var(--border-soft)] bg-white px-5 py-3 text-sm font-medium text-[var(--ink-strong)] transition hover:border-[var(--accent)] hover:text-[var(--accent)]"
          >
            查看收藏页
          </Link>
          <Link
            href="/map"
            className="inline-flex rounded-full border border-[var(--border-soft)] bg-[var(--surface-muted)] px-5 py-3 text-sm font-medium text-[var(--ink-strong)] transition hover:border-[var(--accent)] hover:text-[var(--accent)]"
          >
            查看地图页
          </Link>
        </>
      }
    >
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
        <div className="space-y-4">
          <PlaceholderCard
            title="当前总览页会帮助你做什么"
            description="它是已登录用户进入产品后的第一个页面，用来汇总现在能访问的页面，并明确提示哪些能力已经就位、哪些还在下一步。"
            items={[
              "移动端底部导航已经接好，方便在手机上单手切换页面。",
              "桌面端改成更宽松的双栏结构，避免信息挤在一起。",
              "所有主页面都沿用简体中文可见文案和统一视觉样式。",
            ]}
          />

          <SurfaceCard className="p-5 sm:p-6">
            <div className="space-y-4">
              <div>
                <p className="text-xs font-semibold tracking-[0.18em] text-[var(--accent-deep)] uppercase">
                  当前账号
                </p>
                <h2 className="mt-2 [font-family:var(--font-display)] text-2xl font-semibold tracking-[-0.03em] text-[var(--ink-strong)]">
                  受保护页面上下文
                </h2>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-[24px] border border-[var(--border-soft)] bg-[var(--surface-muted)] p-4">
                  <p className="text-sm text-[var(--ink-muted)]">当前邮箱</p>
                  <p className="mt-2 break-all text-sm font-medium text-[var(--ink-strong)]">
                    {user.email ?? "未读取到邮箱"}
                  </p>
                </div>
                <div className="rounded-[24px] border border-[var(--border-soft)] bg-[var(--surface-muted)] p-4">
                  <p className="text-sm text-[var(--ink-muted)]">用户 ID</p>
                  <p className="mt-2 break-all text-sm font-medium text-[var(--ink-strong)]">
                    {user.userId}
                  </p>
                </div>
              </div>
            </div>
          </SurfaceCard>
        </div>

        <div className="space-y-4">
          <PlaceholderCard
            title="接下来可进入的三个页面"
            description="现在可以直接进入手动添加页完成保存；收藏页则会用最小结果展示帮助你确认记录已经写入。"
            items={[
              "添加餐厅：已经接入 Step 7 的手动录入表单。",
              "收藏列表：当前只展示最基础的保存结果确认。",
              "地图视图：用于承接后续的地图与位置展示。",
            ]}
          />
          <PlaceholderCard
            title="你也可以回到公开页面"
            description="如果想重新检查项目配置或从未登录视角看首页，可以随时返回。"
            actionHref="/"
            actionLabel="返回首页"
            footer={
              <div className="pt-2">
                <Link
                  href="/setup"
                  className="text-sm font-medium text-[var(--ink-strong)] underline underline-offset-4"
                >
                  去设置检查页
                </Link>
              </div>
            }
          />
        </div>
      </div>
    </AppShell>
  );
}
