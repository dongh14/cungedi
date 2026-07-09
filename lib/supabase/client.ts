import { createClient } from "@supabase/supabase-js";
import { getSupabasePublicEnv } from "@/lib/supabase/env";

export function createSupabaseClient() {
  const env = getSupabasePublicEnv();

  if (!env) {
    return null;
  }

  return createClient(env.url, env.publishableKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
  });
}
