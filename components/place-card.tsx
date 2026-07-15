import Link from "next/link";
import type { PlaceCardInput } from "@/lib/restaurants/place-card";
import { getPlaceCardDisplayData } from "@/lib/restaurants/place-card";

export function PlaceCard({ place }: { place: PlaceCardInput }) {
  const card = getPlaceCardDisplayData(place);

  return (
    <article className="overflow-hidden rounded-[28px] border border-[var(--border-soft)] bg-[var(--surface-muted)] shadow-[0_18px_50px_rgba(145,72,30,0.08)] transition hover:-translate-y-0.5 hover:border-[var(--accent)]/45">
      <Link href={card.detailHref} className="group block focus:outline-none focus-visible:ring-4 focus-visible:ring-[var(--accent-glow)]">
        <div className="aspect-[16/10] overflow-hidden bg-[linear-gradient(135deg,rgba(255,91,0,0.18),rgba(255,238,219,0.95))]">
          {card.hasImage ? (
            <img
              src={card.imageUrl ?? undefined}
              alt={card.name}
              className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full flex-col justify-between p-5 text-[var(--accent-deep)]">
              <span className="text-xs font-semibold tracking-[0.18em] uppercase">Place Collector</span>
              <span className="max-w-[12rem] [font-family:var(--font-display)] text-2xl font-semibold tracking-[-0.04em]">
                还没有图片
              </span>
            </div>
          )}
        </div>

        <div className="space-y-3 p-5">
          <div>
            <h3 className="truncate text-lg font-semibold tracking-[-0.03em] text-[var(--ink-strong)]">
              {card.name}
            </h3>
            <p className="mt-1 text-sm text-[var(--ink-soft)]">
              {card.city} · {card.category}
            </p>
          </div>

          {card.collectionBadges.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {card.collectionBadges.map((collection) => (
                <span
                  key={collection.id}
                  className="rounded-full bg-[var(--accent-soft)] px-3 py-1 text-xs font-medium text-[var(--accent-deep)]"
                >
                  {collection.name}
                </span>
              ))}
            </div>
          ) : null}

          <div className="flex items-center justify-between gap-3 text-xs text-[var(--ink-muted)]">
            <span>来源：{card.sourceHost}</span>
            <span className="font-medium text-[var(--accent-deep)]">查看详情 →</span>
          </div>
        </div>
      </Link>
    </article>
  );
}
