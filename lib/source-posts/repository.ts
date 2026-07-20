import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getSourcePostStatusAfterLinkChange } from "./intake";
import type {
  CreateSavedSourcePostInput,
  SavedSourcePost,
  SavedSourcePostPlace,
  SourcePostPlatform,
  SourcePostProcessingStatus,
  SourcePostRepositoryResult,
  UpdateSavedSourcePostInput,
} from "./types";

const MAX_PAGE_SIZE = 50;

const sourcePostSelect =
  "id, user_id, platform, original_url, resolved_url, original_text, source_image_path, processing_status, detected_candidates, user_note, created_at, updated_at";

function isSourcePostPlatform(value: unknown): value is SourcePostPlatform {
  return value === "xiaohongshu" || value === "douyin" || value === "web" || value === "unknown";
}

function isSourcePostStatus(value: unknown): value is SourcePostProcessingStatus {
  return value === "captured" || value === "processing" || value === "needs_review" || value === "saved" || value === "failed";
}

function toSavedSourcePost(row: Record<string, unknown>): SavedSourcePost {
  return {
    id: String(row.id),
    userId: String(row.user_id),
    platform: isSourcePostPlatform(row.platform) ? row.platform : "unknown",
    originalUrl: typeof row.original_url === "string" ? row.original_url : null,
    resolvedUrl: typeof row.resolved_url === "string" ? row.resolved_url : null,
    originalText: typeof row.original_text === "string" ? row.original_text : null,
    sourceImagePath: typeof row.source_image_path === "string" ? row.source_image_path : null,
    processingStatus: isSourcePostStatus(row.processing_status) ? row.processing_status : "captured",
    detectedCandidates: Array.isArray(row.detected_candidates) ? row.detected_candidates : [],
    userNote: typeof row.user_note === "string" ? row.user_note : null,
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  };
}

function repositoryError(error: unknown) {
  return error instanceof Error ? error : new Error("source post operation failed");
}

async function getUserContext() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return user ? { supabase, user } : null;
}

export async function createSavedSourcePost(
  input: CreateSavedSourcePostInput,
): Promise<SourcePostRepositoryResult<SavedSourcePost | null>> {
  const context = await getUserContext();

  if (!context) {
    return { data: null, error: null };
  }

  const { data, error } = await context.supabase
    .from("saved_source_posts")
    .insert({
      user_id: context.user.id,
      platform: input.platform,
      original_url: input.originalUrl,
      resolved_url: input.resolvedUrl,
      original_text: input.originalText,
      source_image_path: input.sourceImagePath ?? null,
      processing_status: input.processingStatus ?? "captured",
      detected_candidates: Array.isArray(input.detectedCandidates) ? input.detectedCandidates : [],
      user_note: input.userNote ?? null,
    })
    .select(sourcePostSelect)
    .single();

  return {
    data: data ? toSavedSourcePost(data as Record<string, unknown>) : null,
    error: error ? repositoryError(error) : null,
  };
}

export async function getSavedSourcePostById(
  id: string,
): Promise<SourcePostRepositoryResult<SavedSourcePost | null>> {
  const context = await getUserContext();

  if (!context) {
    return { data: null, error: null };
  }

  const { data, error } = await context.supabase
    .from("saved_source_posts")
    .select(sourcePostSelect)
    .eq("id", id)
    .maybeSingle();

  return {
    data: data ? toSavedSourcePost(data as Record<string, unknown>) : null,
    error: error ? repositoryError(error) : null,
  };
}

export async function listSavedSourcePosts(options: {
  status?: SourcePostProcessingStatus;
  limit?: number;
  offset?: number;
} = {}): Promise<SourcePostRepositoryResult<SavedSourcePost[]>> {
  const context = await getUserContext();

  if (!context) {
    return { data: [], error: null };
  }

  const limit = Math.min(Math.max(options.limit ?? MAX_PAGE_SIZE, 1), MAX_PAGE_SIZE);
  const offset = Math.max(options.offset ?? 0, 0);
  let query = context.supabase
    .from("saved_source_posts")
    .select(sourcePostSelect)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (options.status) {
    query = query.eq("processing_status", options.status);
  }

  const { data, error } = await query;

  return {
    data: ((data ?? []) as Array<Record<string, unknown>>).map(toSavedSourcePost),
    error: error ? repositoryError(error) : null,
  };
}

export async function updateSavedSourcePost(
  id: string,
  input: UpdateSavedSourcePostInput,
): Promise<SourcePostRepositoryResult<SavedSourcePost | null>> {
  const context = await getUserContext();

  if (!context) {
    return { data: null, error: null };
  }

  const payload = {
    ...(input.processingStatus ? { processing_status: input.processingStatus } : {}),
    ...(input.userNote !== undefined ? { user_note: input.userNote?.trim() || null } : {}),
  };
  const { data, error } = await context.supabase
    .from("saved_source_posts")
    .update(payload)
    .eq("id", id)
    .select(sourcePostSelect)
    .maybeSingle();

  return {
    data: data ? toSavedSourcePost(data as Record<string, unknown>) : null,
    error: error ? repositoryError(error) : null,
  };
}

export async function deleteSavedSourcePost(id: string) {
  const context = await getUserContext();

  if (!context) {
    return { deleted: false, error: null };
  }

  const { error } = await context.supabase
    .from("saved_source_posts")
    .delete()
    .eq("id", id);

  return { deleted: !error, error: error ? repositoryError(error) : null };
}

export async function linkSourcePostToPlace(sourcePostId: string, restaurantId: number) {
  const context = await getUserContext();

  if (!context) {
    return { linked: false, error: null };
  }

  const { error: linkError } = await context.supabase
    .from("saved_source_post_places")
    .upsert(
      { source_post_id: sourcePostId, restaurant_id: restaurantId },
      { onConflict: "source_post_id,restaurant_id", ignoreDuplicates: true },
    );

  if (linkError) {
    return { linked: false, error: repositoryError(linkError) };
  }

  const { error: statusError } = await context.supabase
    .from("saved_source_posts")
    .update({ processing_status: getSourcePostStatusAfterLinkChange(1) })
    .eq("id", sourcePostId);

  return { linked: !statusError, error: statusError ? repositoryError(statusError) : null };
}

export async function unlinkSourcePostFromPlace(sourcePostId: string, restaurantId: number) {
  const context = await getUserContext();

  if (!context) {
    return { unlinked: false, error: null };
  }

  const { error: unlinkError } = await context.supabase
    .from("saved_source_post_places")
    .delete()
    .eq("source_post_id", sourcePostId)
    .eq("restaurant_id", restaurantId);

  if (unlinkError) {
    return { unlinked: false, error: repositoryError(unlinkError) };
  }

  const { count, error: countError } = await context.supabase
    .from("saved_source_post_places")
    .select("source_post_id", { count: "exact", head: true })
    .eq("source_post_id", sourcePostId);

  if (countError) {
    return { unlinked: false, error: repositoryError(countError) };
  }

  const { error: statusError } = await context.supabase
    .from("saved_source_posts")
    .update({ processing_status: getSourcePostStatusAfterLinkChange(count ?? 0) })
    .eq("id", sourcePostId);

  return { unlinked: !statusError, error: statusError ? repositoryError(statusError) : null };
}

export async function listLinkedPlacesForSourcePost(
  sourcePostId: string,
): Promise<SourcePostRepositoryResult<SavedSourcePostPlace[]>> {
  const context = await getUserContext();

  if (!context) {
    return { data: [], error: null };
  }

  const { data, error } = await context.supabase
    .from("saved_source_post_places")
    .select("source_post_id, restaurant_id, created_at, restaurants(name, city, country, district, category)")
    .eq("source_post_id", sourcePostId)
    .order("created_at", { ascending: false });

  const places = ((data ?? []) as Array<Record<string, unknown>>).flatMap((row) => {
    const restaurant = row.restaurants as Record<string, unknown> | null;

    return restaurant ? [{
      sourcePostId: String(row.source_post_id),
      restaurantId: Number(row.restaurant_id),
      name: String(restaurant.name),
      city: String(restaurant.city),
      country: typeof restaurant.country === "string" ? restaurant.country : null,
      district: typeof restaurant.district === "string" ? restaurant.district : null,
      category: String(restaurant.category),
      createdAt: String(row.created_at),
    }] : [];
  });

  return {
    data: places,
    error: error ? repositoryError(error) : null,
  };
}
