import Link from "next/link";
import type { ReactNode } from "react";
import { AuthSubmitButton } from "@/components/auth-submit-button";
import { PasswordField } from "@/components/password-field";
import { SurfaceCard } from "@/components/surface-card";

type AuthCardProps = {
  formAction: (formData: FormData) => Promise<void>;
  title: string;
  description: string;
  submitLabel: string;
  accentLabel?: string;
  alternateHref: string;
  alternateLabel: string;
  searchParams: {
    error?: string;
    message?: string;
  };
  footer?: ReactNode;
  emailPlaceholder?: string;
  passwordPlaceholder?: string;
  variant?: "login" | "signup";
};

export function AuthCard({
  formAction,
  title,
  description,
  submitLabel,
  accentLabel: _accentLabel,
  alternateHref,
  alternateLabel,
  searchParams,
  footer,
  emailPlaceholder = "you@example.com",
  passwordPlaceholder = "至少 6 位字符",
  variant = "signup",
}: AuthCardProps) {
  return (
    <SurfaceCard className={`auth-card ${variant === "login" ? "login-card" : ""}`}>
      <div className="auth-card-content">
        <div className="auth-card-heading">
          <h2 className="auth-card-title">{title}</h2>
          <p className="auth-card-description">{description}</p>
        </div>

        {searchParams.message ? (
          <div className="auth-status auth-status-success" role="status">
            {searchParams.message}
          </div>
        ) : null}

        {searchParams.error ? (
          <div className="auth-status auth-status-error" role="alert">
            {searchParams.error}
          </div>
        ) : null}

        <form action={formAction} className="auth-form">
          <div className="auth-field">
            <label htmlFor="email" className="auth-field-label">邮箱</label>
            <input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email"
              className="form-control w-full"
              inputMode="email"
              enterKeyHint="next"
              placeholder={emailPlaceholder}
            />
          </div>

          <div className="auth-field">
            <label htmlFor="password" className="auth-field-label">密码</label>
            <PasswordField
              placeholder={passwordPlaceholder}
              autoComplete={variant === "login" ? "current-password" : "new-password"}
              enterKeyHint="done"
            />
          </div>

          <AuthSubmitButton label={submitLabel} pendingLabel={variant === "login" ? "登录中…" : "注册中…"} />
        </form>

        <div className="auth-alternate">
          <Link
            href={alternateHref}
            className="auth-alternate-link"
          >
            {alternateLabel}
          </Link>
        </div>

        {footer}
      </div>
    </SurfaceCard>
  );
}
