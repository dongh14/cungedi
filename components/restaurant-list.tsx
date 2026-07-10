import type { RestaurantListItem } from "@/lib/restaurants/types";
import { RestaurantListCard } from "@/components/restaurant-list-card";
import { SurfaceCard } from "@/components/surface-card";

type RestaurantListProps = {
  restaurants: RestaurantListItem[];
  createdRestaurantId?: number | null;
};

function summarizeCities(restaurants: RestaurantListItem[]) {
  return new Set(restaurants.map((restaurant) => restaurant.city)).size;
}

function summarizeRestaurantsWithNotes(restaurants: RestaurantListItem[]) {
  return restaurants.filter((restaurant) => Boolean(restaurant.note)).length;
}

export function RestaurantList({
  restaurants,
  createdRestaurantId = null,
}: RestaurantListProps) {
  return (
    <div className="space-y-4">
      <SurfaceCard className="p-5 sm:p-6">
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-[24px] bg-[var(--surface-muted)] px-4 py-4">
            <p className="text-xs font-semibold tracking-[0.16em] text-[var(--accent-deep)] uppercase">
              总记录数
            </p>
            <p className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-[var(--ink-strong)]">
              {restaurants.length}
            </p>
          </div>
          <div className="rounded-[24px] bg-[var(--surface-muted)] px-4 py-4">
            <p className="text-xs font-semibold tracking-[0.16em] text-[var(--accent-deep)] uppercase">
              覆盖城市
            </p>
            <p className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-[var(--ink-strong)]">
              {summarizeCities(restaurants)}
            </p>
          </div>
          <div className="rounded-[24px] bg-[var(--surface-muted)] px-4 py-4">
            <p className="text-xs font-semibold tracking-[0.16em] text-[var(--accent-deep)] uppercase">
              带备注记录
            </p>
            <p className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-[var(--ink-strong)]">
              {summarizeRestaurantsWithNotes(restaurants)}
            </p>
          </div>
        </div>
      </SurfaceCard>

      <div className="space-y-3">
        {restaurants.map((restaurant) => (
          <RestaurantListCard
            key={restaurant.id}
            restaurant={restaurant}
            isNewlyCreated={restaurant.id === createdRestaurantId}
          />
        ))}
      </div>
    </div>
  );
}
