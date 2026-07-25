"use server";

import { redirect } from "next/navigation";
import { getAuthenticatedUser } from "@/lib/auth/require-user";
import { buildSavedSourcePostCapture } from "@/lib/source-posts/intake";
import {
  createSavedSourcePost,
  deleteSavedSourcePost,
  getSavedSourcePostById,
  linkSourcePostToPlace,
  unlinkSourcePostFromPlace,
  updateSavedSourcePost,
} from "@/lib/source-posts/repository";
import { normalizeIntakeInput } from "@/lib/intake/normalize-input";
import { logWorkflowDiagnostic } from "@/lib/restaurants/workflow-diagnostics";
import { getCurrentUserRestaurantById } from "@/lib/restaurants/queries";

function getRawValue(formData: FormData, key: string) {
  return formData.get(key)?.toString() ?? "";
}

function buildReviewErrorRedirect(formData: FormData, errorCode: string) {
  const sourceInput = getRawValue(formData, "source_input") || getRawValue(formData, "source_url");
  const params = new URLSearchParams({
    source_input: sourceInput,
    sourcePostError: errorCode,
  });

  const normalized = normalizeIntakeInput(sourceInput);
  if (normalized.originalUrl) {
    params.set("source_url", normalized.originalUrl);
  }

  for (const field of [
    "name",
    "city",
    "country",
    "district",
    "category",
    "address",
    "cuisine",
    "note",
    "manual_evidence",
    "resolved_source_url",
    "source_resolution_status",
    "source_resolution_redirect_count",
  ]) {
    const value = getRawValue(formData, field);
    if (value) {
      params.set(field, value);
    }
  }

  for (const value of formData.getAll("source_urls")) {
    params.append("source_urls", value.toString());
  }

  return `/restaurants/review?${params.toString()}`;
}

export async function saveSourcePostForLaterAction(formData: FormData) {
  const sourceInput = getRawValue(formData, "source_input") || getRawValue(formData, "source_url");
  const normalized = normalizeIntakeInput(sourceInput);

  if (!sourceInput.trim() || normalized.inputKind === "unknown") {
    redirect(buildReviewErrorRedirect(formData, "invalid_input"));
  }

  const user = await getAuthenticatedUser();

  if (!user) {
    redirect(`/login?error=${encodeURIComponent("请先登录后再保存帖子。")}`);
  }

  const capture = buildSavedSourcePostCapture(sourceInput, {
    resolvedUrl: getRawValue(formData, "resolved_source_url"),
    resolutionStatus: getRawValue(formData, "source_resolution_status") as "resolved" | "not_required" | "timeout" | "blocked" | "invalid" | "redirect_limit" | "failed",
  });
  const result = await createSavedSourcePost(capture);

  if (result.error || !result.data) {
    logWorkflowDiagnostic({
      event: "source_post_save_failed",
      operation: "save_source_post",
      errorCategory: result.error ? "repository_error" : "not_created",
      errorCode: result.error?.errorCode,
    });
    redirect(buildReviewErrorRedirect(formData, "save_failed"));
  }

  redirect(`/source-posts/${encodeURIComponent(result.data.id)}?saved=1`);
}

export async function updateSavedSourcePostNoteAction(formData: FormData) {
  const id = getRawValue(formData, "source_post_id");
  const userNote = getRawValue(formData, "user_note");
  const requestedStatus = getRawValue(formData, "processing_status");
  const validStatuses = new Set(["needs_review", "processing", "failed"]);
  const result = await updateSavedSourcePost(id, {
    userNote,
    ...(validStatuses.has(requestedStatus)
      ? { processingStatus: requestedStatus as "needs_review" | "processing" | "failed" }
      : {}),
  });

  redirect(
    `/source-posts/${encodeURIComponent(id)}?${new URLSearchParams(
      result.error || !result.data
        ? { error: "备注暂时无法更新，请稍后重试。" }
        : { message: "备注已更新" },
    ).toString()}`,
  );
}

export async function organizeSavedSourcePostAction(formData: FormData) {
  const id = getRawValue(formData, "source_post_id");
  const user = await getAuthenticatedUser();

  if (!user) {
    redirect(`/login?error=${encodeURIComponent("请先登录后再整理帖子。")}`);
  }

  const postResult = await getSavedSourcePostById(id);
  if (!postResult.data) {
    redirect(`/source-posts/${encodeURIComponent(id)}?error=${encodeURIComponent("帖子暂时无法读取，请稍后重试。")}`);
  }

  if (postResult.data.processingStatus === "captured") {
    const statusResult = await updateSavedSourcePost(id, { processingStatus: "needs_review" });
    if (statusResult.error || !statusResult.data) {
      redirect(`/source-posts/${encodeURIComponent(id)}?error=${encodeURIComponent("帖子状态暂时无法更新，请稍后重试。")}`);
    }
  }

  redirect(`/restaurants/review?source_post_id=${encodeURIComponent(id)}`);
}

export async function linkSavedSourcePostToPlaceAction(formData: FormData) {
  const sourcePostId = getRawValue(formData, "source_post_id");
  const restaurantId = Number(getRawValue(formData, "restaurant_id"));
  const postResult = await getSavedSourcePostById(sourcePostId);

  if (!postResult.data || !Number.isInteger(restaurantId) || restaurantId <= 0) {
    redirect(`/source-posts/${encodeURIComponent(sourcePostId)}?error=${encodeURIComponent("请选择有效的地点。")}`);
  }

  const placeResult = await getCurrentUserRestaurantById(restaurantId);
  if (!placeResult.restaurant) {
    redirect(`/source-posts/${encodeURIComponent(sourcePostId)}?error=${encodeURIComponent("无法关联这个地点。")}`);
  }

  const result = await linkSourcePostToPlace(sourcePostId, restaurantId);
  redirect(`/source-posts/${encodeURIComponent(sourcePostId)}?${new URLSearchParams(
    result.linked
      ? { message: "已关联到现有地点" }
      : { error: "关联失败，请稍后重试。" },
  ).toString()}`);
}

export async function unlinkSavedSourcePostFromPlaceAction(formData: FormData) {
  const sourcePostId = getRawValue(formData, "source_post_id");
  const restaurantId = Number(getRawValue(formData, "restaurant_id"));
  const postResult = await getSavedSourcePostById(sourcePostId);

  if (!postResult.data || !Number.isInteger(restaurantId) || restaurantId <= 0) {
    redirect(`/source-posts/${encodeURIComponent(sourcePostId)}?error=${encodeURIComponent("无法取消这个关联。")}`);
  }

  const placeResult = await getCurrentUserRestaurantById(restaurantId);
  if (!placeResult.restaurant) {
    redirect(`/source-posts/${encodeURIComponent(sourcePostId)}?error=${encodeURIComponent("无法取消这个关联。")}`);
  }

  const result = await unlinkSourcePostFromPlace(sourcePostId, restaurantId);
  redirect(`/source-posts/${encodeURIComponent(sourcePostId)}?${new URLSearchParams(
    result.unlinked
      ? { message: "已取消地点关联" }
      : { error: "取消关联失败，请稍后重试。" },
  ).toString()}`);
}

export async function deleteSavedSourcePostAction(formData: FormData) {
  const id = getRawValue(formData, "source_post_id");
  const result = await deleteSavedSourcePost(id);

  redirect(
    `/source-posts?${new URLSearchParams(
      result.error || !result.deleted
        ? { error: "帖子暂时无法删除，请稍后重试。" }
        : { message: "帖子已删除" },
    ).toString()}`,
  );
}
