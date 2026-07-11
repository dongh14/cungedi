import { createRestaurantAction } from "@/app/restaurants/actions";
import {
  RestaurantFormFields,
  type RestaurantFormFieldValues,
} from "@/components/restaurant-form-fields";
import { SurfaceCard } from "@/components/surface-card";
type RestaurantFormCardProps = {
  searchParams: Partial<RestaurantFormFieldValues> & {
    error?: string;
    message?: string;
  };
};

export function RestaurantFormCard({ searchParams }: RestaurantFormCardProps) {
  const values: RestaurantFormFieldValues = {
    name: searchParams.name ?? "",
    city: searchParams.city ?? "",
    source_input: searchParams.source_input ?? "",
    privacy: searchParams.privacy ?? "private",
    category: searchParams.category ?? "",
    address: searchParams.address ?? "",
    cuisine: searchParams.cuisine ?? "",
    note: searchParams.note ?? "",
  };

  return (
    <SurfaceCard className="p-5 sm:p-6">
      <div className="space-y-5">
        <div className="space-y-3">
          <span className="inline-flex rounded-full bg-[var(--accent-soft)] px-3 py-1 text-xs font-semibold tracking-[0.18em] text-[var(--accent-deep)] uppercase">
            Step 7 手动创建
          </span>
          <div>
            <h2 className="[font-family:var(--font-display)] text-2xl font-semibold tracking-[-0.03em] text-[var(--ink-strong)]">
              手动添加地点
            </h2>
            <p className="mt-2 text-sm leading-7 text-[var(--ink-soft)]">
              先把最关键的地点信息存下来。这里可以直接保存美食、购物、玩乐、景点、住宿和其他地点。当前不会做坐标、地理编码或来源内容提取，只提供最直接的手动保存入口。
            </p>
          </div>
        </div>

        {searchParams.message ? (
          <div className="rounded-[24px] border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            {searchParams.message}
          </div>
        ) : null}

        {searchParams.error ? (
          <div className="rounded-[24px] border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {searchParams.error}
          </div>
        ) : null}

        <form action={createRestaurantAction} className="space-y-5">
          <RestaurantFormFields values={values} />

          <button
            type="submit"
            className="w-full rounded-full bg-[var(--accent)] px-5 py-3.5 text-sm font-semibold text-white shadow-[0_18px_38px_rgba(255,91,0,0.28)] transition hover:bg-[var(--accent-deep)]"
          >
            保存地点
          </button>
        </form>
      </div>
    </SurfaceCard>
  );
}
