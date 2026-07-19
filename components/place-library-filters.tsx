"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { AppIcon, type AppIconName } from "@/components/app-icon";
import { BottomSheet } from "@/components/bottom-sheet";
import {
  emptyPlaceLibraryFilterState,
  getPlaceLibraryCityGroups,
  getPlaceLibraryFilterHref,
  hasPlaceLibraryFilters,
  placeLibraryCategoryOptions,
  type PlaceLibraryFilterState,
} from "@/lib/restaurants/place-library-filter";
import { getLocationDistrictOptions } from "@/lib/location-hierarchy";
import type { RestaurantListItem } from "@/lib/restaurants/types";

type PlaceLibraryFiltersProps = {
  places: RestaurantListItem[];
  value: PlaceLibraryFilterState;
};

type OpenSheet = "city" | "category" | null;

const categoryIcons: Record<string, AppIconName> = {
  美食: "food",
  景点: "attraction",
  住宿: "lodging",
  购物: "shopping",
  娱乐: "entertainment",
  其他: "other",
};

function getSelectedCityLabel(places: RestaurantListItem[], value: PlaceLibraryFilterState) {
  const groups = getPlaceLibraryCityGroups(places);
  const country = groups.find((group) => group.value === value.selectedCountry);
  const city = country?.cities.find((option) => option.value === value.selectedCity);

  if (city) {
    const district = city.districts?.find((option) => option.value === value.selectedDistrict);
    return country
      ? `${country.label} · ${city.label}${district ? ` · ${district.label}` : ""}`
      : `${city.label}${district ? ` · ${district.label}` : ""}`;
  }
  if (value.selectedCity) return value.selectedCity;
  if (value.selectedCountry) return country?.label ?? value.selectedCountry;
  return "城市";
}

export function PlaceLibraryFilters({ places, value }: PlaceLibraryFiltersProps) {
  const router = useRouter();
  const [openSheet, setOpenSheet] = useState<OpenSheet>(null);
  const [locationStep, setLocationStep] = useState<"country" | "city" | "district">("country");
  const [cityQuery, setCityQuery] = useState("");
  const [searchValue, setSearchValue] = useState(value.searchQuery);
  const cityGroups = useMemo(() => getPlaceLibraryCityGroups(places), [places]);
  const filteredCityGroups = useMemo(() => {
    const query = cityQuery.trim().toLocaleLowerCase("zh-CN");

    if (!query) return cityGroups;

    return cityGroups
      .map((group) => ({
        ...group,
        cities: group.cities.filter((city) =>
          `${group.label} ${city.label}`.toLocaleLowerCase("zh-CN").includes(query),
        ),
      }))
      .filter((group) => group.cities.length > 0);
  }, [cityGroups, cityQuery]);

  useEffect(() => {
    setSearchValue(value.searchQuery);
  }, [value.searchQuery]);

  function navigate(nextState: PlaceLibraryFilterState) {
    setOpenSheet(null);
    setCityQuery("");
    setLocationStep("country");
    router.push(getPlaceLibraryFilterHref(nextState));
  }

  function clearAll() {
    setSearchValue("");
    navigate(emptyPlaceLibraryFilterState);
  }

  function submitSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    navigate({ ...value, searchQuery: searchValue.trim() });
  }

  return (
    <section className="place-library-filters" aria-label="地点筛选">
      <form className="place-library-search" onSubmit={submitSearch}>
        <AppIcon name="search" size={19} />
        <label className="sr-only" htmlFor="place-library-search-input">搜索地点</label>
        <input
          id="place-library-search-input"
          type="search"
          value={searchValue}
          onChange={(event) => setSearchValue(event.target.value)}
          placeholder="搜索地点、城市或分类"
        />
        {searchValue ? <button type="button" onClick={() => { setSearchValue(""); navigate({ ...value, searchQuery: "" }); }} aria-label="清除搜索">×</button> : null}
      </form>

      <div className="place-library-filter-bar">
        <button type="button" className={`place-library-filter-button ${value.selectedCity || value.selectedCountry ? "is-active" : ""}`} onClick={() => setOpenSheet("city")}>
          <AppIcon name="pin" size={18} />
          <span>{getSelectedCityLabel(places, value)}</span>
          <span aria-hidden="true">⌄</span>
        </button>
        <button type="button" className={`place-library-filter-button ${value.selectedCategory ? "is-active" : ""}`} onClick={() => setOpenSheet("category")}>
          <AppIcon name="folder" size={18} />
          <span>{value.selectedCategory || "分类"}</span>
          <span aria-hidden="true">⌄</span>
        </button>
        {value.selectedCity || value.selectedCountry ? <button type="button" className="place-library-active-chip" onClick={() => navigate({ ...value, selectedCountry: "", selectedCity: "", selectedDistrict: "" })}>{getSelectedCityLabel(places, value)} ×</button> : null}
        {value.selectedCategory ? <button type="button" className="place-library-active-chip" onClick={() => navigate({ ...value, selectedCategory: "" })}>{value.selectedCategory} ×</button> : null}
        {hasPlaceLibraryFilters(value) ? <button type="button" className="place-library-clear" onClick={clearAll}>清除筛选</button> : null}
      </div>

      <BottomSheet open={openSheet === "city"} title={locationStep === "country" ? "选择国家" : locationStep === "city" ? "选择城市" : "选择区域 / 街区"} onClose={() => { setOpenSheet(null); setCityQuery(""); setLocationStep("country"); }}>
        <div className="place-library-sheet-content">
          {locationStep === "country" && cityGroups.length >= 6 ? <label className="location-filter-search"><span className="sr-only">搜索城市</span><input type="search" value={cityQuery} onChange={(event) => setCityQuery(event.target.value)} placeholder="搜索国家或城市" /></label> : null}
          {locationStep === "country" ? <button type="button" className="place-library-sheet-reset" onClick={() => navigate({ ...value, selectedCountry: "", selectedCity: "", selectedDistrict: "" })}>全部城市</button> : null}
          {locationStep === "country" ? <div className="place-library-city-groups">
            {filteredCityGroups.map((group) => (
              <div key={group.value} className="place-library-city-group">
                <div className="place-library-city-group-heading"><strong>{group.label}</strong><small>{group.placeCount} 个地点</small></div>
                <div className="place-library-city-options">
                  {group.cities.map((city) => (
                    <button key={`${group.value}-${city.value}`} type="button" className={`place-library-city-option ${value.selectedCountry === group.value && value.selectedCity === city.value ? "is-selected" : ""}`} onClick={() => {
                      const next = { ...value, selectedCountry: group.value, selectedCity: city.value, selectedDistrict: "" };
                      if (city.districts?.length) {
                        setLocationStep("district");
                      } else {
                        navigate(next);
                      }
                    }}>
                      <span>{city.label}</span><small>{city.placeCount} 个地点</small>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div> : null}
          {locationStep === "district" ? <>
            <button type="button" className="location-filter-back" onClick={() => setLocationStep("city")}>‹ 返回城市</button>
            <p className="location-filter-current">{getSelectedCityLabel(places, value)}</p>
            <div className="place-library-city-options">
              <button type="button" className="place-library-city-option" onClick={() => navigate({ ...value, selectedDistrict: "" })}>全部区域</button>
              {getLocationDistrictOptions(places, value.selectedCountry, value.selectedCity).map((district) => <button key={district.value} type="button" className={`place-library-city-option ${value.selectedDistrict === district.value ? "is-selected" : ""}`} onClick={() => navigate({ ...value, selectedDistrict: district.value })}><span>{district.label}</span><small>{district.placeCount} 个地点</small></button>)}
            </div>
          </> : null}
          {locationStep === "country" && filteredCityGroups.length === 0 ? <p className="place-library-sheet-empty">还没有可筛选的城市。</p> : null}
        </div>
      </BottomSheet>

      <BottomSheet open={openSheet === "category"} title="选择分类" onClose={() => setOpenSheet(null)}>
        <div className="place-library-category-options">
          <button type="button" className="place-library-category-option" onClick={() => navigate({ ...value, selectedCategory: "" })}><span>全部分类</span><span aria-hidden="true">›</span></button>
          {placeLibraryCategoryOptions.map((option) => (
            <button key={option.value} type="button" className={`place-library-category-option ${value.selectedCategory === option.value ? "is-selected" : ""}`} onClick={() => navigate({ ...value, selectedCategory: option.value })}>
              <span className="place-library-category-copy"><span><AppIcon name={categoryIcons[option.value]} size={19} />{option.label}</span><small>{option.description}</small></span>
              <span aria-hidden="true">›</span>
            </button>
          ))}
        </div>
      </BottomSheet>
    </section>
  );
}
