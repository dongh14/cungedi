import Link from "next/link";
import { notFound } from "next/navigation";
import { deleteSavedSourcePostAction, updateSavedSourcePostNoteAction } from "@/app/source-posts/actions";
import { AppShell } from "@/components/app-shell";
import { requireAuthenticatedUser } from "@/lib/auth/require-user";
import { getSavedSourcePostById, listLinkedPlacesForSourcePost } from "@/lib/source-posts/repository";
import type { SourcePostPlatform, SourcePostProcessingStatus } from "@/lib/source-posts/types";

type SourcePostDetailPageProps = {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ message?: string; error?: string }>;
};

function platformLabel(platform: SourcePostPlatform) {
  return { xiaohongshu: "小红书", douyin: "抖音", web: "网页", unknown: "其他来源" }[platform];
}

function statusLabel(status: SourcePostProcessingStatus) {
  return { captured: "已保存", processing: "整理中", needs_review: "待整理", saved: "已关联地点", failed: "需要重试" }[status];
}

export default async function SourcePostDetailPage({ params, searchParams }: SourcePostDetailPageProps) {
  const user = await requireAuthenticatedUser();
  const { id } = await params;
  const query = (await searchParams) ?? {};
  const [postResult, linkedPlacesResult] = await Promise.all([
    getSavedSourcePostById(id),
    listLinkedPlacesForSourcePost(id),
  ]);

  if (!postResult.data) {
    notFound();
  }

  const post = postResult.data;

  return (
    <AppShell
      currentPath="/source-posts"
      eyebrow="待整理"
      title="帖子详情"
      description="原始分享内容会保留，之后可以再整理成地点。"
      userEmail={user.email}
      userId={user.userId}
      actions={<Link href="/source-posts" className="app-text-link">返回待整理</Link>}
      message={query.message}
    >
      <div className="source-post-detail">
        {query.error || postResult.error ? <div className="inline-error">{query.error ?? "暂时无法读取帖子详情，请稍后再试。"}</div> : null}
        <section className="form-surface p-4 sm:p-5" aria-labelledby="source-post-detail-title">
          <div className="source-post-detail-header">
            <span className="source-post-platform">{platformLabel(post.platform)}</span>
            <span className="source-post-status">{statusLabel(post.processingStatus)}</span>
          </div>
          <h2 id="source-post-detail-title" className="mt-4 text-xl font-bold">原始分享内容</h2>
          <p className="source-post-original-text mt-2">{post.originalText || "没有文字内容"}</p>
          {post.originalUrl ? <p className="source-post-meta mt-3">原始链接：{post.originalUrl}</p> : null}
          {post.resolvedUrl ? <p className="source-post-meta">解析链接：{post.resolvedUrl}</p> : null}
        </section>

        <section className="form-surface p-4 sm:p-5" aria-labelledby="source-post-note-title">
          <h2 id="source-post-note-title" className="text-lg font-bold">我的备注</h2>
          <form action={updateSavedSourcePostNoteAction} className="mt-3 grid gap-3">
            <input type="hidden" name="source_post_id" value={post.id} />
            <textarea name="user_note" defaultValue={post.userNote ?? ""} rows={4} className="form-control w-full" placeholder="记录之后想怎么整理" />
            <button type="submit" className="primary-button">保存备注</button>
          </form>
        </section>

        <section className="form-surface p-4 sm:p-5" aria-labelledby="source-post-places-title">
          <h2 id="source-post-places-title" className="text-lg font-bold">已关联地点</h2>
          {linkedPlacesResult.data.length > 0 ? (
            <div className="mt-3 grid gap-2">
              {linkedPlacesResult.data.map((place) => <Link key={place.restaurantId} href={`/restaurants/${place.restaurantId}`} className="app-text-link">{place.name} · {place.city}</Link>)}
            </div>
          ) : <p className="detail-muted mt-2">还没有关联地点。</p>}
        </section>

        <form action={deleteSavedSourcePostAction}>
          <input type="hidden" name="source_post_id" value={post.id} />
          <button type="submit" className="secondary-button w-full">删除这条帖子</button>
        </form>
      </div>
    </AppShell>
  );
}
