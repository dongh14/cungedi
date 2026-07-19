import Link from "next/link";
import type { ReactNode } from "react";
import { AppIcon } from "@/components/app-icon";
import { AppNavigationMenu } from "@/components/app-navigation-menu";
import { MenuBackButton } from "@/components/menu-back-button";
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
  topbarActions?: ReactNode;
  hidePageHeading?: boolean;
  topbarVariant?: "default" | "back";
  children: ReactNode;
};

export function AppShell({
  currentPath,
  eyebrow,
  title,
  description,
  userEmail: _userEmail,
  userId: _userId,
  message,
  actions,
  topbarActions,
  hidePageHeading = false,
  topbarVariant = "default",
  children,
}: AppShellProps) {
  return (
    <main className="app-shell">
      <div className="app-canvas">
        <header className={cn("app-topbar", topbarVariant === "back" && "app-topbar-back")}>
          <div className="app-topbar-leading">
            {topbarVariant === "back" ? <MenuBackButton /> : <AppNavigationMenu />}
          </div>
          <div className="app-topbar-center">
            {eyebrow ? <span className="app-topbar-eyebrow">{eyebrow}</span> : null}
            {currentPath !== "/dashboard" ? <span className="app-topbar-title">{title}</span> : null}
          </div>
          <div className="app-topbar-actions">
            {topbarActions ?? (
              <Link href="/restaurants/new" className="app-topbar-add" aria-label="添加地点">
                <AppIcon name="plus" size={23} strokeWidth={2.2} />
              </Link>
            )}
          </div>
        </header>

        <div className={cn(
          "app-page",
          currentPath === "/dashboard" && "app-page-home",
          currentPath === "/restaurants" && "app-page-library",
        )}>
          {currentPath !== "/dashboard" && !hidePageHeading ? (
            <div className="app-page-heading">
              <div>
                {eyebrow ? <p className="app-page-eyebrow">{eyebrow}</p> : null}
                <h1>{title}</h1>
                {description ? <p className="app-page-description">{description}</p> : null}
              </div>
              {actions ? <div className="app-page-actions">{actions}</div> : null}
            </div>
          ) : null}

          {message ? <div className="app-message">{message}</div> : null}
          {children}
        </div>
      </div>

    </main>
  );
}
