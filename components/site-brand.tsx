import Link from "next/link";
import { cn } from "@/lib/utils";

type SiteBrandProps = {
  href?: string;
  compact?: boolean;
};

export function SiteBrand({
  href = "/",
  compact = false,
}: SiteBrandProps) {
  return (
    <Link
      href={href}
      className={cn(
        "inline-flex items-center gap-3 text-left",
        compact ? "gap-2.5" : "gap-3.5",
      )}
    >
      <span
        className={cn(
          "inline-flex items-center justify-center rounded-[22px] bg-[var(--accent)] text-white shadow-[0_14px_30px_rgba(255,91,0,0.28)]",
          compact ? "h-10 w-10 text-sm font-semibold" : "h-12 w-12 text-base font-semibold",
        )}
      >
        RC
      </span>
      <span className="min-w-0">
        <span
          className={cn(
            "block truncate [font-family:var(--font-display)] font-semibold tracking-[-0.03em] text-[var(--ink-strong)]",
            compact ? "text-base" : "text-lg",
          )}
        >
          餐厅收集器
        </span>
        <span className="block truncate text-xs tracking-[0.22em] text-[var(--ink-muted)] uppercase">
          Restaurant Collector
        </span>
      </span>
    </Link>
  );
}
