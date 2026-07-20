"use server";

import { redirect } from "next/navigation";
import { buildSavedSourcePostCapture } from "@/lib/source-posts/intake";
import {
  createSavedSourcePost,
  deleteSavedSourcePost,
  updateSavedSourcePost,
} from "@/lib/source-posts/repository";
import { normalizeIntakeInput } from "@/lib/intake/normalize-input";

function getRawValue(formData: FormData, key: string) {
  return formData.get(key)?.toString() ?? "";
}

function buildReviewErrorRedirect(sourceInput: string, message: string) {
  const params = new URLSearchParams({
    source_input: sourceInput,
    error: message,
  });

  const normalized = normalizeIntakeInput(sourceInput);
  if (normalized.originalUrl) {
    params.set("source_url", normalized.originalUrl);
  }

  return `/restaurants/review?${params.toString()}`;
}

export async function saveSourcePostForLaterAction(formData: FormData) {
  const sourceInput = getRawValue(formData, "source_input") || getRawValue(formData, "source_url");
  const normalized = normalizeIntakeInput(sourceInput);

  if (!sourceInput.trim() || normalized.inputKind === "unknown") {
    redirect(buildReviewErrorRedirect(sourceInput, "请先粘贴有效的分享内容或来源链接。"));
  }

  const capture = buildSavedSourcePostCapture(sourceInput, {
    resolvedUrl: getRawValue(formData, "resolved_source_url"),
    resolutionStatus: getRawValue(formData, "source_resolution_status") as "resolved" | "not_required" | "timeout" | "blocked" | "invalid" | "redirect_limit" | "failed",
  });
  const result = await createSavedSourcePost(capture);

  if (result.error || !result.data) {
    redirect(buildReviewErrorRedirect(sourceInput, "帖子暂时无法保存，请稍后重试。"));
  }

  redirect("/source-posts?message=帖子已保存，之后再整理");
}

export async function updateSavedSourcePostNoteAction(formData: FormData) {
  const id = getRawValue(formData, "source_post_id");
  const userNote = getRawValue(formData, "user_note");
  const result = await updateSavedSourcePost(id, { userNote });

  redirect(
    `/source-posts/${encodeURIComponent(id)}?${new URLSearchParams(
      result.error || !result.data
        ? { error: "备注暂时无法更新，请稍后重试。" }
        : { message: "备注已更新" },
    ).toString()}`,
  );
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
