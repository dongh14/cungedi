import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { getSupabasePublicEnv } from "@/lib/supabase/env";

const protectedRoutes = ["/dashboard"];
const guestOnlyRoutes = ["/login", "/sign-up"];

export async function proxy(request: NextRequest) {
  const env = getSupabasePublicEnv();

  if (!env) {
    return NextResponse.next({
      request,
    });
  }

  let response = NextResponse.next({
    request,
  });

  const supabase = createServerClient(env.url, env.publishableKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => {
          request.cookies.set(name, value);
        });

        response = NextResponse.next({
          request,
        });

        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
      },
    },
  });

  const { data, error } = await supabase.auth.getClaims();
  const pathname = request.nextUrl.pathname;
  const isSignedIn = Boolean(data?.claims?.sub) && !error;

  if (protectedRoutes.some((route) => pathname.startsWith(route)) && !isSignedIn) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("error", "请先登录后再访问该页面。");
    return NextResponse.redirect(url);
  }

  if (guestOnlyRoutes.includes(pathname) && isSignedIn) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    url.searchParams.set("message", "你已经登录。");
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
