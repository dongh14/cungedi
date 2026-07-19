import Link from "next/link";
import { AppIcon } from "@/components/app-icon";

export function AppNavigationMenu() {
  return (
    <Link href="/menu" className="app-brand-trigger" aria-label="打开存个地导航">
        <span className="app-brand-mark" aria-hidden="true">
          <span className="brand-mark-star">✦</span>
          <span className="brand-mark-dot" />
        </span>
        <span className="app-brand-name">存个地</span>
        <AppIcon name="chevron" size={17} strokeWidth={2.2} />
    </Link>
  );
}
