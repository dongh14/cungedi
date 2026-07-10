import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { PlaceholderCard } from "@/components/placeholder-card";
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

  return (
    <AppShell
      currentPath="/restaurants"
      eyebrow="已保存结果"
      title="这里会先帮你确认餐厅已经保存成功"
      description="为了完成 Step 7，这个页面现在会展示当前用户最基础的已保存结果，方便你确认手动录入是否已经写入 Supabase。完整列表体验仍留到 Step 8。"
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
        <SurfaceCard className="p-5 sm:p-6">
          <div className="space-y-4">
            <div>
              <p className="text-xs font-semibold tracking-[0.18em] text-[var(--accent-deep)] uppercase">
                当前结果
              </p>
              <h2 className="[font-family:var(--font-display)] text-2xl font-semibold tracking-[-0.03em] text-[var(--ink-strong)]">
                你的餐厅记录
              </h2>
              <p className="mt-2 text-sm leading-7 text-[var(--ink-soft)]">
                这里只展示最基础的结果卡片，用来确认 Step 7 的手动保存已经成功，而不是 Step 8 的完整列表体验。
              </p>
            </div>

            {error ? (
              <div className="rounded-[24px] border border-rose-200 bg-rose-50 p-4 text-sm leading-7 text-rose-700">
                读取已保存餐厅时出现问题：{error.message}
              </div>
            ) : null}

            {!error && restaurants.length === 0 ? (
              <div className="rounded-[24px] border border-dashed border-[var(--border-soft)] bg-[var(--surface-muted)] p-5 text-sm leading-7 text-[var(--ink-soft)]">
                你还没有保存任何餐厅。可以先去“添加餐厅”页面录入一条记录。
              </div>
            ) : null}

            {!error && restaurants.length > 0 ? (
              <div className="space-y-3">
                {restaurants.map((restaurant) => {
                  const isNewlyCreated = params.created === String(restaurant.id);

                  return (
                    <article
                      key={restaurant.id}
                      className={`rounded-[24px] border p-4 ${
                        isNewlyCreated
                          ? "border-[var(--accent)] bg-[var(--accent-soft)]"
                          : "border-[var(--border-soft)] bg-[var(--surface-muted)]"
                      }`}
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <h3 className="text-base font-semibold text-[var(--ink-strong)]">
                            {restaurant.name}
                          </h3>
                          <p className="mt-1 text-sm text-[var(--ink-soft)]">
                            {restaurant.city}
                            {restaurant.cuisine ? ` · ${restaurant.cuisine}` : ""}
                          </p>
                        </div>
                        <span className="rounded-full bg-white px-3 py-1 text-xs font-medium text-[var(--ink-soft)]">
                          {restaurant.privacy === "private" ? "仅自己可见" : "标记为公开"}
                        </span>
                      </div>

                      {restaurant.address ? (
                        <p className="mt-3 text-sm leading-7 text-[var(--ink-soft)]">
                          地址：{restaurant.address}
                        </p>
                      ) : null}

                      {restaurant.note ? (
                        <p className="mt-3 text-sm leading-7 text-[var(--ink-soft)]">
                          备注：{restaurant.note}
                        </p>
                      ) : null}

                      <div className="mt-3 flex flex-wrap gap-3 text-sm">
                        <a
                          href={restaurant.source_url}
                          target="_blank"
                          rel="noreferrer"
                          className="font-medium text-[var(--ink-strong)] underline underline-offset-4"
                        >
                          打开来源链接
                        </a>
                        {isNewlyCreated ? (
                          <span className="font-medium text-[var(--accent-deep)]">
                            这条是刚刚保存的记录
                          </span>
                        ) : null}
                      </div>
                    </article>
                  );
                })}
              </div>
            ) : null}
          </div>
        </SurfaceCard>

        <div className="space-y-4">
          <PlaceholderCard
            title="为什么这里只做最小展示"
            description="因为当前目标只是确认 Step 7 的手动保存路径已经打通，还不打算提前开始 Step 8 的完整列表体验。"
            items={[
              "会显示当前用户自己的餐厅记录。",
              "会高亮刚刚保存成功的那一条。",
              "不会在这里加入编辑、删除、筛选或分页。",
            ]}
          />
          <PlaceholderCard
            title="下一步你可以做什么"
            description="继续添加一条完整记录、一条仅必填字段记录，或者用中文内容测试输入支持。"
            actionHref="/restaurants/new"
            actionLabel="继续添加餐厅"
          />
        </div>
      </div>
    </AppShell>
  );
}
