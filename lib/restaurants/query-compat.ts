import {
  logRestaurantQueryError,
  normalizeRestaurantQueryError,
} from "./query-diagnostics.ts";

export const restaurantSelectWithLocation =
  "id, name, city, country, district, source_url, privacy, category, address, cuisine, note, latitude, longitude, created_at";

export type RestaurantQueryError = {
  operation?: string;
  name?: string;
  code?: string;
  message?: string;
  details?: string;
  hint?: string;
};

type QueryResult = {
  data: unknown;
  error: unknown;
};

/**
 * Keep every restaurant read on the migrated location projection so map,
 * dashboard, list, and collection previews cannot drift to city-only data.
 */
export function selectRestaurantsWithLocation(
  run: (select: string) => PromiseLike<QueryResult>,
  operation = "restaurant query",
): Promise<{ data: unknown; error: RestaurantQueryError | null }> {
  return Promise.resolve()
    .then(() => run(restaurantSelectWithLocation))
    .then((result) => {
      if (!result.error) {
        return { data: result.data, error: null };
      }

      logRestaurantQueryError(operation, result.error);
      return {
        data: result.data,
        error: normalizeRestaurantQueryError(operation, result.error),
      };
    })
    .catch((error: unknown) => {
      logRestaurantQueryError(operation, error);
      return {
        data: null,
        error: normalizeRestaurantQueryError(operation, error),
      };
    });
}
