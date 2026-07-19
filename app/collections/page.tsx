import Link from "next/link";
import { createCollectionAction } from "@/app/restaurants/actions";
import { AppIcon } from "@/components/app-icon";
import { AppShell } from "@/components/app-shell";
import { CollectionList } from "@/components/collection-list";
import { CreateCollectionSheet } from "@/components/create-collection-sheet";
import { requireAuthenticatedUser } from "@/lib/auth/require-user";
import { getCurrentUserCollections } from "@/lib/restaurants/queries";

type CollectionsPageProps = {
  searchParams?: Promise<{ error?: string; message?: string }>;
};

export default async function CollectionsPage({ searchParams }: CollectionsPageProps) {
  const user = await requireAuthenticatedUser();
  const params = (await searchParams) ?? {};
  const { collections, error } = await getCurrentUserCollections();

  return (
    <AppShell
      currentPath="/collections"
      eyebrow="我的"
      title="收藏集"
      description="把已经保存的地点按旅行、口味或心情放在一起。"
      userEmail={user.email}
      userId={user.userId}
      message={params.message}
    >
      <section className="page-intro-row">
        <div><h2>我的收藏集</h2><p>只属于你的地点整理方式</p></div>
        <span className="page-count">{collections.length} 个</span>
      </section>

      {params.error ? <div className="inline-error">{params.error}</div> : null}
      {error ? <div className="inline-error">暂时无法读取收藏集，请稍后再试。</div> : null}

      {!error && collections.length > 0 ? <CollectionList collections={collections} /> : null}
      {!error && collections.length === 0 ? (
        <div className="empty-panel">
          <span className="empty-panel-icon"><AppIcon name="folder" size={24} /></span>
          <h2>还没有收藏集</h2>
          <p>先创建一个主题，再把保存的地点放进去。</p>
        </div>
      ) : null}

      <section id="create" className="create-collection-panel">
        <div><span className="create-collection-icon"><AppIcon name="plus" size={19} /></span><div><h2>整理一个主题</h2><p>收藏集只属于你。</p></div></div>
        <CreateCollectionSheet action={createCollectionAction} />
      </section>

      <Link href="/restaurants" className="quiet-page-link">去看看全部地点 <span aria-hidden="true">→</span></Link>
    </AppShell>
  );
}
