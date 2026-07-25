import Link from "next/link";
import { notFound } from "next/navigation";
import {
  deleteSavedSourcePostAction,
  extractSavedSourcePostPlacesAction,
  ignoreSourcePostCandidateAction,
  linkSavedSourcePostToPlaceAction,
  organizeSavedSourcePostAction,
  unlinkSavedSourcePostFromPlaceAction,
  updateSavedSourcePostNoteAction,
} from "@/app/source-posts/actions";
import { AppShell } from "@/components/app-shell";
import { SourcePostCandidateSelector } from "@/components/source-post-candidate-selector";
import { SourcePostExtractionButton } from "@/components/source-post-extraction-button";
import { requireAuthenticatedUser } from "@/lib/auth/require-user";
import { getCurrentUserRestaurants } from "@/lib/restaurants/queries";
import { getValidatedSourcePostCandidates } from "@/lib/source-posts/extraction-schema";
import { getSavedSourcePostById, listLinkedPlacesForSourcePost } from "@/lib/source-posts/repository";
import type { SourcePostPlaceCandidate } from "@/lib/source-posts/extraction-types";
import type { SourcePostPlatform, SourcePostProcessingStatus } from "@/lib/source-posts/types";

type SourcePostDetailPageProps = {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ message?: string; error?: string; saved?: string; created_place?: string; extraction?: string }>;
};

function platformLabel(platform: SourcePostPlatform) {
  return { xiaohongshu: "小红书", douyin: "抖音", web: "网页", unknown: "其他来源" }[platform];
}

function statusLabel(status: SourcePostProcessingStatus) {
  return { captured: "已保存", processing: "整理中", needs_review: "待整理", saved: "已关联地点", failed: "需要重试" }[status];
}

function confidenceLabel(confidence: SourcePostPlaceCandidate["confidence"]) {
  return { high: "高可信", medium: "中等可信", low: "低可信" }[confidence];
}

function candidateReviewHref(postId: string, candidate: SourcePostPlaceCandidate) {
  const params = new URLSearchParams({
    source_post_id: postId,
    candidate_id: candidate.id,
  });
  const fields: Array<[string, string | null]> = [
    ["name", candidate.name],
    ["country", candidate.country],
    ["city", candidate.city],
    ["district", candidate.district],
    ["address", candidate.address],
    ["category", candidate.category],
    ["cuisine", candidate.subcategory],
    ["note", candidate.note],
  ];

  for (const [key, value] of fields) {
    if (value) {
      params.set(key, value);
    }
  }

  return `/restaurants/review?${params.toString()}`;
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
  const candidates = getValidatedSourcePostCandidates(post.detectedCandidates);
  const extractionMessage = query.extraction === "success" || query.extraction === "partial"
    ? "已识别候选地点，请确认后再保存。"
    : query.extraction === "insufficient_evidence"
      ? "暂时无法确定具体地点，可手动整理。"
      : query.extraction === "unavailable"
        ? "AI 识别暂未配置。"
        : query.extraction === "already_running"
          ? "正在识别，请稍候。"
          : query.extraction === "failed"
            ? "识别失败，请稍后重试。"
            : undefined;

  return (
    <AppShell
      currentPath="/source-posts"
      eyebrow="待整理"
      title="帖子详情"
      description="原始分享内容会保留，之后可以再整理成地点。"
      userEmail={user.email}
      userId={user.userId}
      actions={<Link href="/source-posts" className="app-text-link">返回待整理</Link>}
      message={query.saved === "1" ? "帖子已保存到待整理" : query.message ?? extractionMessage}
    >
      <div className="source-post-detail">
        {query.error || postResult.error || linkedPlacesResult.error ? <div className="inline-error">{query.error ?? "暂时无法读取帖子详情，请稍后再试。"}</div> : null}
        {query.created_place ? <p className="detail-muted">地点已创建，如未显示关联关系，请使用下方选项重试关联。</p> : null}
        <section className="form-surface p-4 sm:p-5" aria-labelledby="source-post-actions-title">
          <h2 id="source-post-actions-title" className="text-lg font-bold">整理这条帖子</h2>
          <p className="detail-muted mt-2">确认后会进入可编辑的地点表单，不会自动保存地点。</p>
          <form action={organizeSavedSourcePostAction} className="mt-3">
            <input type="hidden" name="source_post_id" value={post.id} />
            <button type="submit" className="primary-button w-full">整理为地点</button>
          </form>
        </section>

        <section className="form-surface p-4 sm:p-5" aria-labelledby="source-post-extraction-title">
          <h2 id="source-post-extraction-title" className="text-lg font-bold">识别候选地点</h2>
          <p className="detail-muted mt-2">只使用这条帖子中已有的文字和链接，不会自动创建地点。</p>
          <form action={extractSavedSourcePostPlacesAction} className="mt-3">
            <input type="hidden" name="source_post_id" value={post.id} />
            <SourcePostExtractionButton disabled={post.processingStatus === "processing"} />
          </form>
          {candidates.length > 0 ? (
            <div className="mt-4 grid gap-4" aria-label="识别出的候选地点">
              <SourcePostCandidateSelector candidates={candidates.map((candidate) => ({
                id: candidate.id,
                name: candidate.name ?? "",
                reviewHref: candidateReviewHref(post.id, candidate),
              }))} />
              {candidates.map((candidate) => (
                <article key={candidate.id} className="rounded-3xl border border-[var(--border-soft)] bg-[var(--surface-muted)] p-4">
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="text-lg font-bold">{candidate.name ?? "未确定名称"}</h3>
                    <span className="source-post-status">{confidenceLabel(candidate.confidence)}</span>
                  </div>
                  <p className="detail-muted mt-2">
                    {[candidate.country, candidate.city, candidate.district].filter(Boolean).join(" · ") || "地点位置未确定"}
                  </p>
                  {candidate.category || candidate.subcategory ? (
                    <p className="detail-muted mt-1">{[candidate.category, candidate.subcategory].filter(Boolean).join(" · ")}</p>
                  ) : null}
                  {candidate.note ? <p className="mt-3 text-sm leading-6 text-[var(--ink-soft)]">{candidate.note}</p> : null}
                  <div className="mt-3 grid gap-2">
                    <p className="text-sm font-semibold text-[var(--ink-strong)]">证据</p>
                    {candidate.evidence.map((evidence) => <p key={evidence} className="text-sm leading-6 text-[var(--ink-soft)]">“{evidence}”</p>)}
                  </div>
                  {candidate.warnings.length > 0 ? (
                    <p className="mt-3 text-sm leading-6 text-amber-700">需要确认：{candidate.warnings.join("、")}</p>
                  ) : null}
                  <div className="mt-4 flex flex-wrap gap-3">
                    <Link href={candidateReviewHref(post.id, candidate)} className="primary-button">编辑并保存为地点</Link>
                    <form action={ignoreSourcePostCandidateAction}>
                      <input type="hidden" name="source_post_id" value={post.id} />
                      <input type="hidden" name="candidate_id" value={candidate.id} />
                      <button type="submit" className="secondary-button">忽略</button>
                    </form>
                  </div>
                </article>
              ))}
            </div>
          ) : null}
        </section>

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
            {post.processingStatus !== "saved" ? (
              <label className="grid gap-2 text-sm font-medium text-[var(--ink-strong)]">
                状态
                <select name="processing_status" defaultValue={post.processingStatus === "captured" ? "needs_review" : post.processingStatus} className="form-control w-full">
                  <option value="needs_review">待整理</option>
                  <option value="processing">整理中</option>
                  <option value="failed">需要重试</option>
                </select>
              </label>
            ) : null}
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
          {linkedPlacesResult.data.length > 0 ? linkedPlacesResult.data.map((place) => (
            <form key={`unlink-${place.restaurantId}`} action={unlinkSavedSourcePostFromPlaceAction} className="mt-2">
              <input type="hidden" name="source_post_id" value={post.id} />
              <input type="hidden" name="restaurant_id" value={place.restaurantId} />
              <button type="submit" className="app-text-link">取消关联：{place.name}</button>
            </form>
          )) : null}
        </section>

        <SourcePostPlaceLinker sourcePostId={post.id} />

        <form action={deleteSavedSourcePostAction}>
          <input type="hidden" name="source_post_id" value={post.id} />
          <button type="submit" className="secondary-button w-full">删除这条帖子</button>
        </form>
      </div>
    </AppShell>
  );
}

async function SourcePostPlaceLinker({ sourcePostId }: { sourcePostId: string }) {
  const { restaurants, error } = await getCurrentUserRestaurants();

  if (error) {
    return (
      <section className="form-surface p-4 sm:p-5" aria-labelledby="source-post-link-title">
        <h2 id="source-post-link-title" className="text-lg font-bold">关联已有地点</h2>
        <p className="inline-error mt-3">暂时无法读取地点，请稍后重试。</p>
      </section>
    );
  }

  if (restaurants.length === 0) {
    return null;
  }

  return (
    <section className="form-surface p-4 sm:p-5" aria-labelledby="source-post-link-title">
      <h2 id="source-post-link-title" className="text-lg font-bold">关联已有地点</h2>
      <p className="detail-muted mt-2">选择一个当前账号已有的地点。</p>
      <form action={linkSavedSourcePostToPlaceAction} className="mt-3 grid gap-3">
        <input type="hidden" name="source_post_id" value={sourcePostId} />
        <select name="restaurant_id" required className="form-control w-full" defaultValue="">
          <option value="" disabled>请选择地点</option>
          {restaurants.map((restaurant) => (
            <option key={restaurant.id} value={restaurant.id}>
              {restaurant.name} · {restaurant.city}
            </option>
          ))}
        </select>
        <button type="submit" className="secondary-button w-full">关联已有地点</button>
      </form>
    </section>
  );
}
