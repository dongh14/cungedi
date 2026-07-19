import {
  normalizeCountryName,
  normalizeLocationText,
  normalizeCityForComparison,
  normalizeCityName,
} from "./location.ts";

export const allCountriesFilterValue = "";
export const allCitiesFilterValue = "";
export const unassignedCountryFilterValue = "__unassigned_country__";

export type LocationHierarchyState = {
  selectedCountry: string;
  selectedCity: string;
  selectedDistrict?: string;
};

export type LocationHierarchyOption = {
  value: string;
  label: string;
  placeCount: number;
};

export type LocationHierarchyCountry = LocationHierarchyOption & {
  cities: LocationHierarchyCity[];
};

export type LocationHierarchyCity = LocationHierarchyOption & {
  districts?: LocationHierarchyOption[];
};

type LocationRecord = {
  city: string | null | undefined;
  country?: string | null;
  district?: string | null;
};

function normalizeIdentity(value: string | null | undefined) {
  return normalizeLocationText(value)?.toLocaleLowerCase("zh-CN") ?? "";
}

export function getCountryIdentity(value: string | null | undefined) {
  return normalizeCountryName(value) ?? normalizeLocationText(value) ?? unassignedCountryFilterValue;
}

export function getCityIdentity(value: string | null | undefined) {
  return (normalizeCityForComparison(value) ?? normalizeLocationText(value) ?? "").toLocaleLowerCase("zh-CN");
}

export function getCountryLabel(value: string | null | undefined) {
  return normalizeLocationText(value) ?? "未标注国家";
}

export function getCityLabel(value: string | null | undefined) {
  return normalizeCityName(value) ?? normalizeLocationText(value) ?? "未标注城市";
}

export function formatHierarchyLocationLabel(
  country: string | null | undefined,
  city: string | null | undefined,
  district?: string | null,
) {
  const displayCountry = country === unassignedCountryFilterValue ? null : normalizeLocationText(country);
  const displayCity = normalizeLocationText(city);
  const displayDistrict = normalizeLocationText(district);
  const normalizedCity = displayCity?.toLocaleLowerCase("zh-CN");
  const normalizedCountry = displayCountry?.toLocaleLowerCase("zh-CN");
  const visibleDistrict = displayDistrict &&
    displayDistrict.toLocaleLowerCase("zh-CN") !== normalizedCity &&
    displayDistrict.toLocaleLowerCase("zh-CN") !== normalizedCountry
    ? displayDistrict
    : null;
  const parts = [displayCountry, displayCity, visibleDistrict].filter(Boolean);

  return parts.join(" · ");
}

export function getLocationHierarchy(records: LocationRecord[]): LocationHierarchyCountry[] {
  const countryMap = new Map<string, { label: string; cities: Map<string, { label: string; count: number; districts: Map<string, { label: string; count: number }> }>; count: number }>();

  for (const record of records) {
    const countryValue = record.country ?? null;
    const countryIdentity = getCountryIdentity(countryValue);
    const country = countryMap.get(countryIdentity) ?? {
        label: countryValue ? getCountryLabel(countryValue) : "未标注国家",
        cities: new Map<string, { label: string; count: number; districts: Map<string, { label: string; count: number }> }>(),
      count: 0,
    };
    country.count += 1;

    const cityValue = normalizeLocationText(record.city);
    if (cityValue) {
      const cityIdentity = getCityIdentity(cityValue);
      const city = country.cities.get(cityIdentity) ?? {
        label: getCityLabel(cityValue),
        count: 0,
        districts: new Map<string, { label: string; count: number }>(),
      };
      city.count += 1;
      const districtValue = normalizeLocationText(record.district);

      if (districtValue) {
        const districtIdentity = normalizeLocationText(districtValue)?.toLocaleLowerCase("zh-CN") ?? districtValue;
        const district = city.districts.get(districtIdentity) ?? {
          label: districtValue,
          count: 0,
        };
        district.count += 1;
        city.districts.set(districtIdentity, district);
      }
      country.cities.set(cityIdentity, city);
    }

    countryMap.set(countryIdentity, country);
  }

  return [...countryMap.entries()]
    .map(([value, country]) => ({
      value,
      label: country.label,
      placeCount: country.count,
      cities: [...country.cities.entries()]
        .map(([cityValue, city]) => ({
          value: cityValue,
          label: city.label,
          placeCount: city.count,
          ...(city.districts.size > 0
            ? {
                districts: [...city.districts.entries()]
                  .map(([districtValue, district]) => ({ value: districtValue, label: district.label, placeCount: district.count }))
                  .sort((first, second) => first.label.localeCompare(second.label, "zh-CN")),
              }
            : {}),
        }))
        .sort((first, second) => first.label.localeCompare(second.label, "zh-CN")),
    }))
    .sort((first, second) => first.label.localeCompare(second.label, "zh-CN"));
}

export function getLocationCountryOptions(records: LocationRecord[]) {
  return getLocationHierarchy(records).map(({ cities: _cities, ...country }) => country);
}

export function getLocationCityOptions(records: LocationRecord[], selectedCountry: string) {
  const country = getLocationHierarchy(records).find((option) => option.value === selectedCountry);

  return country?.cities ?? [];
}

export function getLocationCityGroups(records: LocationRecord[]) {
  return getLocationHierarchy(records).filter((country) => country.cities.length > 0);
}

export function getLocationDistrictOptions(
  records: LocationRecord[],
  selectedCountry: string,
  selectedCity: string,
) {
  const city = getLocationCityOptions(records, selectedCountry).find(
    (option) => option.value === getCityIdentity(selectedCity),
  );

  return city?.districts ?? [];
}

export function filterRecordsByLocation<T extends LocationRecord>(
  records: T[],
  state: LocationHierarchyState,
) {
  const selectedCountry = state.selectedCountry ? getCountryIdentity(state.selectedCountry) : "";
  const selectedCity = state.selectedCity ? getCityIdentity(state.selectedCity) : "";
  const selectedDistrict = state.selectedDistrict ? normalizeIdentity(state.selectedDistrict) : "";

  return records.filter((record) => {
    const countryMatches =
      !selectedCountry || getCountryIdentity(record.country) === selectedCountry;
    const cityMatches =
      !selectedCity || getCityIdentity(record.city) === selectedCity;
    const districtMatches =
      !selectedDistrict || normalizeIdentity(record.district) === selectedDistrict;

    return countryMatches && cityMatches && districtMatches;
  });
}

export function serializeLocationFilterState(state: LocationHierarchyState) {
  const params = new URLSearchParams();

  if (state.selectedCountry) {
    params.set("country", state.selectedCountry);
  }

  if (state.selectedCity) {
    params.set("city", state.selectedCity);
  }

  if (state.selectedDistrict) {
    params.set("district", state.selectedDistrict);
  }

  return params.toString();
}

export function parseLocationFilterState(search: string): LocationHierarchyState {
  const params = new URLSearchParams(search.startsWith("?") ? search.slice(1) : search);
  const state: LocationHierarchyState = {
    selectedCountry: params.get("country")
      ? getCountryIdentity(params.get("country"))
      : allCountriesFilterValue,
    selectedCity: params.get("city")
      ? getCityIdentity(params.get("city"))
      : allCitiesFilterValue,
  };

  const district = params.get("district");

  return district ? { ...state, selectedDistrict: normalizeIdentity(district) } : state;
}

export function getLocationSearchTerms(record: LocationRecord) {
  const rawCountry = normalizeLocationText(record.country) ?? "";
  const rawCity = normalizeLocationText(record.city) ?? "";
  const rawDistrict = normalizeLocationText(record.district) ?? "";
  const country = normalizeCountryName(record.country) ?? rawCountry;
  const city = normalizeCityName(record.city) ?? rawCity;

  return [rawCountry, rawCity, rawDistrict, `${rawCountry} ${rawCity} ${rawDistrict}`, country, city, `${country} ${city} ${rawDistrict}`]
    .filter(Boolean)
    .map((term) => normalizeIdentity(term));
}
