import type {
  AIEnrichmentCacheDescriptor,
  AIEnrichmentCacheEntry,
  AIEnrichmentCacheStore,
} from "./ai-cache.ts";

async function getSupabaseClient() {
  const { createServerSupabaseClient } = await import("../supabase/server.ts");

  return createServerSupabaseClient();
}

export function createSupabaseAIEnrichmentCacheStore(
  userId: string,
): AIEnrichmentCacheStore {
  return {
    async get(cacheKey): Promise<AIEnrichmentCacheEntry | null> {
      const supabase = await getSupabaseClient();
      const { data, error } = await supabase
        .from("ai_enrichment_cache")
        .select("response_json, expires_at")
        .eq("user_id", userId)
        .eq("cache_key", cacheKey)
        .gt("expires_at", new Date().toISOString())
        .maybeSingle();

      if (error) {
        throw error;
      }

      return data
        ? {
            responseJson: data.response_json,
            expiresAt: data.expires_at,
          }
        : null;
    },

    async set(input: {
      descriptor: AIEnrichmentCacheDescriptor;
      userId: string;
      responseJson: unknown;
      expiresAt: string;
    }) {
      const supabase = await getSupabaseClient();
      const { error } = await supabase.from("ai_enrichment_cache").upsert(
        {
          user_id: input.userId,
          cache_key: input.descriptor.cacheKey,
          provider: input.descriptor.provider,
          model: input.descriptor.model,
          prompt_version: input.descriptor.promptVersion,
          source_type: input.descriptor.sourceType || null,
          source_url: input.descriptor.sourceUrl || null,
          evidence_hash: input.descriptor.evidenceHash,
          response_json: input.responseJson,
          expires_at: input.expiresAt,
        },
        { onConflict: "user_id,cache_key" },
      );

      if (error) {
        throw error;
      }
    },

    async delete(cacheKey) {
      const supabase = await getSupabaseClient();
      const { error } = await supabase
        .from("ai_enrichment_cache")
        .delete()
        .eq("user_id", userId)
        .eq("cache_key", cacheKey);

      if (error) {
        throw error;
      }
    },
  };
}
