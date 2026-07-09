import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { requireSupabasePublicEnv } from "@/lib/supabase/env";

export async function createServerSupabaseClient() {
  const cookieStore = await cookies();
  const env = requireSupabasePublicEnv();

  return createServerClient(env.url, env.publishableKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // Server Components cannot always write cookies. Middleware handles refresh writes.
        }
      },
    },
  });
}
