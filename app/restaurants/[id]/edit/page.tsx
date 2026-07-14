import Link from "next/link";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { CollectionMembershipCard } from "@/components/collection-membership-card";
import { PlaceholderCard } from "@/components/placeholder-card";
import { RestaurantEditFormCard } from "@/components/restaurant-edit-form-card";
import { requireAuthenticatedUser } from "@/lib/auth/require-user";
import {
  getCurrentUserCollectionIdsForRestaurant,
  getCurrentUserCollectionOptions,
  getCurrentUserRestaurantById,
} from "@/lib/restaurants/queries";

type EditRestaurantPageProps = {
  params: Promise<{
    id: string;
  }>;
  searchParams?: Promise<{
    error?: string;
    message?: string;
    collection_error?: string;
    collection_message?: string;
    category?: string;
    cuisine?: string;
    privacy?: string;
    note?: string;
  }>;
};

export default async function EditRestaurantPage({
  params,
  searchParams,
}: EditRestaurantPageProps) {
  const user = await requireAuthenticatedUser();
  const routeParams = await params;
  const resolvedSearchParams = (await searchParams) ?? {};
  const restaurantId = Number(routeParams.id);

  if (!Number.isInteger(restaurantId) || restaurantId <= 0) {
    notFound();
  }

  const { restaurant, error } = await getCurrentUserRestaurantById(restaurantId);
  const { collections: collectionOptions, error: collectionsError } =
    await getCurrentUserCollectionOptions();
  const { collectionIds, error: collectionIdsError } =
    await getCurrentUserCollectionIdsForRestaurant(restaurantId);

  if (error || !restaurant || collectionsError || collectionIdsError) {
    notFound();
  }

  return (
    <AppShell
      currentPath="/restaurants"
      eyebrow="编辑地点"
      title="把这条地点记录修正得更准确一些"
      description="这一步只处理已保存地点的后续修正，不会提前开始新的来源输入、提取、类型推断、地图或地理编码能力。"
      userEmail={user.email}
      userId={user.userId}
      actions={
        <>
          <Link
            href="/restaurants"
            className="inline-flex rounded-full bg-[var(--accent)] px-5 py-3 text-sm font-semibold text-white shadow-[0_18px_38px_rgba(255,91,0,0.28)] transition hover:bg-[var(--accent-deep)]"
          >
            返回已收藏
          </Link>
          <Link
            href="/restaurants/new"
            className="inline-flex rounded-full border border-[var(--border-soft)] bg-white px-5 py-3 text-sm font-medium text-[var(--ink-strong)] transition hover:border-[var(--accent)] hover:text-[var(--accent)]"
          >
            再添加一个地点
          </Link>
        </>
      }
    >
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
        <RestaurantEditFormCard
          restaurant={restaurant}
          searchParams={resolvedSearchParams}
        />

        <CollectionMembershipCard
          restaurantId={restaurant.id}
          collectionOptions={collectionOptions}
          selectedCollectionIds={collectionIds}
          message={resolvedSearchParams.collection_message}
          error={resolvedSearchParams.collection_error}
        />

        <div className="space-y-4">
          <PlaceholderCard
            title="这一步现在支持什么"
            description="Step 9 的重点是让你能回头修正已经保存过的地点记录，而不是把 Step 10 之后的来源提取链路提前做进来。"
            items={[
              "当前支持更新分类、类型细分、备注和可见范围。",
              "当前也支持把地点加入或移出个人合集。",
              "保存后可以刷新页面，确认修改已经持久化。",
              "现有 owner-only RLS 仍会继续限制你只能编辑自己的记录。",
            ]}
          />
          <PlaceholderCard
            title="这一步暂时不做什么"
            description="为了保持范围清晰，下面这些能力都继续留在后续步骤。"
            items={[
              "不会在这里加入来源链接重新提取。",
              "不会提前实现非美食分类的类型自动推断。",
              "不会加入共享合集或公开合集。",
              "不会加入地图、坐标、地理编码或删除功能。",
            ]}
          />
        </div>
      </div>
    </AppShell>
  );
}
