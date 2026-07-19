import {
  getKnownDistrictCity,
  normalizeCityForComparison,
  normalizeCountryName,
  normalizeDistrictName,
} from "../location.ts";

export type AreaCenterLocation = {
  normalizedDistrictName: string;
  normalizedCityName: string;
  latitude: number;
  longitude: number;
  precision: "district";
  approximate: true;
  source: "local_district_center";
};

const districtCenters = [
  { district: "静安区", city: "上海", country: "中国", latitude: 31.228, longitude: 121.445 },
  { district: "Shinjuku", city: "Tokyo", country: "日本", latitude: 35.6938, longitude: 139.7034 },
  { district: "Gangnam", city: "Seoul", country: "韩国", latitude: 37.4979, longitude: 127.0276 },
  { district: "Manhattan", city: "New York", country: "美国", latitude: 40.7831, longitude: -73.9712 },
] as const;

export function getInitialAreaCenterDataset() {
  return districtCenters.map((record) => ({ ...record }));
}

export function resolveApproximateAreaCenter(
  district: string | null | undefined,
  city?: string | null,
  country?: string | null,
): AreaCenterLocation | null {
  const normalizedDistrict = normalizeDistrictName(district);

  if (!normalizedDistrict) {
    return null;
  }

  const record = districtCenters.find((candidate) => candidate.district === normalizedDistrict);

  if (!record) {
    return null;
  }

  const normalizedCity = normalizeCityForComparison(city);
  const knownDistrictCity = normalizeCityForComparison(getKnownDistrictCity(normalizedDistrict));
  const normalizedCountry = normalizeCountryName(country);

  if (normalizedCity && knownDistrictCity && normalizedCity !== knownDistrictCity) {
    return null;
  }

  if (normalizedCountry && normalizeCountryName(record.country) !== normalizedCountry) {
    return null;
  }

  return {
    normalizedDistrictName: record.district,
    normalizedCityName: getKnownDistrictCity(normalizedDistrict) ?? record.city,
    latitude: record.latitude,
    longitude: record.longitude,
    precision: "district",
    approximate: true,
    source: "local_district_center",
  };
}
