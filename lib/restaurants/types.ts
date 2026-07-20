import type { RestaurantCategory, RestaurantPrivacy } from "./constants.ts";
import type { SourceResolutionStatus } from "../intake/types.ts";

export type RestaurantInsertInput = {
  name: string;
  city: string;
  country?: string | null;
  district?: string | null;
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
  intakeInput?: string;
  resolvedSourceUrl?: string;
  sourceResolutionStatus?: SourceResolutionStatus;
  sourceResolutionRedirectCount?: number;
};

export type RestaurantUpdateInput = {
  id: number;
  name?: string;
  city?: string;
  country?: string | null;
  district?: string | null;
  privacy: RestaurantPrivacy;
  category: RestaurantCategory;
  address?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  cuisine: string | null;
  note: string | null;
};

export type RestaurantListItem = {
  id: number;
  name: string;
  city: string;
  country?: string | null;
  district?: string | null;
  source_url: string;
  privacy: RestaurantPrivacy;
  category: RestaurantCategory;
  address: string | null;
  cuisine: string | null;
  note: string | null;
  latitude?: number | null;
  longitude?: number | null;
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
  "id" | "name" | "city" | "country" | "district" | "category"
> & {
  cuisine?: string | null;
};

export type CollectionOptionItem = {
  id: number;
  name: string;
};

export type RestaurantEditItem = {
  id: number;
  name: string;
  city: string;
  country?: string | null;
  district?: string | null;
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
  country?: string | null;
  district?: string | null;
  category: RestaurantCategory;
  address: string | null;
  cuisine: string | null;
  note: string | null;
  latitude: number | null;
  longitude: number | null;
};
