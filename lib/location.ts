export type CountryRecord = {
  canonicalName: string;
  aliases: readonly string[];
};

type CityAliasRecord = {
  canonicalName: string;
  aliases: readonly string[];
  country?: string;
};

type DistrictAliasRecord = {
  canonicalName: string;
  aliases: readonly string[];
  city: string;
};

const countryRecords = [
  { canonicalName: "日本", aliases: ["日本", "japan"] },
  { canonicalName: "中国", aliases: ["中国", "china"] },
  { canonicalName: "美国", aliases: ["美国", "united states", "usa", "us"] },
  { canonicalName: "韩国", aliases: ["韩国", "south korea", "korea"] },
  { canonicalName: "泰国", aliases: ["泰国", "thailand"] },
  { canonicalName: "新加坡", aliases: ["新加坡", "singapore"] },
  { canonicalName: "英国", aliases: ["英国", "united kingdom", "uk", "england"] },
  { canonicalName: "法国", aliases: ["法国", "france"] },
  { canonicalName: "澳大利亚", aliases: ["澳大利亚", "australia"] },
  { canonicalName: "中国香港", aliases: ["中国香港", "hong kong"] },
  { canonicalName: "中国台湾", aliases: ["中国台湾", "taiwan", "台湾"] },
] as const satisfies readonly CountryRecord[];

const cityAliasRecords = [
  { canonicalName: "北京", aliases: ["北京", "北京市", "beijing", "beijing city"], country: "中国" },
  { canonicalName: "上海", aliases: ["上海", "上海市", "shanghai", "shanghai city"], country: "中国" },
  { canonicalName: "广州", aliases: ["广州", "广州市", "guangzhou", "guangzhou city"], country: "中国" },
  { canonicalName: "深圳", aliases: ["深圳", "深圳市", "shenzhen", "shenzhen city"], country: "中国" },
  { canonicalName: "成都", aliases: ["成都", "成都市", "chengdu", "chengdu city"], country: "中国" },
  { canonicalName: "重庆", aliases: ["重庆", "chongqing", "chongqing city"], country: "中国" },
  { canonicalName: "杭州", aliases: ["杭州", "杭州市", "hangzhou", "hangzhou city"], country: "中国" },
  { canonicalName: "南京", aliases: ["南京", "南京市", "nanjing", "nanjing city"], country: "中国" },
  { canonicalName: "武汉", aliases: ["武汉", "武汉市", "wuhan", "wuhan city"], country: "中国" },
  { canonicalName: "西安", aliases: ["西安", "西安市", "xian", "xi'an", "xian city", "xi'an city"], country: "中国" },
  { canonicalName: "苏州", aliases: ["苏州", "苏州市", "suzhou", "suzhou city"], country: "中国" },
  { canonicalName: "天津", aliases: ["天津", "天津市", "tianjin", "tianjin city"], country: "中国" },
  { canonicalName: "青岛", aliases: ["青岛", "青岛市", "qingdao", "qingdao city"], country: "中国" },
  { canonicalName: "厦门", aliases: ["厦门", "厦门市", "xiamen", "xiamen city"], country: "中国" },
  { canonicalName: "长沙", aliases: ["长沙", "长沙市", "changsha", "changsha city"], country: "中国" },
  { canonicalName: "郑州", aliases: ["郑州", "郑州市", "zhengzhou", "zhengzhou city"], country: "中国" },
  { canonicalName: "昆明", aliases: ["昆明", "昆明市", "kunming", "kunming city"], country: "中国" },
  { canonicalName: "三亚", aliases: ["三亚", "三亚市", "sanya", "sanya city"], country: "中国" },
  { canonicalName: "香港", aliases: ["香港", "hong kong", "hong kong city"], country: "中国香港" },
  { canonicalName: "澳门", aliases: ["澳门", "macau", "macao"], country: "中国" },
  { canonicalName: "Tokyo", aliases: ["Tokyo", "Tokyo City", "东京", "東京"], country: "日本" },
  { canonicalName: "Osaka", aliases: ["Osaka", "Osaka City", "大阪", "大阪市"], country: "日本" },
  { canonicalName: "Kyoto", aliases: ["Kyoto", "Kyoto City", "京都", "京都市"], country: "日本" },
  { canonicalName: "Seoul", aliases: ["Seoul", "首尔", "서울"], country: "韩国" },
  { canonicalName: "Bangkok", aliases: ["Bangkok", "曼谷"], country: "泰国" },
  { canonicalName: "Singapore", aliases: ["Singapore", "新加坡"], country: "新加坡" },
  { canonicalName: "Taipei", aliases: ["Taipei", "台北"], country: "中国台湾" },
  { canonicalName: "London", aliases: ["London", "伦敦"], country: "英国" },
  { canonicalName: "Paris", aliases: ["Paris", "巴黎"], country: "法国" },
  { canonicalName: "New York", aliases: ["New York", "New York City", "纽约", "nyc"], country: "美国" },
  { canonicalName: "Los Angeles", aliases: ["Los Angeles", "洛杉矶"], country: "美国" },
  { canonicalName: "San Francisco", aliases: ["San Francisco", "旧金山"], country: "美国" },
  { canonicalName: "Sydney", aliases: ["Sydney", "悉尼"], country: "澳大利亚" },
] as const satisfies readonly CityAliasRecord[];

const districtAliasRecords = [
  { canonicalName: "静安区", aliases: ["静安区", "静安", "jing'an district", "jing an district"], city: "上海" },
  { canonicalName: "Shinjuku", aliases: ["Shinjuku", "Shinjuku City", "新宿", "新宿区"], city: "Tokyo" },
  { canonicalName: "Gangnam", aliases: ["Gangnam", "Gangnam-gu", "江南区"], city: "Seoul" },
  { canonicalName: "Manhattan", aliases: ["Manhattan", "曼哈顿"], city: "New York" },
] as const satisfies readonly DistrictAliasRecord[];

const countryAliasLookup = new Map<string, string>(
  countryRecords.flatMap((record) =>
    record.aliases.map((alias) => [alias.toLocaleLowerCase("zh-CN"), record.canonicalName] as const),
  ),
);
const cityAliasLookup = new Map<string, CityAliasRecord>(
  cityAliasRecords.flatMap((record) =>
    record.aliases.map((alias) => [normalizeLookupValue(alias), record] as const),
  ),
);
const districtAliasLookup = new Map<string, DistrictAliasRecord>(
  districtAliasRecords.flatMap((record) =>
    record.aliases.map((alias) => [normalizeLookupValue(alias), record] as const),
  ),
);

function normalizeLookupValue(value: string) {
  return value.trim().replace(/\s+/gu, " ").toLocaleLowerCase("zh-CN");
}

export function normalizeLocationText(value: string | null | undefined) {
  const normalized = value?.trim().replace(/\s+/gu, " ") ?? "";

  return normalized || null;
}

export function getInitialCountryDataset() {
  return countryRecords.map((record) => ({
    canonicalName: record.canonicalName,
    aliases: [...record.aliases],
  }));
}

export function normalizeCountryName(value: string | null | undefined) {
  const normalized = normalizeLocationText(value);

  return normalized ? countryAliasLookup.get(normalizeLookupValue(normalized)) ?? null : null;
}

export function isCountryLevelLocation(value: string | null | undefined) {
  return normalizeCountryName(value) !== null;
}

export function normalizeCityName(value: string | null | undefined) {
  const normalized = normalizeLocationText(value);

  if (!normalized) {
    return null;
  }

  return cityAliasLookup.get(normalizeLookupValue(normalized))?.canonicalName ?? null;
}

export function normalizeCityForComparison(value: string | null | undefined) {
  const normalized = normalizeLocationText(value);

  return normalized ? normalizeCityName(normalized) ?? normalized : null;
}

export function getKnownCityCountry(value: string | null | undefined) {
  const normalized = normalizeLocationText(value);

  return normalized ? cityAliasLookup.get(normalizeLookupValue(normalized))?.country ?? null : null;
}

export function normalizeDistrictName(value: string | null | undefined) {
  const normalized = normalizeLocationText(value);

  return normalized
    ? districtAliasLookup.get(normalizeLookupValue(normalized))?.canonicalName ?? null
    : null;
}

export function getKnownDistrictCity(value: string | null | undefined) {
  const normalized = normalizeLocationText(value);

  return normalized
    ? districtAliasLookup.get(normalizeLookupValue(normalized))?.city ?? null
    : null;
}

export function getKnownDistrictAliases() {
  return districtAliasRecords.flatMap((record) => [...record.aliases]);
}

export function findKnownDistrictInText(
  value: string | null | undefined,
  city?: string | null,
) {
  const text = normalizeLocationText(value);

  if (!text) {
    return null;
  }

  const normalizedCity = normalizeCityForComparison(city);
  const aliases = getKnownDistrictAliases().sort((left, right) => right.length - left.length);
  const match = aliases.find((alias) => {
    const recordCity = getKnownDistrictCity(alias);

    if (normalizedCity && recordCity && normalizeCityForComparison(recordCity) !== normalizedCity) {
      return false;
    }

    const pattern = /^[a-z]/iu.test(alias)
      ? `\\b${alias.replace(/[.*+?^${}()|[\\]\\]/g, "\\\\$&")}\\b`
      : alias.replace(/[.*+?^${}()|[\\]\\]/g, "\\\\$&");

    return new RegExp(pattern, "iu").test(text);
  });

  return match ? normalizeDistrictName(match) : null;
}

export type PlaceAreaInput = {
  city?: string | null;
  country?: string | null;
  district?: string | null;
  address?: string | null;
};

export type ResolvedPlaceArea = {
  city: string | null;
  country: string | null;
  district: string | null;
};

export function resolvePlaceArea(input: PlaceAreaInput): ResolvedPlaceArea {
  const city = normalizeLocationText(input.city);
  const explicitCountry = normalizeLocationText(input.country);
  const knownCountry = getKnownCityCountry(city);
  const country = normalizeCountryName(explicitCountry)
    ?? explicitCountry
    ?? knownCountry;
  const explicitDistrict = normalizeLocationText(input.district);
  const district = explicitDistrict
    ? normalizeDistrictName(explicitDistrict) ?? explicitDistrict
    : findKnownDistrictInText(input.address, city);

  return { city, country, district };
}

export function getKnownCityAliases() {
  return cityAliasRecords.flatMap((record) => [...record.aliases]);
}

export function findKnownCityInText(value: string | null | undefined) {
  const text = normalizeLocationText(value);

  if (!text) {
    return null;
  }

  const aliases = getKnownCityAliases().sort((left, right) => right.length - left.length);
  const match = aliases.find((alias) => {
    const pattern = /^[a-z]/iu.test(alias)
      ? `\\b${alias.replace(/[.*+?^${}()|[\\]\\]/g, "\\\\$&")}\\b`
      : alias.replace(/[.*+?^${}()|[\\]\\]/g, "\\\\$&");

    return new RegExp(pattern, "iu").test(text);
  });

  return match ? normalizeCityName(match) : null;
}

export function formatLocationLabel(
  city: string | null | undefined,
  country: string | null | undefined,
) {
  const displayCity = normalizeLocationText(city);
  const displayCountry = normalizeLocationText(country);

  if (!displayCity) {
    return displayCountry ?? "";
  }

  if (!displayCountry) {
    return displayCity;
  }

  const normalizedCity = normalizeCityForComparison(displayCity)?.toLocaleLowerCase("zh-CN");
  const normalizedCountry = normalizeCountryName(displayCountry)?.toLocaleLowerCase("zh-CN") ?? normalizeLookupValue(displayCountry);
  const countryAsCity = normalizeCityForComparison(displayCountry)?.toLocaleLowerCase("zh-CN");

  return normalizedCity === normalizedCountry || normalizedCity === countryAsCity
    ? displayCity
    : `${displayCity} · ${displayCountry}`;
}
