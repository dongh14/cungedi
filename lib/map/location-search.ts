import { getInitialAreaCenterDataset } from "./area-centers.ts";
import { getInitialCityCenterDataset } from "./city-centers.ts";
import { findKnownCityInText, normalizeCityForComparison, normalizeLocationText } from "../location.ts";

export type LocalLocationSearchCandidate = {
  id: string;
  label: string;
  subtitle: string;
  city: string | null;
  country: string | null;
  district: string | null;
  address: string | null;
  latitude: number;
  longitude: number;
  approximate: boolean;
};

type CurrentPlaceCandidate = {
  id: string | number;
  name: string;
  city: string;
  country?: string | null;
  district?: string | null;
  address?: string | null;
  latitude?: number | null;
  longitude?: number | null;
};

function normalizeSearchValue(value: string) {
  return normalizeLocationText(value)?.toLocaleLowerCase("zh-CN") ?? "";
}

function includesSearchValue(values: Array<string | null | undefined>, query: string) {
  return values.some((value) => {
    const normalized = normalizeSearchValue(value ?? "");

    return normalized.includes(query) || query.includes(normalized) && normalized.length > 1;
  });
}

export function searchLocalLocationCandidates(
  query: string,
  currentPlace?: CurrentPlaceCandidate,
): LocalLocationSearchCandidate[] {
  const normalizedQuery = normalizeSearchValue(query);

  if (!normalizedQuery) {
    return [];
  }

  const candidates: LocalLocationSearchCandidate[] = [];
  const knownCityInQuery = findKnownCityInText(query);

  if (
    currentPlace?.latitude !== null &&
    currentPlace?.longitude !== null &&
    typeof currentPlace?.latitude === "number" &&
    typeof currentPlace?.longitude === "number"
  ) {
    const currentValues = [
      currentPlace.name,
      currentPlace.city,
      currentPlace.country,
      currentPlace.district,
      currentPlace.address,
    ];

    if (includesSearchValue(currentValues, normalizedQuery)) {
      candidates.push({
        id: `place-${currentPlace.id}`,
        label: currentPlace.name,
        subtitle: [currentPlace.district, currentPlace.city, currentPlace.country]
          .filter(Boolean)
          .join(" · "),
        city: currentPlace.city,
        country: currentPlace.country ?? null,
        district: currentPlace.district ?? null,
        address: currentPlace.address ?? null,
        latitude: currentPlace.latitude,
        longitude: currentPlace.longitude,
        approximate: false,
      });
    }
  }

  for (const record of getInitialAreaCenterDataset()) {
    if (
      !includesSearchValue([record.district, record.city, record.country], normalizedQuery) &&
      normalizeCityForComparison(record.city) !== knownCityInQuery
    ) {
      continue;
    }

    candidates.push({
      id: `district-${record.district}-${record.city}`,
      label: record.district,
      subtitle: [record.city, record.country].filter(Boolean).join(" · "),
      city: record.city,
      country: record.country,
      district: record.district,
      address: null,
      latitude: record.latitude,
      longitude: record.longitude,
      approximate: true,
    });
  }

  for (const record of getInitialCityCenterDataset()) {
    if (
      !includesSearchValue([record.cityName, record.country], normalizedQuery) &&
      normalizeCityForComparison(record.cityName) !== knownCityInQuery
    ) {
      continue;
    }

    candidates.push({
      id: `city-${record.cityName}-${record.country ?? "unknown"}`,
      label: record.cityName,
      subtitle: record.country ?? "区域位置",
      city: record.cityName,
      country: record.country ?? null,
      district: null,
      address: null,
      latitude: record.latitude,
      longitude: record.longitude,
      approximate: true,
    });
  }

  return Array.from(new Map(candidates.map((candidate) => [candidate.id, candidate])).values())
    .slice(0, 8);
}
