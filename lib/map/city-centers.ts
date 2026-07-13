export const cityLocationPrecision = "city" as const;
export const localCityCenterSource = "local_city_center" as const;

export type CityCenterRecord = {
  cityName: string;
  latitude: number;
  longitude: number;
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
  { cityName: "Tokyo", latitude: 35.6762, longitude: 139.6503 },
  { cityName: "New York", latitude: 40.7128, longitude: -74.006 },
] as const satisfies readonly CityCenterRecord[];

const chineseMunicipalitySuffix = "市";

const englishAliasMap = new Map<string, string>([
  ["beijing", "北京"],
  ["beijing city", "北京"],
  ["shanghai", "上海"],
  ["shanghai city", "上海"],
  ["guangzhou", "广州"],
  ["guangzhou city", "广州"],
  ["shenzhen", "深圳"],
  ["shenzhen city", "深圳"],
  ["chengdu", "成都"],
  ["chengdu city", "成都"],
  ["chongqing", "重庆"],
  ["chongqing city", "重庆"],
  ["hangzhou", "杭州"],
  ["hangzhou city", "杭州"],
  ["nanjing", "南京"],
  ["nanjing city", "南京"],
  ["wuhan", "武汉"],
  ["wuhan city", "武汉"],
  ["xian", "西安"],
  ["xi'an", "西安"],
  ["xian city", "西安"],
  ["xi'an city", "西安"],
  ["suzhou", "苏州"],
  ["suzhou city", "苏州"],
  ["tianjin", "天津"],
  ["tianjin city", "天津"],
  ["qingdao", "青岛"],
  ["qingdao city", "青岛"],
  ["xiamen", "厦门"],
  ["xiamen city", "厦门"],
  ["changsha", "长沙"],
  ["changsha city", "长沙"],
  ["zhengzhou", "郑州"],
  ["zhengzhou city", "郑州"],
  ["kunming", "昆明"],
  ["kunming city", "昆明"],
  ["sanya", "三亚"],
  ["sanya city", "三亚"],
  ["hong kong", "香港"],
  ["hong kong city", "香港"],
  ["macau", "澳门"],
  ["macao", "澳门"],
  ["new york", "New York"],
  ["new york city", "New York"],
  ["tokyo", "Tokyo"],
  ["tokyo city", "Tokyo"],
]);

const directCityLookup = new Map<string, CityCenterRecord>(
  cityCenterRecords.map((record) => [record.cityName, record]),
);

function normalizeWhitespace(value: string) {
  return value.trim().replace(/\s+/gu, " ");
}

function removeKnownChineseCitySuffix(city: string) {
  if (!city.endsWith(chineseMunicipalitySuffix)) {
    return null;
  }

  return city.slice(0, -1);
}

export function getInitialCityCenterDataset() {
  return cityCenterRecords.map((record) => ({ ...record }));
}

export function normalizeCityName(city: string | null | undefined) {
  if (!city) {
    return null;
  }

  const trimmed = normalizeWhitespace(city);

  if (!trimmed) {
    return null;
  }

  const englishAlias = englishAliasMap.get(trimmed.toLowerCase());

  if (englishAlias) {
    return englishAlias;
  }

  if (directCityLookup.has(trimmed)) {
    return trimmed;
  }

  const withoutChineseCitySuffix = removeKnownChineseCitySuffix(trimmed);

  if (
    withoutChineseCitySuffix &&
    directCityLookup.has(withoutChineseCitySuffix)
  ) {
    return withoutChineseCitySuffix;
  }

  return null;
}

export function normalizeCityForComparison(city: string | null | undefined) {
  if (!city) {
    return null;
  }

  const trimmed = normalizeWhitespace(city);

  if (!trimmed) {
    return null;
  }

  return normalizeCityName(trimmed) ?? trimmed;
}

export function resolveApproximateCityCenter(
  city: string | null | undefined,
): ApproximateCityCenterLocation | null {
  const normalizedCityName = normalizeCityName(city);

  if (!normalizedCityName) {
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
