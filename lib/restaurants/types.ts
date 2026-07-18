import type { RestaurantCategory, RestaurantPrivacy } from "./constants.ts";

export type RestaurantInsertInput = {
  name: string;
  city: string;
  sourceUrl: string;
  privacy: RestaurantPrivacy;
  category: RestaurantCategory;
  address: string | null;
  cuisine: string | null;
  note: string | null;
  collectionIds?: number[];
  returnTo?: "new" | "review";
  reviewSourceUrl?: string;
  manualEvidence?: string;
};

export type RestaurantUpdateInput = {
  id: number;
  privacy: RestaurantPrivacy;
  category: RestaurantCategory;
  cuisine: string | null;
  note: string | null;
};

export type RestaurantListItem = {
  id: number;
  name: string;
  city: string;
  source_url: string;
  privacy: RestaurantPrivacy;
  category: RestaurantCategory;
  address: string | null;
  cuisine: string | null;
  note: string | null;
  created_at: string;
};

export type RestaurantCollectionBadge = {
  id: number;
  name: string;
};

export type DiscoveryPlaceItem = RestaurantListItem & {
  imageUrl?: string | null;
  collections: RestaurantCollectionBadge[];
};

export type CollectionListItem = {
  id: number;
  name: string;
  created_at: string;
  updated_at: string;
  place_count: number;
  places?: CollectionPlacePreview[];
};

export type CollectionPlacePreview = Pick<
  RestaurantListItem,
  "id" | "name" | "city" | "category"
>;

export type CollectionOptionItem = {
  id: number;
  name: string;
};

export type RestaurantEditItem = {
  id: number;
  name: string;
  city: string;
  source_url: string;
  privacy: RestaurantPrivacy;
  category: RestaurantCategory;
  address: string | null;
  cuisine: string | null;
  note: string | null;
  latitude: number | null;
  longitude: number | null;
  created_at: string;
};

export type RestaurantDetailCollection = RestaurantCollectionBadge;

export type RestaurantMapItem = {
  id: number;
  name: string;
  city: string;
  category: RestaurantCategory;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
};
