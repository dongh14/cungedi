import Link from "next/link";
import { AppIcon } from "@/components/app-icon";
import { AppShell } from "@/components/app-shell";
import { PlaceLibraryFilters } from "@/components/place-library-filters";
import { RestaurantList } from "@/components/restaurant-list";
import { requireAuthenticatedUser } from "@/lib/auth/require-user";
import {
  filterPlacesForLibrary,
  getPlaceLibraryFilterState,
  serializePlaceLibraryFilterState,
} from "@/lib/restaurants/place-library-filter";
import { getCurrentUserRestaurants } from "@/lib/restaurants/queries";

type RestaurantsPageProps = {
  searchParams?: Promise<{ message?: string; created?: string; q?: string; search?: string; category?: string; country?: string; city?: string; district?: string }>;
};

export default async function RestaurantsPage({ searchParams }: RestaurantsPageProps) {
  const user = await requireAuthenticatedUser();
  const params = (await searchParams) ?? {};
  const { restaurants, error } = await getCurrentUserRestaurants();
  const filterState = getPlaceLibraryFilterState(params);
  const visibleRestaurants = filterPlacesForLibrary(restaurants, filterState);
  const createdRestaurantId = params.created ? Number(params.created) : null;
  const returnQuery = serializePlaceLibraryFilterState(filterState);

  return (
    <AppShell
      currentPath="/restaurants"
      eyebrow=""
      title="全部地点"
      description=""
      userEmail={user.email}
      userId={user.userId}
      message={params.message}
    >
      {!error ? <PlaceLibraryFilters places={restaurants} value={filterState} /> : null}
      {error ? <div className="inline-error mt-3">暂时无法读取地点，请稍后再试。</div> : null}
      {!error && restaurants.length > 0 && visibleRestaurants.length === 0 ? (
        <div className="empty-panel mt-4"><span className="empty-panel-icon"><AppIcon name="search" size={24} /></span><h2>没有符合条件的地点</h2><p>可以清除筛选，或修改城市、分类和搜索词。</p><Link href="/restaurants" className="secondary-button mt-2">清除筛选</Link></div>
      ) : null}
      {!error && restaurants.length === 0 ? (
        <div className="empty-panel mt-4"><span className="empty-panel-icon"><AppIcon name="pin" size={24} /></span><h2>还没有保存地点</h2><p>从一个链接或手动填写开始吧。</p><Link href="/restaurants/new" className="primary-button mt-2">添加地点</Link></div>
      ) : null}
      {!error && visibleRestaurants.length > 0 ? <RestaurantList restaurants={visibleRestaurants} returnTo={returnQuery ? `/restaurants?${returnQuery}` : "/restaurants"} createdRestaurantId={Number.isNaN(createdRestaurantId) ? null : createdRestaurantId} /> : null}
    </AppShell>
  );
}
