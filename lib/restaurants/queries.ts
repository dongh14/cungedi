import { createServerSupabaseClient } from "@/lib/supabase/server";
import type {
  CollectionListItem,
  CollectionOptionItem,
  RestaurantEditItem,
  RestaurantListItem,
  RestaurantMapItem,
} from "@/lib/restaurants/types";

export async function getCurrentUserRestaurants() {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("restaurants")
    .select(
      "id, name, city, source_url, privacy, category, address, cuisine, note, created_at",
    )
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
    .select(
      "id, name, city, source_url, privacy, category, address, cuisine, note, created_at",
    )
    .eq("id", id)
    .maybeSingle();

  return {
    restaurant: (data ?? null) as RestaurantEditItem | null,
    error,
  };
}

export async function getCurrentUserRestaurantsForMap() {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("restaurants")
    .select("id, name, city, category, address, latitude, longitude")
    .order("created_at", { ascending: false });

  return {
    restaurants: (data ?? []) as RestaurantMapItem[],
    error,
  };
}

export async function getCurrentUserCollections() {
  const supabase = await createServerSupabaseClient();
  const { data: collectionsData, error } = await supabase
    .from("collections")
    .select("id, name, created_at, updated_at")
    .order("created_at", { ascending: false });

  if (error) {
    return {
      collections: [] as CollectionListItem[],
      error,
    };
  }

  const { data: membershipData, error: membershipError } = await supabase
    .from("restaurant_collections")
    .select("collection_id");

  if (membershipError) {
    return {
      collections: [] as CollectionListItem[],
      error: membershipError,
    };
  }

  const placeCountByCollectionId = new Map<number, number>();

  (membershipData ?? []).forEach((membership) => {
    const currentCount = placeCountByCollectionId.get(membership.collection_id) ?? 0;
    placeCountByCollectionId.set(membership.collection_id, currentCount + 1);
  });

  return {
    collections: ((collectionsData ?? []) as Omit<CollectionListItem, "place_count">[]).map(
      (collection) => ({
        ...collection,
        place_count: placeCountByCollectionId.get(collection.id) ?? 0,
      }),
    ),
    error: null,
  };
}

export async function getCurrentUserCollectionOptions() {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("collections")
    .select("id, name")
    .order("created_at", { ascending: false });

  return {
    collections: (data ?? []) as CollectionOptionItem[],
    error,
  };
}

export async function getCurrentUserCollectionIdsForRestaurant(restaurantId: number) {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("restaurant_collections")
    .select("collection_id")
    .eq("restaurant_id", restaurantId);

  return {
    collectionIds: (data ?? []).map((membership) => membership.collection_id as number),
    error,
  };
}
