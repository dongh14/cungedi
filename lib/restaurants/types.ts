export type RestaurantInsertInput = {
  name: string;
  city: string;
  sourceUrl: string;
  privacy: "private" | "public";
  address: string | null;
  cuisine: string | null;
  note: string | null;
};

export type RestaurantUpdateInput = {
  id: number;
  privacy: "private" | "public";
  cuisine: string | null;
  note: string | null;
};

export type RestaurantListItem = {
  id: number;
  name: string;
  city: string;
  source_url: string;
  privacy: "private" | "public";
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
  privacy: "private" | "public";
  address: string | null;
  cuisine: string | null;
  note: string | null;
  created_at: string;
};
