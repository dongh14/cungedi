import { resolvePlaceLocation } from "../map/place-location.ts";
import { getPlaceCategoryLabel } from "./constants.ts";
import type { RestaurantCollectionBadge, RestaurantEditItem } from "./types.ts";

export type PlaceDetailsInput = RestaurantEditItem & {
  collections?: RestaurantCollectionBadge[];
};

export type PlaceDetailsDisplayData = {
  detailHref: string;
  editHref: string;
  name: string;
  category: string;
  subcategory: string | null;
  city: string | null;
  address: string | null;
  notes: string | null;
  createdAtLabel: string;
  sourceLabel: string;
  sourceHref: string | null;
  collections: RestaurantCollectionBadge[];
  location:
    | {
        status: "resolved";
        latitude: number;
        longitude: number;
        approximate: boolean;
        label: string;
        description: string;
      }
    | {
        status: "unresolved";
        label: string;
        description: string;
      };
};

function optionalText(value: string | null | undefined) {
  const normalized = value?.trim() ?? "";
  return normalized || null;
}

function getSourcePresentation(value: string) {
  try {
    const url = new URL(value);

    if (url.protocol !== "http:" && url.protocol !== "https:") {
      return { label: "原始来源", href: null };
    }

    const hostname = url.hostname.replace(/^www\./u, "");
    return {
      label: hostname || "原始来源",
      href: url.toString(),
    };
  } catch {
    return { label: "原始来源", href: null };
  }
}

function formatCreatedAt(value: string) {
  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(value));
}

export function getPlaceDetailsDisplayData(
  place: PlaceDetailsInput,
): PlaceDetailsDisplayData {
  const source = getSourcePresentation(place.source_url);
  const location = resolvePlaceLocation(place);
  const collections = Array.from(
    new Map((place.collections ?? []).map((collection) => [collection.id, collection])).values(),
  );
  const locationData =
    location.status === "resolved"
      ? {
          status: "resolved" as const,
          latitude: location.location.latitude,
          longitude: location.location.longitude,
          approximate: location.location.approximate,
          label: location.location.approximate ? "近似位置" : "精确位置",
          description: location.location.approximate
            ? "根据已保存城市显示本地城市中心，仅作为参考。"
            : "使用已保存的精确坐标显示。",
        }
      : {
          status: "unresolved" as const,
          label: "暂时没有可显示的位置",
          description: "这条地点记录还没有可用的精确坐标或已知城市位置。",
        };

  return {
    detailHref: `/restaurants/${place.id}`,
    editHref: `/restaurants/${place.id}/edit`,
    name: place.name,
    category: getPlaceCategoryLabel(place.category),
    subcategory: optionalText(place.cuisine),
    city: optionalText(place.city),
    address: optionalText(place.address),
    notes: optionalText(place.note),
    createdAtLabel: formatCreatedAt(place.created_at),
    sourceLabel: source.label,
    sourceHref: source.href,
    collections,
    location: locationData,
  };
}
