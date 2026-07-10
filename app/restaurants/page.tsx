import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { PlaceholderCard } from "@/components/placeholder-card";
import { RestaurantList } from "@/components/restaurant-list";
import { SurfaceCard } from "@/components/surface-card";
import { requireAuthenticatedUser } from "@/lib/auth/require-user";
import { getCurrentUserRestaurants } from "@/lib/restaurants/queries";

type RestaurantsPageProps = {
  searchParams?: Promise<{
    message?: string;
    created?: string;
  }>;
};

export default async function RestaurantsPage({
  searchParams,
}: RestaurantsPageProps) {
  const user = await requireAuthenticatedUser();
  const params = (await searchParams) ?? {};
  const { restaurants, error } = await getCurrentUserRestaurants();
  const createdRestaurantId = params.created ? Number(params.created) : null;

  return (
    <AppShell
      currentPath="/restaurants"
      eyebrow="已保存餐厅"
      title="你的旅行餐厅清单都在这里"
      description="这里会展示当前账号在现有 RLS 规则下可访问的全部餐厅记录。你可以快速确认刚保存的内容，也可以继续回看之前收藏过的地点。"
      userEmail={user.email}
      userId={user.userId}
      message={params.message}
      actions={
        <>
          <Link
            href="/restaurants/new"
            className="inline-flex rounded-full bg-[var(--accent)] px-5 py-3 text-sm font-semibold text-white shadow-[0_18px_38px_rgba(255,91,0,0.28)] transition hover:bg-[var(--accent-deep)]"
          >
            继续添加餐厅
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
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
        <div className="space-y-4">
          <SurfaceCard className="p-5 sm:p-6">
            <div className="space-y-4">
              <div>
                <p className="text-xs font-semibold tracking-[0.18em] text-[var(--accent-deep)] uppercase">
                  Saved List
                </p>
                <h2 className="[font-family:var(--font-display)] text-2xl font-semibold tracking-[-0.03em] text-[var(--ink-strong)]">
                  已保存餐厅列表
                </h2>
                <p className="mt-2 text-sm leading-7 text-[var(--ink-soft)]">
                  核心信息会优先展示出来。像地址、菜系、备注这类可选字段如果暂时没有填写，也会用清晰但不打扰的方式呈现。
                </p>
              </div>

              {error ? (
                <div className="rounded-[24px] border border-rose-200 bg-rose-50 p-4 text-sm leading-7 text-rose-700">
                  读取已保存餐厅时出现问题：{error.message}
                </div>
              ) : null}

              {!error && restaurants.length === 0 ? (
                <div className="rounded-[24px] border border-dashed border-[var(--border-soft)] bg-[var(--surface-muted)] p-5 text-sm leading-7 text-[var(--ink-soft)]">
                  你还没有保存任何餐厅。先去“添加餐厅”录入两三条记录，再回到这里查看完整列表效果。
                </div>
              ) : null}
            </div>
          </SurfaceCard>

          {!error && restaurants.length > 0 ? (
            <RestaurantList
              restaurants={restaurants}
              createdRestaurantId={Number.isNaN(createdRestaurantId) ? null : createdRestaurantId}
            />
          ) : null}
        </div>

        <div className="space-y-4">
          <PlaceholderCard
            title="这一步现在已经是完整列表页"
            description="Step 8 的重点是让你稳定查看自己保存过的餐厅，而不是只确认单次保存是否成功。"
            items={[
              "只显示当前登录用户在现有 RLS 下可访问的餐厅。",
              "继续保留刚保存成功后的顶部提示和高亮状态。",
              "这一步仍然不会加入编辑、删除、地图或提取流程。",
            ]}
          />
          <PlaceholderCard
            title="建议你这样验证"
            description="最适合的手动测试方式，是准备几条不同完整度的餐厅记录，再从移动端尺寸和桌面尺寸分别检查展示效果。"
            items={[
              "至少准备一条完整记录。",
              "至少准备一条缺少地址、菜系或备注的记录。",
              "至少准备一条使用中文名称和中文备注的记录。",
            ]}
          />
          <PlaceholderCard
            title="继续添加餐厅"
            description="如果你想马上验证列表变化，可以继续新增记录，然后返回这里确认排序和高亮效果。"
            actionHref="/restaurants/new"
            actionLabel="去添加餐厅"
          />
        </div>
      </div>
    </AppShell>
  );
}
