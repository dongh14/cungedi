import { createServerSupabaseClient } from "@/lib/supabase/server";
import type {
  RestaurantEditItem,
  RestaurantListItem,
} from "@/lib/restaurants/types";

export async function getCurrentUserRestaurants() {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("restaurants")
    .select("id, name, city, source_url, privacy, address, cuisine, note, created_at")
    .order("created_at", { ascending: false });

  return {
    restaurants: (data ?? []) as RestaurantListItem[],
    error,
  };
}

export async function getCurrentUserRestaurantById(id: number) {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("restaurants")
    .select("id, name, city, source_url, privacy, address, cuisine, note, created_at")
    .eq("id", id)
    .maybeSingle();

  return {
    restaurant: (data ?? null) as RestaurantEditItem | null,
    error,
  };
}
