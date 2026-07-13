export type CountryRecord = {
  canonicalName: string;
  aliases: readonly string[];
};

const countryRecords = [
  {
    canonicalName: "日本",
    aliases: ["日本", "japan"],
  },
  {
    canonicalName: "中国",
    aliases: ["中国", "china"],
  },
  {
    canonicalName: "美国",
    aliases: ["美国", "united states", "usa", "us"],
  },
  {
    canonicalName: "韩国",
    aliases: ["韩国", "south korea", "korea"],
  },
] as const satisfies readonly CountryRecord[];

const countryAliasLookup = new Map<string, string>(
  countryRecords.flatMap((record) =>
    record.aliases.map((alias) => [alias.toLocaleLowerCase("zh-CN"), record.canonicalName] as const),
  ),
);

function normalizeWhitespace(value: string) {
  return value.trim().replace(/\s+/gu, " ");
}

export function getInitialCountryDataset() {
  return countryRecords.map((record) => ({
    canonicalName: record.canonicalName,
    aliases: [...record.aliases],
  }));
}

export function normalizeCountryName(location: string | null | undefined) {
  if (!location) {
    return null;
  }

  const trimmed = normalizeWhitespace(location);

  if (!trimmed) {
    return null;
  }

  return countryAliasLookup.get(trimmed.toLocaleLowerCase("zh-CN")) ?? null;
}

export function isCountryLevelLocation(location: string | null | undefined) {
  return normalizeCountryName(location) !== null;
}
