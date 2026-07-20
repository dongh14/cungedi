import Link from "next/link";
import { AppIcon } from "@/components/app-icon";
import { AppShell } from "@/components/app-shell";
import { requireAuthenticatedUser } from "@/lib/auth/require-user";
import { listSavedSourcePosts } from "@/lib/source-posts/repository";
import type { SavedSourcePost, SourcePostPlatform, SourcePostProcessingStatus } from "@/lib/source-posts/types";

type SourcePostsPageProps = {
  searchParams?: Promise<{ message?: string; error?: string }>;
};

function platformLabel(platform: SourcePostPlatform) {
  return { xiaohongshu: "小红书", douyin: "抖音", web: "网页", unknown: "其他来源" }[platform];
}

function statusLabel(status: SourcePostProcessingStatus) {
  return { captured: "已保存", processing: "整理中", needs_review: "待整理", saved: "已关联地点", failed: "需要重试" }[status];
}

function preview(post: SavedSourcePost) {
  return post.originalText?.trim() || post.originalUrl || "没有文字内容";
}

export default async function SourcePostsPage({ searchParams }: SourcePostsPageProps) {
  const user = await requireAuthenticatedUser();
  const params = (await searchParams) ?? {};
  const result = await listSavedSourcePosts({ limit: 50 });

  return (
    <AppShell
      currentPath="/source-posts"
      eyebrow=""
      title="待整理"
      description="保存的分享内容会先放在这里，不会自动创建地点。"
      userEmail={user.email}
      userId={user.userId}
      message={params.message}
    >
      {params.error || result.error ? <div className="inline-error">{params.error ?? "暂时无法读取待整理内容，请稍后再试。"}</div> : null}
      {result.data.length === 0 && !result.error ? (
        <div className="empty-panel">
          <span className="empty-panel-icon"><AppIcon name="link" size={24} /></span>
          <h2>还没有待整理的帖子</h2>
          <p>从小红书、抖音或网页分享内容开始保存。</p>
          <Link href="/restaurants/new" className="primary-button mt-2">添加地点</Link>
        </div>
      ) : null}
      {result.data.length > 0 ? (
        <section className="source-post-list" aria-label="待整理帖子">
          {result.data.map((post) => (
            <Link key={post.id} href={`/source-posts/${post.id}`} className="source-post-row">
              <div className="source-post-row-header">
                <span className="source-post-platform">{platformLabel(post.platform)}</span>
                <span className="source-post-status">{statusLabel(post.processingStatus)}</span>
                <time className="source-post-meta" dateTime={post.createdAt}>{new Date(post.createdAt).toLocaleString("zh-CN")}</time>
              </div>
              <span className="source-post-preview">{preview(post)}</span>
              {post.resolvedUrl || post.originalUrl ? <span className="source-post-meta">{post.resolvedUrl ?? post.originalUrl}</span> : null}
            </Link>
          ))}
        </section>
      ) : null}
    </AppShell>
  );
}
