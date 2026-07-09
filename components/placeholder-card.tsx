import Link from "next/link";
import type { ReactNode } from "react";
import { SurfaceCard } from "@/components/surface-card";

type PlaceholderCardProps = {
  title: string;
  description: string;
  items?: string[];
  actionHref?: string;
  actionLabel?: string;
  footer?: ReactNode;
};

export function PlaceholderCard({
  title,
  description,
  items,
  actionHref,
  actionLabel,
  footer,
}: PlaceholderCardProps) {
  return (
    <SurfaceCard className="p-5 sm:p-6">
      <div className="space-y-4">
        <div className="inline-flex rounded-full bg-[var(--accent-soft)] px-3 py-1 text-xs font-semibold tracking-[0.18em] text-[var(--accent-deep)] uppercase">
          Step 6
        </div>
        <div className="space-y-2">
          <h2 className="[font-family:var(--font-display)] text-2xl font-semibold tracking-[-0.03em] text-[var(--ink-strong)]">
            {title}
          </h2>
          <p className="text-sm leading-7 text-[var(--ink-soft)]">{description}</p>
        </div>

        {items?.length ? (
          <ul className="space-y-2 text-sm leading-6 text-[var(--ink-soft)]">
            {items.map((item) => (
              <li key={item} className="flex gap-3">
                <span className="mt-2 h-2 w-2 rounded-full bg-[var(--accent)]" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        ) : null}

        {actionHref && actionLabel ? (
          <Link
            href={actionHref}
            className="inline-flex rounded-full bg-[var(--ink-strong)] px-4 py-2.5 text-sm font-medium text-white transition hover:bg-[var(--accent)]"
          >
            {actionLabel}
          </Link>
        ) : null}

        {footer}
      </div>
    </SurfaceCard>
  );
}
