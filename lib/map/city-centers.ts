import {
  getKnownCityCountry,
  normalizeCityForComparison,
  normalizeCityName,
  normalizeCountryName,
} from "../location.ts";

export { normalizeCityForComparison, normalizeCityName } from "../location.ts";

export const cityLocationPrecision = "city" as const;
export const localCityCenterSource = "local_city_center" as const;

export type CityCenterRecord = {
  cityName: string;
  latitude: number;
  longitude: number;
  country?: string;
};

export type ApproximateCityCenterLocation = {
  normalizedCityName: string;
  latitude: number;
  longitude: number;
  precision: typeof cityLocationPrecision;
  approximate: true;
  source: typeof localCityCenterSource;
};

const cityCenterRecords = [
  { cityName: "北京", latitude: 39.9042, longitude: 116.4074 },
  { cityName: "上海", latitude: 31.2304, longitude: 121.4737 },
  { cityName: "广州", latitude: 23.1291, longitude: 113.2644 },
  { cityName: "深圳", latitude: 22.5431, longitude: 114.0579 },
  { cityName: "成都", latitude: 30.5728, longitude: 104.0668 },
  { cityName: "重庆", latitude: 29.563, longitude: 106.5516 },
  { cityName: "杭州", latitude: 30.2741, longitude: 120.1551 },
  { cityName: "南京", latitude: 32.0603, longitude: 118.7969 },
  { cityName: "武汉", latitude: 30.5928, longitude: 114.3055 },
  { cityName: "西安", latitude: 34.3416, longitude: 108.9398 },
  { cityName: "苏州", latitude: 31.2989, longitude: 120.5853 },
  { cityName: "天津", latitude: 39.0851, longitude: 117.1994 },
  { cityName: "青岛", latitude: 36.0671, longitude: 120.3826 },
  { cityName: "厦门", latitude: 24.4798, longitude: 118.0894 },
  { cityName: "长沙", latitude: 28.2282, longitude: 112.9388 },
  { cityName: "郑州", latitude: 34.7473, longitude: 113.6249 },
  { cityName: "昆明", latitude: 25.0389, longitude: 102.7183 },
  { cityName: "三亚", latitude: 18.2528, longitude: 109.5121 },
  { cityName: "香港", latitude: 22.3193, longitude: 114.1694 },
  { cityName: "澳门", latitude: 22.1987, longitude: 113.5439 },
  { cityName: "Tokyo", latitude: 35.6762, longitude: 139.6503, country: "日本" },
  { cityName: "Osaka", latitude: 34.6937, longitude: 135.5023, country: "日本" },
  { cityName: "Kyoto", latitude: 35.0116, longitude: 135.7681, country: "日本" },
  { cityName: "Seoul", latitude: 37.5665, longitude: 126.978, country: "韩国" },
  { cityName: "Bangkok", latitude: 13.7563, longitude: 100.5018, country: "泰国" },
  { cityName: "Singapore", latitude: 1.3521, longitude: 103.8198, country: "新加坡" },
  { cityName: "Taipei", latitude: 25.033, longitude: 121.5654, country: "中国台湾" },
  { cityName: "London", latitude: 51.5074, longitude: -0.1278, country: "英国" },
  { cityName: "Paris", latitude: 48.8566, longitude: 2.3522, country: "法国" },
  { cityName: "New York", latitude: 40.7128, longitude: -74.006, country: "美国" },
  { cityName: "Los Angeles", latitude: 34.0522, longitude: -118.2437, country: "美国" },
  { cityName: "San Francisco", latitude: 37.7749, longitude: -122.4194, country: "美国" },
  { cityName: "Sydney", latitude: -33.8688, longitude: 151.2093, country: "澳大利亚" },
] as const satisfies readonly CityCenterRecord[];

const directCityLookup = new Map<string, CityCenterRecord>(
  cityCenterRecords.map((record) => [record.cityName, record]),
);

export function getInitialCityCenterDataset(): CityCenterRecord[] {
  return cityCenterRecords.map((record) => ({ ...record }));
}

export function resolveApproximateCityCenter(
  city: string | null | undefined,
  country?: string | null,
): ApproximateCityCenterLocation | null {
  const normalizedCityName = normalizeCityName(city);

  if (!normalizedCityName) {
    return null;
  }

  const normalizedCountry = normalizeCountryName(country);
  const knownCountry = getKnownCityCountry(city);

  if (normalizedCountry && knownCountry && normalizedCountry !== knownCountry) {
    return null;
  }

  const cityCenter = directCityLookup.get(normalizedCityName);

  if (!cityCenter) {
    return null;
  }

  return {
    normalizedCityName,
    latitude: cityCenter.latitude,
    longitude: cityCenter.longitude,
    precision: cityLocationPrecision,
    approximate: true,
    source: localCityCenterSource,
  };
}
