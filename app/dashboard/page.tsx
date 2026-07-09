import Link from "next/link";
import { redirect } from "next/navigation";
import { logoutAction } from "@/app/auth/actions";
import { createServerSupabaseClient } from "@/lib/supabase/server";

type DashboardPageProps = {
  searchParams?: Promise<{
    message?: string;
  }>;
};

export default async function DashboardPage({
  searchParams,
}: DashboardPageProps) {
  const params = (await searchParams) ?? {};
  const supabase = await createServerSupabaseClient();
  const { data: claimsData } = await supabase.auth.getClaims();

  if (!claimsData?.claims?.sub) {
    redirect("/login?error=请先登录后再访问该页面。");
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <main className="flex min-h-screen items-center justify-center bg-stone-950 px-6 py-16 text-stone-50">
      <section className="w-full max-w-4xl rounded-3xl border border-white/10 bg-white/6 p-8 shadow-2xl shadow-black/20 backdrop-blur sm:p-12">
        <div className="space-y-4">
          <span className="inline-flex rounded-full border border-emerald-300/40 bg-emerald-300/12 px-4 py-1 text-sm font-medium tracking-[0.18em] text-emerald-100">
            已登录
          </span>
          <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
            认证保护页面
          </h1>
          <p className="max-w-2xl text-lg leading-8 text-stone-300">
            这是 Step 3 的受保护页面示例。只有登录用户可以访问它，后续用户专属餐厅功能会接在这里之后继续扩展。
          </p>
        </div>

        {params.message ? (
          <div className="mt-6 rounded-2xl border border-emerald-300/25 bg-emerald-300/10 px-4 py-3 text-sm text-emerald-100">
            {params.message}
          </div>
        ) : null}

        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl border border-white/10 bg-black/20 p-5">
            <p className="text-sm text-stone-400">当前邮箱</p>
            <p className="mt-2 break-all text-base text-stone-100">
              {user?.email ?? "未读取到邮箱"}
            </p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-black/20 p-5">
            <p className="text-sm text-stone-400">用户 ID</p>
            <p className="mt-2 break-all text-base text-stone-100">
              {claimsData.claims.sub}
            </p>
          </div>
        </div>

        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href="/"
            className="rounded-full border border-white/15 px-5 py-3 text-sm font-medium text-stone-100 transition hover:bg-white/8"
          >
            返回首页
          </Link>
          <Link
            href="/setup"
            className="rounded-full border border-white/15 px-5 py-3 text-sm font-medium text-stone-100 transition hover:bg-white/8"
          >
            查看设置页
          </Link>
          <form action={logoutAction}>
            <button
              type="submit"
              className="rounded-full bg-stone-100 px-5 py-3 text-sm font-medium text-stone-950 transition hover:bg-white"
            >
              退出登录
            </button>
          </form>
        </div>
      </section>
    </main>
  );
}
