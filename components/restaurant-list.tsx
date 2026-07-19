import type { RestaurantListItem } from "@/lib/restaurants/types";
import { RestaurantListCard } from "@/components/restaurant-list-card";

type RestaurantListProps = {
  restaurants: RestaurantListItem[];
  createdRestaurantId?: number | null;
  returnTo?: string;
};

export function RestaurantList({
  restaurants,
  createdRestaurantId = null,
  returnTo = "/restaurants",
}: RestaurantListProps) {
  return (
    <div className="saved-place-list">
      <div className="saved-list-summary"><span>地点列表</span></div>
      {restaurants.map((restaurant) => <RestaurantListCard key={restaurant.id} restaurant={restaurant} returnTo={returnTo} isNewlyCreated={restaurant.id === createdRestaurantId} />)}
    </div>
  );
}
