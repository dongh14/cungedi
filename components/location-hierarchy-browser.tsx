import Link from "next/link";
import {
  allCitiesFilterValue,
  allCountriesFilterValue,
  formatHierarchyLocationLabel,
  getLocationHierarchy,
  type LocationHierarchyState,
} from "@/lib/location-hierarchy";
import type { RestaurantListItem } from "@/lib/restaurants/types";

type LocationHierarchyBrowserProps = {
  restaurants: RestaurantListItem[];
  selected: LocationHierarchyState;
  category?: string;
};

function createFilterHref(input: {
  category?: string;
  country?: string;
  city?: string;
}) {
  const params = new URLSearchParams();

  if (input.category) params.set("category", input.category);
  if (input.country) params.set("country", input.country);
  if (input.city) params.set("city", input.city);

  const query = params.toString();
  return `/restaurants${query ? `?${query}` : ""}`;
}

export function LocationHierarchyBrowser({
  restaurants,
  selected,
  category,
}: LocationHierarchyBrowserProps) {
  const hierarchy = getLocationHierarchy(restaurants);
  const selectedCountry = hierarchy.find((country) => country.value === selected.selectedCountry);

  return (
    <section className="location-hierarchy-browser" aria-labelledby="location-filter-title">
      <div className="location-hierarchy-heading">
        <div>
          <h2 id="location-filter-title">按位置浏览</h2>
          <p>先选国家，再查看其中的城市和地点。</p>
        </div>
        {selected.selectedCountry || selected.selectedCity ? (
          <Link href={createFilterHref({ category })} className="quiet-page-link">清除位置</Link>
        ) : null}
      </div>

      <div className="location-hierarchy-countries">
        <Link
          href={createFilterHref({ category })}
          className={`location-hierarchy-country ${!selected.selectedCountry ? "is-selected" : ""}`}
        >
          <span>全部国家</span>
          <small>{restaurants.length} 个地点</small>
        </Link>
        {hierarchy.map((country) => (
          <Link
            key={country.value}
            href={createFilterHref({ category, country: country.value })}
            className={`location-hierarchy-country ${selected.selectedCountry === country.value ? "is-selected" : ""}`}
          >
            <span>{country.label}</span>
            <small>{country.placeCount} 个地点</small>
          </Link>
        ))}
      </div>

      {selectedCountry ? (
        <div className="location-hierarchy-cities">
          <div className="location-hierarchy-subheading">
            <strong>{selectedCountry.label}</strong>
            <span>城市</span>
          </div>
          <div className="location-hierarchy-city-links">
            <Link
              href={createFilterHref({ category, country: selectedCountry.value })}
              className={!selected.selectedCity ? "is-selected" : ""}
            >
              全部城市 <small>{selectedCountry.placeCount}</small>
            </Link>
            {selectedCountry.cities.map((city) => (
              <Link
                key={city.value}
                href={createFilterHref({ category, country: selectedCountry.value, city: city.value })}
                className={selected.selectedCity === city.value ? "is-selected" : ""}
              >
                <span>{formatHierarchyLocationLabel(selectedCountry.value, city.label)}</span>
                <small>{city.placeCount}</small>
              </Link>
            ))}
          </div>
          {selectedCountry.cities.length === 0 ? (
            <p className="location-hierarchy-empty">这个国家还没有城市记录，仍会显示该国家的地点。</p>
          ) : null}
        </div>
      ) : null}

      {selected.selectedCountry === "__unassigned_country__" && selected.selectedCity === allCitiesFilterValue ? (
        <p className="location-hierarchy-empty">这些地点还没有保存国家信息，原有城市值保持不变。</p>
      ) : null}
    </section>
  );
}

export { allCountriesFilterValue };
