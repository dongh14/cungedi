"use client";

import { useMemo, useState } from "react";
import { AppIcon } from "@/components/app-icon";
import { BottomSheet } from "@/components/bottom-sheet";
import {
  allCitiesFilterValue,
  allCountriesFilterValue,
  getLocationCityOptions,
  getLocationDistrictOptions,
  getLocationHierarchy,
  formatHierarchyLocationLabel,
  getCountryLabel,
  unassignedCountryFilterValue,
  type LocationHierarchyState,
} from "@/lib/location-hierarchy";
import type { PlaceMarkerInput } from "@/lib/map/place-markers";

type MapLocationFilterProps = {
  places: PlaceMarkerInput[];
  value: LocationHierarchyState;
  onChange: (value: LocationHierarchyState) => void;
};

type LocationStep = "country" | "city" | "district";

function getSelectedLocationLabel(
  places: PlaceMarkerInput[],
  value: LocationHierarchyState,
) {
  const countries = getLocationHierarchy(places);
  const country = countries.find((option) => option.value === value.selectedCountry);

  if (!country) {
    return "全部地点";
  }

  if (!value.selectedCity) {
    return country.label;
  }

  const city = country.cities.find((option) => option.value === value.selectedCity);

  return city
    ? formatHierarchyLocationLabel(country.value === unassignedCountryFilterValue ? null : country.label, city.label, city.districts?.find((district) => district.value === value.selectedDistrict)?.label)
    : country.label;
}

export function MapLocationFilter({ places, value, onChange }: MapLocationFilterProps) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<LocationStep>("country");
  const [countryQuery, setCountryQuery] = useState("");
  const countries = useMemo(() => getLocationHierarchy(places), [places]);
  const countryOptions = useMemo(() => {
    const normalizedQuery = countryQuery.trim().toLocaleLowerCase("zh-CN");

    if (!normalizedQuery) {
      return countries;
    }

    return countries.filter((country) => country.label.toLocaleLowerCase("zh-CN").includes(normalizedQuery));
  }, [countries, countryQuery]);
  const cityOptions = value.selectedCountry
    ? getLocationCityOptions(places, value.selectedCountry)
    : [];
  const selectedCountry = countries.find((country) => country.value === value.selectedCountry);

  function close() {
    setOpen(false);
    setStep("country");
    setCountryQuery("");
  }

  function selectCountry(countryValue: string) {
    onChange({ selectedCountry: countryValue, selectedCity: allCitiesFilterValue, selectedDistrict: "" });
    setStep("city");
  }

  return (
    <>
      <button
        type="button"
        className="map-location-filter-trigger"
        onClick={() => setOpen(true)}
        aria-label="按国家和城市筛选地图地点"
      >
        <AppIcon name="pin" size={17} />
        <span>{getSelectedLocationLabel(places, value)}</span>
        <span aria-hidden="true">⌄</span>
      </button>

      <BottomSheet
        open={open}
        title={step === "country" ? "选择国家" : step === "city" ? "选择城市" : "选择区域 / 街区"}
        onClose={close}
      >
        {step === "country" ? (
          <div className="location-filter-sheet-content">
            {countries.length >= 8 ? (
              <label className="location-filter-search">
                <span className="sr-only">搜索国家</span>
                <input
                  type="search"
                  value={countryQuery}
                  onChange={(event) => setCountryQuery(event.target.value)}
                  placeholder="搜索国家"
                  aria-label="搜索国家"
                />
              </label>
            ) : null}
            <div className="location-filter-options">
              <button
                type="button"
                className={`location-filter-option ${!value.selectedCountry ? "is-selected" : ""}`}
                onClick={() => {
                  onChange({ selectedCountry: allCountriesFilterValue, selectedCity: allCitiesFilterValue, selectedDistrict: "" });
                  close();
                }}
              >
                <span>全部国家</span>
                <span aria-hidden="true">›</span>
              </button>
              {countryOptions.map((country) => (
                <button
                  key={country.value}
                  type="button"
                  className={`location-filter-option ${value.selectedCountry === country.value ? "is-selected" : ""}`}
                  onClick={() => selectCountry(country.value)}
                >
                  <span>
                    {country.label}
                    <small>{country.placeCount} 个地点</small>
                  </span>
                  <span aria-hidden="true">›</span>
                </button>
              ))}
            </div>
          </div>
        ) : step === "city" ? (
          <div className="location-filter-sheet-content">
            <button type="button" className="location-filter-back" onClick={() => setStep("country")}>
              ‹ 返回国家
            </button>
            <p className="location-filter-current">
              {selectedCountry?.label ?? getCountryLabel(value.selectedCountry)}
            </p>
            <div className="location-filter-options">
              <button
                type="button"
                className={`location-filter-option ${!value.selectedCity ? "is-selected" : ""}`}
                onClick={() => { onChange({ ...value, selectedCity: "", selectedDistrict: "" }); close(); }}
              >
                <span>全部城市</span>
                <span aria-hidden="true">›</span>
              </button>
              {cityOptions.map((city) => (
                <button
                  key={city.value}
                  type="button"
                  className={`location-filter-option ${value.selectedCity === city.value ? "is-selected" : ""}`}
                  onClick={() => {
                    onChange({ ...value, selectedCity: city.value, selectedDistrict: "" });
                    if (city.districts?.length) {
                      setStep("district");
                    } else {
                      close();
                    }
                  }}
                >
                  <span>
                    {formatHierarchyLocationLabel(selectedCountry?.value ?? value.selectedCountry, city.label)}
                    <small>{city.placeCount} 个地点</small>
                  </span>
                  <span aria-hidden="true">›</span>
                </button>
              ))}
            </div>
            {cityOptions.length === 0 ? (
              <div className="location-filter-empty">
                <strong>这个国家还没有城市记录</strong>
                <p>仍然可以查看该国家下已保存的地点。</p>
              </div>
            ) : null}
          </div>
        ) : (
          <div className="location-filter-sheet-content">
            <button type="button" className="location-filter-back" onClick={() => setStep("city")}>‹ 返回城市</button>
            <p className="location-filter-current">{selectedCountry?.label ?? getCountryLabel(value.selectedCountry)} · {value.selectedCity}</p>
            <div className="location-filter-options">
              <button type="button" className={`location-filter-option ${!value.selectedDistrict ? "is-selected" : ""}`} onClick={close}>
                <span>全部区域</span><span aria-hidden="true">›</span>
              </button>
              {getLocationDistrictOptions(places, value.selectedCountry, value.selectedCity).map((district) => (
                <button key={district.value} type="button" className={`location-filter-option ${value.selectedDistrict === district.value ? "is-selected" : ""}`} onClick={() => { onChange({ ...value, selectedDistrict: district.value }); close(); }}>
                  <span>{district.label}<small>{district.placeCount} 个地点</small></span><span aria-hidden="true">›</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </BottomSheet>
    </>
  );
}

export { allCountriesFilterValue, unassignedCountryFilterValue };
