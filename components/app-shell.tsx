import Link from "next/link";
import type { ReactNode } from "react";
import { logoutAction } from "@/app/auth/actions";
import { appNavigation, isActiveNavItem } from "@/components/navigation";
import { SiteBrand } from "@/components/site-brand";
import { SurfaceCard } from "@/components/surface-card";
import { cn } from "@/lib/utils";

type AppShellProps = {
  currentPath: string;
  eyebrow: string;
  title: string;
  description: string;
  userEmail: string | null;
  userId: string;
  message?: string;
  actions?: ReactNode;
  children: ReactNode;
};

export function AppShell({
  currentPath,
  eyebrow,
  title,
  description,
  userEmail,
  userId,
  message,
  actions,
  children,
}: AppShellProps) {
  return (
    <main className="min-h-screen px-4 py-4 sm:px-6 sm:py-6">
      <div className="mx-auto max-w-6xl">
        <header className="sticky top-4 z-20">
          <SurfaceCard className="border-white/70 bg-white/82 px-4 py-4 backdrop-blur sm:px-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-center justify-between gap-3">
                <SiteBrand compact />
                <span className="rounded-full bg-[var(--accent-soft)] px-3 py-1 text-xs font-semibold text-[var(--accent-deep)] lg:hidden">
                  已登录
                </span>
              </div>

              <nav className="hidden flex-1 justify-center lg:flex">
                <div className="flex flex-wrap gap-2 rounded-full bg-[var(--surface-muted)] p-1.5">
                  {appNavigation.map((item) => {
                    const active = isActiveNavItem(currentPath, item.href);

                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={cn(
                          "rounded-full px-4 py-2 text-sm font-medium transition",
                          active
                            ? "bg-[var(--accent)] text-white shadow-[0_14px_30px_rgba(255,91,0,0.25)]"
                            : "text-[var(--ink-soft)] hover:bg-white",
                        )}
                      >
                        {item.label}
                      </Link>
                    );
                  })}
                </div>
              </nav>

              <div className="flex items-center gap-3">
                <div className="hidden text-right sm:block">
                  <p className="text-sm font-medium text-[var(--ink-strong)]">
                    {userEmail ?? "已登录用户"}
                  </p>
                  <p className="max-w-[220px] truncate text-xs text-[var(--ink-muted)]">
                    {userId}
                  </p>
                </div>
                <form action={logoutAction}>
                  <button
                    type="submit"
                    className="rounded-full border border-[var(--border-soft)] px-4 py-2.5 text-sm font-medium text-[var(--ink-strong)] transition hover:border-[var(--accent)] hover:text-[var(--accent)]"
                  >
                    退出登录
                  </button>
                </form>
              </div>
            </div>
          </SurfaceCard>
        </header>

        <div className="mt-4 grid gap-4 lg:grid-cols-[280px_minmax(0,1fr)]">
          <aside className="hidden lg:block">
            <div className="space-y-4">
              <SurfaceCard className="p-5">
                <div className="space-y-4">
                  <div>
                    <p className="text-xs font-semibold tracking-[0.2em] text-[var(--accent-deep)] uppercase">
                      导航
                    </p>
                    <p className="mt-2 text-sm leading-7 text-[var(--ink-soft)]">
                      当前只搭好页面骨架，方便在后续步骤里逐个接入真实功能。
                    </p>
                  </div>
                  <div className="space-y-3">
                    {appNavigation.map((item) => {
                      const active = isActiveNavItem(currentPath, item.href);

                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          className={cn(
                            "block rounded-[24px] border px-4 py-3 transition",
                            active
                              ? "border-[var(--accent)] bg-[var(--accent-soft)]"
                              : "border-[var(--border-soft)] bg-[var(--surface-muted)] hover:border-[var(--accent)]/40",
                          )}
                        >
                          <p className="text-sm font-semibold text-[var(--ink-strong)]">
                            {item.label}
                          </p>
                          <p className="mt-1 text-xs leading-6 text-[var(--ink-soft)]">
                            {item.description}
                          </p>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              </SurfaceCard>

              <SurfaceCard className="p-5">
                <div className="space-y-3">
                  <p className="text-xs font-semibold tracking-[0.2em] text-[var(--accent-deep)] uppercase">
                    语言与样式
                  </p>
                  <p className="text-sm leading-7 text-[var(--ink-soft)]">
                    默认显示中文。English 会在后续作为次级选项加入，但现在先保持文案结构可扩展。
                  </p>
                </div>
              </SurfaceCard>
            </div>
          </aside>

          <div className="space-y-4 pb-24 lg:pb-8">
            <SurfaceCard className="relative overflow-hidden p-5 sm:p-8">
              <div className="pointer-events-none absolute inset-x-0 top-0 h-36 bg-[radial-gradient(circle_at_top_left,rgba(255,91,0,0.18),transparent_60%)]" />
              <div className="relative space-y-5">
                <div className="flex flex-wrap gap-2">
                  <span className="inline-flex rounded-full bg-[var(--accent-soft)] px-3 py-1 text-xs font-semibold tracking-[0.18em] text-[var(--accent-deep)] uppercase">
                    {eyebrow}
                  </span>
                  <span className="inline-flex rounded-full bg-white px-3 py-1 text-xs font-medium text-[var(--ink-soft)]">
                    iPhone 优先
                  </span>
                </div>
                <div className="space-y-3">
                  <h1 className="[font-family:var(--font-display)] text-3xl font-semibold tracking-[-0.05em] text-[var(--ink-strong)] text-balance sm:text-5xl">
                    {title}
                  </h1>
                  <p className="max-w-3xl text-sm leading-7 text-[var(--ink-soft)] sm:text-base sm:leading-8">
                    {description}
                  </p>
                </div>

                {message ? (
                  <div className="rounded-[24px] border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                    {message}
                  </div>
                ) : null}

                {actions ? <div className="flex flex-wrap gap-3">{actions}</div> : null}
              </div>
            </SurfaceCard>

            {children}
          </div>
        </div>
      </div>

      <nav className="fixed inset-x-4 bottom-4 z-30 rounded-[28px] border border-white/70 bg-white/92 p-2 shadow-[0_18px_45px_rgba(145,72,30,0.16)] backdrop-blur lg:hidden">
        <div className="grid grid-cols-5 gap-2">
          {appNavigation.map((item) => {
            const active = isActiveNavItem(currentPath, item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "rounded-[20px] px-2 py-3 text-center text-xs font-medium transition",
                  active
                    ? "bg-[var(--accent)] text-white shadow-[0_14px_28px_rgba(255,91,0,0.24)]"
                    : "text-[var(--ink-soft)] hover:bg-[var(--surface-muted)]",
                )}
              >
                {item.shortLabel}
              </Link>
            );
          })}
        </div>
      </nav>
    </main>
  );
}
