"use client";

type MapCityFilterProps = {
  cities: string[];
  selectedCity: string;
  onCityChange: (city: string) => void;
};

export function MapCityFilter({
  cities,
  selectedCity,
  onCityChange,
}: MapCityFilterProps) {
  return (
    <label className="flex min-w-0 items-center gap-3 rounded-2xl border border-[var(--border-soft)] bg-white/72 px-3 py-2.5 text-sm text-[var(--ink-soft)]">
      <span className="shrink-0 font-medium text-[var(--ink-strong)]">城市</span>
      <select
        value={selectedCity}
        onChange={(event) => onCityChange(event.target.value)}
        className="min-w-0 flex-1 bg-transparent font-medium text-[var(--ink-strong)] outline-none"
        aria-label="按城市筛选地图地点"
      >
        <option value="">全部城市</option>
        {cities.map((city) => (
          <option key={city} value={city}>
            {city}
          </option>
        ))}
      </select>
    </label>
  );
}
