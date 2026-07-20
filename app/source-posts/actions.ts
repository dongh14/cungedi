"use server";

import { redirect } from "next/navigation";
import { getAuthenticatedUser } from "@/lib/auth/require-user";
import { buildSavedSourcePostCapture } from "@/lib/source-posts/intake";
import {
  createSavedSourcePost,
  deleteSavedSourcePost,
  updateSavedSourcePost,
} from "@/lib/source-posts/repository";
import { normalizeIntakeInput } from "@/lib/intake/normalize-input";
import { logWorkflowDiagnostic } from "@/lib/restaurants/workflow-diagnostics";

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
