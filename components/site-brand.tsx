import Link from "next/link";
import { cn } from "@/lib/utils";

type SiteBrandProps = {
  href?: string;
  compact?: boolean;
  subtitle?: string;
  className?: string;
};

export function SiteBrand({
  href = "/",
  compact = false,
  subtitle = "发现喜欢的地方，随时有个地。",
  className,
}: SiteBrandProps) {
  return (
    <Link
      href={href}
      className={cn(
        "site-brand-link",
        "inline-flex items-center gap-3 text-left",
        compact ? "gap-2.5" : "gap-3.5",
        className,
      )}
    >
      <span
        className={cn(
          "brand-mark inline-flex items-center justify-center rounded-[20px] bg-[var(--accent)] text-white shadow-[0_14px_30px_rgba(255,91,0,0.24)]",
          compact ? "h-10 w-10" : "h-12 w-12",
        )}
      >
        <span className="brand-mark-star" aria-hidden="true">✦</span>
        <span className="brand-mark-dot" aria-hidden="true" />
      </span>
      <span className="site-brand-copy min-w-0">
        <span
          className={cn(
            "site-brand-title",
            "block truncate [font-family:var(--font-display)] font-semibold tracking-[-0.03em] text-[var(--ink-strong)]",
            compact ? "text-base" : "text-lg",
          )}
        >
          存个地
        </span>
        <span className="site-brand-subtitle block truncate text-[11px] tracking-[0.08em] text-[var(--accent-deep)]">
          {subtitle}
        </span>
      </span>
    </Link>
  );
}
