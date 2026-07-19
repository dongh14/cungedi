import Link from "next/link";
import { AppIcon } from "@/components/app-icon";
import type { PlaceCardInput } from "@/lib/restaurants/place-card";
import { getPlaceCardDisplayData } from "@/lib/restaurants/place-card";

export function PlaceCard({ place, compact = false }: { place: PlaceCardInput; compact?: boolean }) {
  const card = getPlaceCardDisplayData(place);

  return (
    <article className={`place-card${compact ? " place-card-compact" : ""}`}>
      <Link href={card.detailHref} className="group block focus:outline-none focus-visible:ring-4 focus-visible:ring-[var(--accent-glow)]">
        <div className="place-card-media">
          {card.hasImage ? (
            <img
              src={card.imageUrl ?? undefined}
              alt={card.name}
              className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="place-card-placeholder">
              <span className="brand-mark-star" aria-hidden="true">✦</span>
              <span>暂无图片</span>
            </div>
          )}
          {card.collectionBadges.length > 0 ? (
            <span className="place-card-bookmark" aria-label="已加入合集">
              <AppIcon name="folder" size={14} />
            </span>
          ) : null}
        </div>

        <div className="place-card-body">
          <div className="min-w-0">
            <h3 className="place-name-title place-card-title">
              {card.name}
            </h3>
            <p className="place-card-metadata place-card-location mt-1 truncate">
              {card.category}{card.locationLabel ? ` · ${card.locationLabel}` : ""}
            </p>
          </div>

          {!compact && card.collectionBadges.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {card.collectionBadges.map((collection) => (
                <span
                  key={collection.id}
                  className="rounded-full bg-[var(--accent-soft)] px-2 py-1 text-[10px] font-bold text-[var(--accent-deep)]"
                >
                  {collection.name}
                </span>
              ))}
            </div>
          ) : null}

          {!compact ? <div className="place-card-source flex items-center justify-between gap-3 text-xs text-[var(--ink-muted)]">
            <span className="truncate">{card.sourceHost}</span>
            <AppIcon name="chevron" size={14} className="shrink-0" />
          </div> : null}
        </div>
      </Link>
    </article>
  );
}
