"use client";

import { useMemo, useState } from "react";
import { AppIcon } from "@/components/app-icon";
import { BottomSheet } from "@/components/bottom-sheet";
import { DashboardMapPreview } from "@/components/dashboard-map-preview";
import {
  allCitiesFilterValue,
  allCountriesFilterValue,
  getCityIdentity,
  getLocationCityGroups,
  getLocationCityOptions,
  getLocationHierarchy,
  type LocationHierarchyState,
} from "@/lib/location-hierarchy";
import { filterPlacesForMap } from "@/lib/map/place-filter";
import type { PlaceMarkerInput } from "@/lib/map/place-markers";

type DashboardLocationMapSectionProps = {
  places: PlaceMarkerInput[];
  placeLoadError?: boolean;
};

type OpenSheet = "country" | "city" | null;

const emptyLocationFilter: LocationHierarchyState = {
  selectedCountry: allCountriesFilterValue,
  selectedCity: allCitiesFilterValue,
  selectedDistrict: "",
};

function getSelectedCountryLabel(places: PlaceMarkerInput[], value: string) {
  return getLocationHierarchy(places).find((country) => country.value === value)?.label ?? "全部国家/地区";
}

function getSelectedCityLabel(places: PlaceMarkerInput[], value: string) {
  if (!value) {
    return "全部城市";
  }

  return getLocationCityGroups(places)
    .flatMap((country) => country.cities)
    .find((city) => city.value === value)?.label ?? value;
}

export function DashboardLocationMapSection({ places, placeLoadError = false }: DashboardLocationMapSectionProps) {
  const [locationFilter, setLocationFilter] = useState<LocationHierarchyState>(emptyLocationFilter);
  const [openSheet, setOpenSheet] = useState<OpenSheet>(null);

  const countries = useMemo(() => getLocationHierarchy(places), [places]);
  const cityGroups = useMemo(() => getLocationCityGroups(places), [places]);
  const cityOptions = locationFilter.selectedCountry
    ? getLocationCityOptions(places, locationFilter.selectedCountry)
    : [];
  const filteredPlaces = useMemo(
    () =>
      filterPlacesForMap({
        places,
        searchQuery: "",
        selectedCountry: locationFilter.selectedCountry,
        selectedCity: locationFilter.selectedCity,
      }),
    [locationFilter.selectedCity, locationFilter.selectedCountry, places],
  );
  const hasActiveFilter = Boolean(locationFilter.selectedCountry || locationFilter.selectedCity);

  function selectCountry(countryValue: string) {
    const nextCityOptions = countryValue ? getLocationCityOptions(places, countryValue) : [];
    const cityStillExists = countryValue
      ? nextCityOptions.some((city) => city.value === locationFilter.selectedCity)
      : getLocationCityGroups(places).some((country) =>
          country.cities.some((city) => city.value === locationFilter.selectedCity),
        );

    setLocationFilter({
      selectedCountry: countryValue,
      selectedCity: cityStillExists ? locationFilter.selectedCity : allCitiesFilterValue,
      selectedDistrict: "",
    });
    setOpenSheet(null);
  }

  function selectCity(cityValue: string) {
    setLocationFilter((current) => ({ ...current, selectedCity: cityValue, selectedDistrict: "" }));
    setOpenSheet(null);
  }

  function clearFilter() {
    setLocationFilter(emptyLocationFilter);
  }

  return (
    <div className="dashboard-location-map-section">
      <div className="dashboard-location-filter" aria-label="地图位置筛选">
        <button
          type="button"
          className={`dashboard-location-filter-button ${locationFilter.selectedCountry ? "is-active" : ""}`}
          onClick={() => setOpenSheet("country")}
          aria-label="选择国家或地区"
        >
          <AppIcon name="map" size={17} />
          <span>{getSelectedCountryLabel(places, locationFilter.selectedCountry)}</span>
          <span aria-hidden="true">⌄</span>
        </button>
        <button
          type="button"
          className={`dashboard-location-filter-button ${locationFilter.selectedCity ? "is-active" : ""}`}
          onClick={() => setOpenSheet("city")}
          aria-label="选择城市"
        >
          <AppIcon name="pin" size={17} />
          <span>{getSelectedCityLabel(places, locationFilter.selectedCity)}</span>
          <span aria-hidden="true">⌄</span>
        </button>
      </div>

      <DashboardMapPreview
        places={filteredPlaces}
        placeLoadError={placeLoadError}
        hasActiveFilter={hasActiveFilter}
        onClearFilter={clearFilter}
      />

      <BottomSheet
        open={openSheet === "country"}
        title="选择国家/地区"
        onClose={() => setOpenSheet(null)}
      >
        <div className="location-filter-sheet-content">
          <div className="location-filter-options">
            <button
              type="button"
              className={`location-filter-option ${!locationFilter.selectedCountry ? "is-selected" : ""}`}
              onClick={() => selectCountry(allCountriesFilterValue)}
            >
              <span>全部国家/地区</span>
              <span aria-hidden="true">›</span>
            </button>
            {countries.map((country) => (
              <button
                key={country.value}
                type="button"
                className={`location-filter-option ${locationFilter.selectedCountry === country.value ? "is-selected" : ""}`}
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
      </BottomSheet>

      <BottomSheet
        open={openSheet === "city"}
        title="选择城市"
        onClose={() => setOpenSheet(null)}
      >
        <div className="location-filter-sheet-content">
          <div className="location-filter-options">
            <button
              type="button"
              className={`location-filter-option ${!locationFilter.selectedCity ? "is-selected" : ""}`}
              onClick={() => selectCity(allCitiesFilterValue)}
            >
              <span>全部城市</span>
              <span aria-hidden="true">›</span>
            </button>
            {locationFilter.selectedCountry
              ? cityOptions.map((city) => (
                  <button
                    key={city.value}
                    type="button"
                    className={`location-filter-option ${locationFilter.selectedCity === city.value ? "is-selected" : ""}`}
                    onClick={() => selectCity(city.value)}
                  >
                    <span>
                      {city.label}
                      <small>{city.placeCount} 个地点</small>
                    </span>
                    <span aria-hidden="true">›</span>
                  </button>
                ))
              : cityGroups.map((country) => (
                  <div key={country.value} className="dashboard-city-group">
                    <p>{country.label}</p>
                    {country.cities.map((city) => (
                      <button
                        key={`${country.value}-${city.value}`}
                        type="button"
                        className={`location-filter-option ${locationFilter.selectedCity === getCityIdentity(city.value) ? "is-selected" : ""}`}
                        onClick={() => selectCity(city.value)}
                      >
                        <span>
                          {city.label}
                          <small>{city.placeCount} 个地点</small>
                        </span>
                        <span aria-hidden="true">›</span>
                      </button>
                    ))}
                  </div>
                ))}
          </div>
          {!locationFilter.selectedCountry && cityGroups.length === 0 ? (
            <div className="location-filter-empty">
              <strong>还没有城市记录</strong>
            </div>
          ) : null}
        </div>
      </BottomSheet>
    </div>
  );
}

export { emptyLocationFilter };
