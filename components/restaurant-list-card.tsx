import type { RestaurantListItem } from "@/lib/restaurants/types";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { getPlaceCategoryLabel } from "@/lib/restaurants/constants";

type RestaurantListCardProps = {
  restaurant: RestaurantListItem;
  isNewlyCreated?: boolean;
};

function formatSavedDate(value: string) {
  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(value));
}

function getSourceHostLabel(value: string) {
  try {
    return new URL(value).hostname.replace(/^www\./, "");
  } catch {
    return "原始来源";
  }
}

function DetailItem({
  label,
  value,
}: {
  label: string;
  value: string | null;
}) {
  return (
    <div className="rounded-[22px] bg-white/75 px-4 py-3">
      <p className="text-xs font-medium tracking-[0.08em] text-[var(--ink-muted)] uppercase">
        {label}
      </p>
      <p className="mt-2 text-sm leading-6 text-[var(--ink-strong)]">
        {value ? value : "暂未填写"}
      </p>
    </div>
  );
}

export function RestaurantListCard({
  restaurant,
  isNewlyCreated = false,
}: RestaurantListCardProps) {
  return (
    <article
      className={cn(
        "rounded-[28px] border p-5 shadow-[0_18px_50px_rgba(145,72,30,0.08)] transition sm:p-6",
        isNewlyCreated
          ? "border-[var(--accent)] bg-[linear-gradient(180deg,rgba(255,91,0,0.12),rgba(255,255,255,0.95))]"
          : "border-[var(--border-soft)] bg-[var(--surface-muted)]",
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-lg font-semibold tracking-[-0.03em] text-[var(--ink-strong)]">
              <Link
                href={`/restaurants/${restaurant.id}`}
                className="rounded-md underline-offset-4 hover:underline focus:outline-none focus-visible:ring-4 focus-visible:ring-[var(--accent-glow)]"
              >
                {restaurant.name}
              </Link>
            </h3>
            {isNewlyCreated ? (
              <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-[var(--accent-deep)]">
                刚刚保存
              </span>
            ) : null}
          </div>
          <p className="mt-2 text-sm leading-7 text-[var(--ink-soft)]">
            {restaurant.city}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-white px-3 py-1 text-xs font-medium text-[var(--ink-soft)]">
            分类：{getPlaceCategoryLabel(restaurant.category)}
          </span>
          <span className="rounded-full bg-white px-3 py-1 text-xs font-medium text-[var(--ink-soft)]">
            保存于 {formatSavedDate(restaurant.created_at)}
          </span>
        </div>
      </div>

      <div className="mt-4 grid gap-3 lg:grid-cols-3">
        <DetailItem label="分类" value={getPlaceCategoryLabel(restaurant.category)} />
        <DetailItem label="子分类" value={restaurant.cuisine} />
        <DetailItem label="地址" value={restaurant.address} />
      </div>

      <div className="mt-3 rounded-[22px] bg-white/75 px-4 py-3">
        <p className="text-xs font-medium tracking-[0.08em] text-[var(--ink-muted)] uppercase">
          备注
        </p>
        <p className="mt-2 text-sm leading-7 text-[var(--ink-strong)]">
          {restaurant.note ? restaurant.note : "暂未填写"}
        </p>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <span className="rounded-full bg-[var(--surface)] px-3 py-1 text-xs font-medium text-[var(--ink-soft)]">
          来源：{getSourceHostLabel(restaurant.source_url)}
        </span>
        <a
          href={restaurant.source_url}
          target="_blank"
          rel="noreferrer"
          className="inline-flex rounded-full bg-[var(--ink-strong)] px-4 py-2.5 text-sm font-medium text-white transition hover:bg-[var(--accent)]"
        >
          打开来源链接
        </a>
        <Link
          href={`/restaurants/${restaurant.id}/edit`}
          className="inline-flex rounded-full border border-[var(--border-soft)] bg-white px-4 py-2.5 text-sm font-medium text-[var(--ink-strong)] transition hover:border-[var(--accent)] hover:text-[var(--accent)]"
        >
          编辑地点
        </Link>
      </div>
    </article>
  );
}
