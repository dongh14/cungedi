import type { RestaurantCategory, RestaurantPrivacy } from "./constants";

export type RestaurantInsertInput = {
  name: string;
  city: string;
  sourceUrl: string;
  privacy: RestaurantPrivacy;
  category: RestaurantCategory;
  address: string | null;
  cuisine: string | null;
  note: string | null;
  returnTo?: "new" | "review";
  reviewSourceUrl?: string;
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
  created_at: string;
};

export type RestaurantMapItem = {
  id: number;
  name: string;
  city: string;
  category: RestaurantCategory;
  latitude: number | null;
  longitude: number | null;
};
