import type { ReactNode } from "react";
import { SiteBrand } from "@/components/site-brand";
import { SurfaceCard } from "@/components/surface-card";

type PublicShellProps = {
  eyebrow: string;
  title: string;
  description: string;
  children: ReactNode;
  aside?: ReactNode;
};

export function PublicShell({
  eyebrow,
  title,
  description,
  children,
  aside,
}: PublicShellProps) {
  return (
    <main className="min-h-screen px-4 py-4 sm:px-6 sm:py-6">
      <div className="mx-auto max-w-6xl">
        <header className="flex flex-col gap-3 rounded-[30px] border border-white/65 bg-white/78 px-4 py-4 shadow-[0_20px_70px_rgba(145,72,30,0.09)] backdrop-blur sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <SiteBrand />
          <div className="flex flex-wrap gap-2">
            <span className="rounded-full bg-[var(--accent-soft)] px-3 py-1 text-xs font-semibold text-[var(--accent-deep)]">
              默认中文
            </span>
            <span className="rounded-full bg-white px-3 py-1 text-xs font-medium text-[var(--ink-soft)]">
              English 稍后支持
            </span>
          </div>
        </header>

        <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1.1fr)_360px]">
          <SurfaceCard className="relative overflow-hidden p-5 sm:p-8">
            <div className="pointer-events-none absolute inset-x-0 top-0 h-36 bg-[radial-gradient(circle_at_top_left,rgba(255,91,0,0.18),transparent_60%)]" />
            <div className="relative space-y-5">
              <span className="inline-flex rounded-full bg-[var(--accent-soft)] px-3 py-1 text-xs font-semibold tracking-[0.18em] text-[var(--accent-deep)] uppercase">
                {eyebrow}
              </span>
              <div className="space-y-3">
                <h1 className="[font-family:var(--font-display)] text-4xl font-semibold tracking-[-0.05em] text-[var(--ink-strong)] text-balance sm:text-5xl">
                  {title}
                </h1>
                <p className="max-w-2xl text-base leading-8 text-[var(--ink-soft)] sm:text-lg">
                  {description}
                </p>
              </div>
              {children}
            </div>
          </SurfaceCard>

          <div className="space-y-4">{aside}</div>
        </div>
      </div>
    </main>
  );
}
