import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { PlaceholderCard } from "@/components/placeholder-card";
import { SurfaceCard } from "@/components/surface-card";
import { requireAuthenticatedUser } from "@/lib/auth/require-user";

export default async function NewRestaurantPage() {
  const user = await requireAuthenticatedUser();

  return (
    <AppShell
      currentPath="/restaurants/new"
      eyebrow="添加入口占位"
      title="手动添加页面已经接入导航"
      description="这个页面先把未来的手动录入位置预留出来，让整体路径完整可走通。真正的字段、校验和保存动作会在 Step 7 才开始实现。"
      userEmail={user.email}
      userId={user.userId}
      actions={
        <>
          <Link
            href="/restaurants"
            className="inline-flex rounded-full bg-[var(--accent)] px-5 py-3 text-sm font-semibold text-white shadow-[0_18px_38px_rgba(255,91,0,0.28)] transition hover:bg-[var(--accent-deep)]"
          >
            去收藏列表页
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
          title="Step 7 会在这里接入表单"
          description="届时会提供最基础的手动建店流程，但现在只保留结构，不提前实现任何保存逻辑。"
          items={[
            "会接入名称、城市、地址、菜系、来源链接、备注和隐私设置。",
            "字段文案将继续保持中文优先，并避免把未来英文支持做死。",
            "表单会优先考虑手机端输入体验和点击热区。",
          ]}
        />

        <SurfaceCard className="p-5 sm:p-6">
          <div className="space-y-4">
            <div>
              <p className="text-xs font-semibold tracking-[0.18em] text-[var(--accent-deep)] uppercase">
                表单预览
              </p>
              <h2 className="mt-2 [font-family:var(--font-display)] text-2xl font-semibold tracking-[-0.03em] text-[var(--ink-strong)]">
                页面布局已经先准备好
              </h2>
            </div>
            <div className="grid gap-3">
              {["餐厅名称", "城市", "来源链接", "隐私设置", "地址与菜系", "备注"].map(
                (label) => (
                  <div
                    key={label}
                    className="rounded-[24px] border border-dashed border-[var(--border-soft)] bg-[var(--surface-muted)] px-4 py-4 text-sm text-[var(--ink-muted)]"
                  >
                    {label} 输入区域将在下一步接入
                  </div>
                ),
              )}
            </div>
          </div>
        </SurfaceCard>
      </div>
    </AppShell>
  );
}
