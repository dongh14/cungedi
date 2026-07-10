import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { RestaurantListItem } from "@/lib/restaurants/types";

export async function getCurrentUserRestaurants(limit = 20) {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("restaurants")
    .select("id, name, city, source_url, privacy, address, cuisine, note, created_at")
    .order("created_at", { ascending: false })
    .limit(limit);

  return {
    restaurants: (data ?? []) as RestaurantListItem[],
    error,
  };
}
