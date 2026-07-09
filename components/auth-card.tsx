import Link from "next/link";
import type { ReactNode } from "react";
import { SurfaceCard } from "@/components/surface-card";

type AuthCardProps = {
  formAction: (formData: FormData) => Promise<void>;
  title: string;
  description: string;
  submitLabel: string;
  accentLabel: string;
  alternateHref: string;
  alternateLabel: string;
  searchParams: {
    error?: string;
    message?: string;
  };
  footer?: ReactNode;
};

export function AuthCard({
  formAction,
  title,
  description,
  submitLabel,
  accentLabel,
  alternateHref,
  alternateLabel,
  searchParams,
  footer,
}: AuthCardProps) {
  return (
    <SurfaceCard className="p-5 sm:p-6">
      <div className="space-y-5">
        <div className="space-y-3">
          <span className="inline-flex rounded-full bg-[var(--accent-soft)] px-3 py-1 text-xs font-semibold tracking-[0.18em] text-[var(--accent-deep)] uppercase">
            {accentLabel}
          </span>
          <div>
            <h2 className="[font-family:var(--font-display)] text-2xl font-semibold tracking-[-0.03em] text-[var(--ink-strong)]">
              {title}
            </h2>
            <p className="mt-2 text-sm leading-7 text-[var(--ink-soft)]">
              {description}
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

        <form action={formAction} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-medium text-[var(--ink-strong)]">
              邮箱
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email"
              className="w-full rounded-[22px] border border-[var(--border-soft)] bg-[var(--surface-muted)] px-4 py-3.5 text-sm text-[var(--ink-strong)] outline-none transition focus:border-[var(--accent)] focus:ring-4 focus:ring-[var(--accent-glow)]"
              placeholder="you@example.com"
            />
          </div>

          <div className="space-y-2">
            <label
              htmlFor="password"
              className="text-sm font-medium text-[var(--ink-strong)]"
            >
              密码
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              minLength={6}
              autoComplete="current-password"
              className="w-full rounded-[22px] border border-[var(--border-soft)] bg-[var(--surface-muted)] px-4 py-3.5 text-sm text-[var(--ink-strong)] outline-none transition focus:border-[var(--accent)] focus:ring-4 focus:ring-[var(--accent-glow)]"
              placeholder="至少 6 位字符"
            />
          </div>

          <button
            type="submit"
            className="w-full rounded-full bg-[var(--accent)] px-5 py-3.5 text-sm font-semibold text-white shadow-[0_18px_38px_rgba(255,91,0,0.28)] transition hover:bg-[var(--accent-deep)]"
          >
            {submitLabel}
          </button>
        </form>

        <div className="flex flex-wrap gap-3 text-sm text-[var(--ink-soft)]">
          <Link
            href={alternateHref}
            className="font-medium text-[var(--ink-strong)] underline underline-offset-4"
          >
            {alternateLabel}
          </Link>
          <Link
            href="/"
            className="font-medium text-[var(--ink-strong)] underline underline-offset-4"
          >
            返回首页
          </Link>
        </div>

        {footer}
      </div>
    </SurfaceCard>
  );
}
