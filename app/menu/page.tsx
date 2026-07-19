import Link from "next/link";
import { AppIcon } from "@/components/app-icon";
import { AppShell } from "@/components/app-shell";
import { appMenuNavigation } from "@/components/navigation";
import { requireAuthenticatedUser } from "@/lib/auth/require-user";

export default async function MenuPage() {
  const user = await requireAuthenticatedUser();

  return (
    <AppShell
      currentPath="/menu"
      eyebrow=""
      title="导航"
      description=""
      userEmail={user.email}
      userId={user.userId}
      topbarVariant="back"
      hidePageHeading
    >
      <section className="navigation-page" aria-labelledby="navigation-page-title">
        <nav className="navigation-page-list" aria-label="应用导航">
          {appMenuNavigation.map((item) => (
            <Link key={item.href} href={item.href} className="navigation-page-row">
              <span className="navigation-page-icon" aria-hidden="true">
                <AppIcon name={item.icon} size={24} />
              </span>
              <span className="navigation-page-copy">
                <strong>{item.label}</strong>
                <small>{item.description}</small>
              </span>
              <AppIcon name="chevron" size={20} className="navigation-page-chevron" />
            </Link>
          ))}
        </nav>
      </section>
    </AppShell>
  );
}
