import Link from "next/link";
import { AppIcon } from "@/components/app-icon";
import { AppShell } from "@/components/app-shell";
import { MapBrowser } from "@/components/map-browser";
import { requireAuthenticatedUser } from "@/lib/auth/require-user";
import { getCurrentUserRestaurantsForMap } from "@/lib/restaurants/queries";

export default async function MapPage() {
  const user = await requireAuthenticatedUser();
  const { restaurants, error } = await getCurrentUserRestaurantsForMap();

  return (
    <AppShell currentPath="/map" eyebrow="地图" title="地图" description="查看我保存地点的位置" userEmail={user.email} userId={user.userId}>
      <div className="map-page-toolbar">
        <div className="map-view-switch"><span className="is-active"><AppIcon name="map" size={14} />地图</span><Link href="/restaurants"><AppIcon name="pin" size={14} />列表</Link></div>
        <Link href="/restaurants/new" className="round-action-link" aria-label="添加地点"><AppIcon name="plus" size={18} /></Link>
      </div>
      <section className="map-screen">
        <MapBrowser places={restaurants} placeLoadError={error ? "query_failed" : null} />
      </section>
      <p className="map-page-note">地图只读取当前账号的地点。近似位置会在标记和弹窗中明确说明。</p>
    </AppShell>
  );
}
