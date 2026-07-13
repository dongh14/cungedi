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
    <div className="flex min-w-0 items-center gap-3 rounded-2xl border border-[var(--border-soft)] bg-white/82 p-2 shadow-[0_8px_20px_rgba(67,31,15,0.05)]">
      <span className="rounded-xl bg-[var(--surface-muted)] px-2.5 py-2 text-xs font-semibold text-[var(--ink-strong)]">
        城市筛选
      </span>
      <label className="min-w-0 flex-1">
        <span className="sr-only">按城市筛选地图地点</span>
        <select
          value={selectedCity}
          onChange={(event) => onCityChange(event.target.value)}
          className="w-full min-w-0 rounded-xl bg-transparent px-1 py-2 text-sm font-semibold text-[var(--ink-strong)] outline-none"
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
    </div>
  );
}
