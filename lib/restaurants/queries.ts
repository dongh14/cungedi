import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { RestaurantCategory } from "./constants.ts";
import type {
  CollectionListItem,
  CollectionOptionItem,
  CollectionPlacePreview,
  DiscoveryPlaceItem,
  RestaurantCollectionBadge,
  RestaurantEditItem,
  RestaurantListItem,
  RestaurantMapItem,
} from "@/lib/restaurants/types";
import { selectRestaurantsWithLocation } from "./query-compat.ts";
import { logRestaurantQueryError } from "./query-diagnostics.ts";

function reportQueryError(operation: string, error: unknown) {
  if (error) {
    logRestaurantQueryError(operation, error);
  }
}

function buildCollectionPlaceCounts(
  memberships: Array<{ restaurant_id: number; collection_id: number }>,
) {
  const counts = new Map<number, number>();

  for (const membership of memberships) {
    counts.set(
      membership.collection_id,
      (counts.get(membership.collection_id) ?? 0) + 1,
    );
  }

  return counts;
}

export async function getCurrentUserRestaurants(category?: RestaurantCategory) {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await selectRestaurantsWithLocation(
    (select) => {
      let query = supabase.from("restaurants").select(select).order("created_at", { ascending: false });

      if (category === "娱乐") {
        query = query.in("category", ["娱乐", "玩乐"]);
      } else if (category) {
        query = query.eq("category", category);
      }

      return query;
    },
    "restaurant list",
  );

  return {
    restaurants: (data ?? []) as RestaurantListItem[],
    error,
  };
}

export async function getCurrentUserDiscoveryData() {
  const supabase = await createServerSupabaseClient();
  const { data: restaurantData, error: restaurantError } = await selectRestaurantsWithLocation(
    (select) => supabase.from("restaurants").select(select).order("created_at", { ascending: false }),
    "dashboard places",
  );

  if (restaurantError) {
    return {
      places: [] as DiscoveryPlaceItem[],
      collections: [] as CollectionListItem[],
      error: restaurantError,
    };
  }

  const { data: collectionData, error: collectionError } = await supabase
    .from("collections")
    .select("id, name, created_at, updated_at")
    .order("created_at", { ascending: false });
  const { data: membershipData, error: membershipError } = await supabase
    .from("restaurant_collections")
    .select("restaurant_id, collection_id");
  reportQueryError("dashboard collections", collectionError);
  reportQueryError("dashboard collection memberships", membershipError);
  const memberships = (membershipData ?? []) as Array<{
    restaurant_id: number;
    collection_id: number;
  }>;
  const collectionById = new Map(
    (collectionData ?? []).map((collection) => [collection.id, collection]),
  );
  const badgesByRestaurantId = new Map<number, RestaurantCollectionBadge[]>();

  for (const membership of memberships) {
    const collection = collectionById.get(membership.collection_id);

    if (!collection) {
      continue;
    }

    const badges = badgesByRestaurantId.get(membership.restaurant_id) ?? [];
    badges.push({ id: collection.id, name: collection.name });
    badgesByRestaurantId.set(membership.restaurant_id, badges);
  }

  const placeCounts = buildCollectionPlaceCounts(memberships);
  const collections = ((collectionData ?? []) as Omit<CollectionListItem, "place_count">[]).map(
    (collection) => ({
      ...collection,
      place_count: placeCounts.get(collection.id) ?? 0,
    }),
  );

  return {
    places: ((restaurantData ?? []) as RestaurantListItem[]).map((place) => ({
      ...place,
      imageUrl: null,
      collections: badgesByRestaurantId.get(place.id) ?? [],
    })),
    collections,
    error: collectionError ?? membershipError,
  };
}

export async function getCurrentUserRestaurantById(id: number) {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await selectRestaurantsWithLocation(
    (select) => supabase.from("restaurants").select(select).eq("id", id).limit(1),
    "place details",
  );

  return {
    restaurant: ((((data as unknown[]) ?? [])[0] ?? null) as RestaurantEditItem | null),
    error,
  };
}

export async function getCurrentUserCollectionsForRestaurant(restaurantId: number) {
  const supabase = await createServerSupabaseClient();
  const { data: membershipData, error: membershipError } = await supabase
    .from("restaurant_collections")
    .select("collection_id")
    .eq("restaurant_id", restaurantId);

  if (membershipError) {
    reportQueryError("place collection memberships", membershipError);
    return {
      collections: [] as RestaurantCollectionBadge[],
      error: membershipError,
    };
  }

  const collectionIds = Array.from(
    new Set((membershipData ?? []).map((membership) => membership.collection_id as number)),
  );

  if (collectionIds.length === 0) {
    return {
      collections: [] as RestaurantCollectionBadge[],
      error: null,
    };
  }

  const { data: collectionData, error: collectionError } = await supabase
    .from("collections")
    .select("id, name, created_at")
    .in("id", collectionIds)
    .order("created_at", { ascending: false });
  reportQueryError("place collections", collectionError);

  return {
    collections: (collectionData ?? []) as RestaurantCollectionBadge[],
    error: collectionError,
  };
}

export async function getCurrentUserRestaurantsForMap() {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await selectRestaurantsWithLocation(
    (select) => supabase.from("restaurants").select(select).order("created_at", { ascending: false }),
    "map places",
  );

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
    reportQueryError("collections", error);
    return {
      collections: [] as CollectionListItem[],
      error,
    };
  }

  const { data: membershipData, error: membershipError } = await supabase
    .from("restaurant_collections")
    .select("restaurant_id, collection_id");

  if (membershipError) {
    reportQueryError("collection memberships", membershipError);
    return {
      collections: [] as CollectionListItem[],
      error: membershipError,
    };
  }

  const placeCountByCollectionId = new Map<number, number>();
  const restaurantIds = Array.from(
    new Set((membershipData ?? []).map((membership) => membership.restaurant_id as number)),
  );

  const { data: restaurantData, error: restaurantError } = restaurantIds.length
    ? await selectRestaurantsWithLocation(
      (select) => supabase.from("restaurants").select(select).in("id", restaurantIds),
      "collection places",
    )
    : { data: [], error: null };

  if (restaurantError) {
    reportQueryError("collection places", restaurantError);
    return {
      collections: [] as CollectionListItem[],
      error: restaurantError,
    };
  }

  const restaurantsById = new Map(
    (restaurantData as Array<CollectionPlacePreview> | undefined ?? []).map((restaurant) => [
      restaurant.id,
      restaurant,
    ]),
  );

  (membershipData ?? []).forEach((membership) => {
    const currentCount = placeCountByCollectionId.get(membership.collection_id) ?? 0;
    placeCountByCollectionId.set(membership.collection_id, currentCount + 1);
  });

  return {
    collections: ((collectionsData ?? []) as Omit<CollectionListItem, "place_count">[]).map(
      (collection) => ({
        ...collection,
        place_count: placeCountByCollectionId.get(collection.id) ?? 0,
        places: (membershipData ?? [])
          .filter((membership) => membership.collection_id === collection.id)
          .map((membership): CollectionPlacePreview | undefined => restaurantsById.get(membership.restaurant_id as number))
          .filter((place): place is CollectionPlacePreview => Boolean(place)),
      }),
    ),
    error: null,
  };
}

export async function getCurrentUserCollectionOptions() {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("collections")
    .select("id, name, created_at")
    .order("created_at", { ascending: false });
  reportQueryError("collection options", error);

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
  reportQueryError("place collection memberships", error);

  return {
    collectionIds: (data ?? []).map((membership) => membership.collection_id as number),
    error,
  };
}
