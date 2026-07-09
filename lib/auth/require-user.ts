import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export type AuthenticatedUser = {
  userId: string;
  email: string | null;
};

export async function requireAuthenticatedUser(): Promise<AuthenticatedUser> {
  const supabase = await createServerSupabaseClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;

  if (!userId) {
    redirect("/login?error=请先登录后再访问该页面。");
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  return {
    userId,
    email: user?.email ?? null,
  };
}
