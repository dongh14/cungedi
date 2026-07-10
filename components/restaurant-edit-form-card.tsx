import Link from "next/link";
import { updateRestaurantAction } from "@/app/restaurants/actions";
import { SurfaceCard } from "@/components/surface-card";
import { cuisineSuggestions, privacyOptions } from "@/lib/restaurants/constants";
import type { RestaurantEditItem } from "@/lib/restaurants/types";

type RestaurantEditFormCardProps = {
  restaurant: RestaurantEditItem;
  searchParams: {
    error?: string;
    message?: string;
    cuisine?: string;
    privacy?: string;
    note?: string;
  };
};

function FieldLabel({
  htmlFor,
  label,
}: {
  htmlFor: string;
  label: string;
}) {
  return (
    <label htmlFor={htmlFor} className="text-sm font-medium text-[var(--ink-strong)]">
      {label}
    </label>
  );
}

function ReadonlyDetail({
  label,
  value,
}: {
  label: string;
  value: string | null;
}) {
  return (
    <div className="rounded-[22px] bg-[var(--surface-muted)] px-4 py-3">
      <p className="text-xs font-medium tracking-[0.08em] text-[var(--ink-muted)] uppercase">
        {label}
      </p>
      <p className="mt-2 text-sm leading-6 text-[var(--ink-strong)]">
        {value ? value : "暂未填写"}
      </p>
    </div>
  );
}

export function RestaurantEditFormCard({
  restaurant,
  searchParams,
}: RestaurantEditFormCardProps) {
  const cuisineValue =
    searchParams.cuisine !== undefined
      ? searchParams.cuisine
      : restaurant.cuisine ?? "";
  const noteValue =
    searchParams.note !== undefined ? searchParams.note : restaurant.note ?? "";
  const privacyValue =
    searchParams.privacy !== undefined
      ? searchParams.privacy
      : restaurant.privacy;

  return (
    <SurfaceCard className="p-5 sm:p-6">
      <div className="space-y-5">
        <div className="space-y-3">
          <span className="inline-flex rounded-full bg-[var(--accent-soft)] px-3 py-1 text-xs font-semibold tracking-[0.18em] text-[var(--accent-deep)] uppercase">
            Step 9 编辑记录
          </span>
          <div>
            <h2 className="[font-family:var(--font-display)] text-2xl font-semibold tracking-[-0.03em] text-[var(--ink-strong)]">
              编辑已保存的餐厅信息
            </h2>
            <p className="mt-2 text-sm leading-7 text-[var(--ink-soft)]">
              这一步先支持你修正菜系、备注和可见范围。名称、城市和来源链接会继续保留原样，不提前扩展到后续步骤。
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

        <div className="grid gap-3 sm:grid-cols-2">
          <ReadonlyDetail label="餐厅名称" value={restaurant.name} />
          <ReadonlyDetail label="城市" value={restaurant.city} />
          <ReadonlyDetail label="地址" value={restaurant.address} />
          <ReadonlyDetail label="来源链接" value={restaurant.source_url} />
        </div>

        <form action={updateRestaurantAction} className="space-y-5">
          <input type="hidden" name="restaurant_id" value={restaurant.id} />

          <div className="space-y-2">
            <FieldLabel htmlFor="cuisine" label="菜系或类型" />
            <input
              id="cuisine"
              name="cuisine"
              list="edit-cuisine-suggestions"
              defaultValue={cuisineValue}
              className="w-full rounded-[22px] border border-[var(--border-soft)] bg-[var(--surface-muted)] px-4 py-3.5 text-sm text-[var(--ink-strong)] outline-none transition focus:border-[var(--accent)] focus:ring-4 focus:ring-[var(--accent-glow)]"
              placeholder="例如：川菜、火锅、咖啡馆"
            />
            <datalist id="edit-cuisine-suggestions">
              {cuisineSuggestions.map((option) => (
                <option key={option} value={option} />
              ))}
            </datalist>
            <p className="text-xs leading-6 text-[var(--ink-muted)]">
              可以改成更准确的菜系，也可以先留空。
            </p>
          </div>

          <div className="space-y-3">
            <p className="text-sm font-medium text-[var(--ink-strong)]">
              可见范围<span className="ml-1 text-[var(--accent)]">*</span>
            </p>
            <div className="grid gap-3">
              {privacyOptions.map((option) => (
                <label
                  key={option.value}
                  className="flex cursor-pointer gap-3 rounded-[24px] border border-[var(--border-soft)] bg-[var(--surface-muted)] p-4 transition hover:border-[var(--accent)]/45"
                >
                  <input
                    type="radio"
                    name="privacy"
                    value={option.value}
                    defaultChecked={privacyValue === option.value}
                    className="mt-1 h-4 w-4 accent-[var(--accent)]"
                  />
                  <span className="min-w-0">
                    <span className="block text-sm font-semibold text-[var(--ink-strong)]">
                      {option.label}
                    </span>
                    <span className="mt-1 block text-xs leading-6 text-[var(--ink-soft)]">
                      {option.description}
                    </span>
                  </span>
                </label>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <FieldLabel htmlFor="note" label="备注" />
            <textarea
              id="note"
              name="note"
              rows={5}
              defaultValue={noteValue}
              className="w-full rounded-[22px] border border-[var(--border-soft)] bg-[var(--surface-muted)] px-4 py-3.5 text-sm text-[var(--ink-strong)] outline-none transition focus:border-[var(--accent)] focus:ring-4 focus:ring-[var(--accent-glow)]"
              placeholder="例如：这次想补充一下推荐菜、排队时间，或者适合什么时候去。"
            />
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <button
              type="submit"
              className="inline-flex justify-center rounded-full bg-[var(--accent)] px-5 py-3.5 text-sm font-semibold text-white shadow-[0_18px_38px_rgba(255,91,0,0.28)] transition hover:bg-[var(--accent-deep)]"
            >
              保存修改
            </button>
            <Link
              href="/restaurants"
              className="inline-flex justify-center rounded-full border border-[var(--border-soft)] bg-white px-5 py-3.5 text-sm font-medium text-[var(--ink-strong)] transition hover:border-[var(--accent)] hover:text-[var(--accent)]"
            >
              返回收藏列表
            </Link>
          </div>
        </form>
      </div>
    </SurfaceCard>
  );
}
