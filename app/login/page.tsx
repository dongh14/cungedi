import Link from "next/link";
import { loginAction } from "@/app/auth/actions";

type LoginPageProps = {
  searchParams?: Promise<{
    error?: string;
    message?: string;
  }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = (await searchParams) ?? {};

  return (
    <main className="flex min-h-screen items-center justify-center bg-stone-950 px-6 py-16 text-stone-50">
      <section className="w-full max-w-md rounded-3xl border border-white/10 bg-white/6 p-8 shadow-2xl shadow-black/20 backdrop-blur sm:p-10">
        <div className="space-y-4">
          <span className="inline-flex rounded-full border border-sky-300/40 bg-sky-300/12 px-4 py-1 text-sm font-medium tracking-[0.18em] text-sky-100">
            第三步认证
          </span>
          <h1 className="text-3xl font-semibold tracking-tight">邮箱登录</h1>
          <p className="text-sm leading-7 text-stone-300">
            使用 Supabase 邮箱密码登录。当前只实现认证能力，不包含餐厅数据功能。
          </p>
        </div>

        {params.message ? (
          <div className="mt-6 rounded-2xl border border-emerald-300/25 bg-emerald-300/10 px-4 py-3 text-sm text-emerald-100">
            {params.message}
          </div>
        ) : null}

        {params.error ? (
          <div className="mt-6 rounded-2xl border border-rose-300/25 bg-rose-300/10 px-4 py-3 text-sm text-rose-100">
            {params.error}
          </div>
        ) : null}

        <form action={loginAction} className="mt-6 space-y-4">
          <div className="space-y-2">
            <label htmlFor="email" className="text-sm text-stone-300">
              邮箱
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-stone-50 outline-none transition placeholder:text-stone-500 focus:border-sky-200/40"
              placeholder="you@example.com"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="password" className="text-sm text-stone-300">
              密码
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              minLength={6}
              className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-stone-50 outline-none transition placeholder:text-stone-500 focus:border-sky-200/40"
              placeholder="至少 6 位字符"
            />
          </div>

          <button
            type="submit"
            className="w-full rounded-full bg-stone-100 px-5 py-3 text-sm font-medium text-stone-950 transition hover:bg-white"
          >
            登录
          </button>
        </form>

        <div className="mt-6 flex flex-wrap gap-3 text-sm text-stone-300">
          <Link href="/sign-up" className="text-stone-100 underline underline-offset-4">
            没有账号？去注册
          </Link>
          <Link href="/" className="text-stone-100 underline underline-offset-4">
            返回首页
          </Link>
        </div>
      </section>
    </main>
  );
}
