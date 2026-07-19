import Link from "next/link";
import { AppIcon } from "@/components/app-icon";
import { AppShell } from "@/components/app-shell";
import { DashboardLocationMapSection } from "@/components/dashboard-location-map-section";
import { LoginSuccessToast } from "@/components/login-success-toast";
import { requireAuthenticatedUser } from "@/lib/auth/require-user";
import {
  getHomepageCategoryHref,
  homepageCategoryIcons,
  homepageCategories,
  homepageQuickLinks,
} from "@/lib/restaurants/home-discovery";
import { getCurrentUserRestaurantsForMap } from "@/lib/restaurants/queries";

type DashboardPageProps = {
  searchParams?: Promise<{ login_success?: string }>;
};

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const params = (await searchParams) ?? {};
  const user = await requireAuthenticatedUser();
  const { restaurants, error } = await getCurrentUserRestaurantsForMap();
  const mapPlaces = restaurants.map((place) => ({
    id: place.id,
    name: place.name,
    city: place.city,
    country: place.country,
    district: place.district,
    category: place.category,
    address: place.address,
    cuisine: place.cuisine,
    note: place.note,
    latitude: place.latitude,
    longitude: place.longitude,
  }));

  return (
    <AppShell
      currentPath="/dashboard"
      eyebrow=""
      title="首页"
      description=""
      userEmail={user.email}
      userId={user.userId}
    >
      <LoginSuccessToast show={params.login_success === "1"} />
      <div className="dashboard-home">
        <header className="dashboard-page-heading">
          <h1>首页</h1>
        </header>
        <DashboardLocationMapSection places={mapPlaces} placeLoadError={Boolean(error)} />

        <section className="app-section dashboard-section" aria-labelledby="category-title">
          <div className="app-section-header">
            <div><h2 id="category-title">按类型寻找</h2></div>
          </div>
          <div className="category-grid">
            {homepageCategories.map((category) => (
              <Link key={category} href={getHomepageCategoryHref(category)} className="category-tile">
                <span className="category-tile-icon"><AppIcon name={homepageCategoryIcons[category]} size={28} strokeWidth={2} /></span>
                <span className="category-tile-label">{category}</span>
              </Link>
            ))}
          </div>
        </section>

        <section className="dashboard-quick-links" aria-label="快速进入">
          {homepageQuickLinks.map((item) => (
            <Link key={item.href} href={item.href} className="dashboard-quick-link">
              <span className="dashboard-quick-link-icon"><AppIcon name={item.icon} size={24} /></span>
              <span className="dashboard-quick-link-copy">
                <strong>{item.label}</strong>
                <small>{item.description}</small>
              </span>
            </Link>
          ))}
        </section>

      </div>
    </AppShell>
  );
}
