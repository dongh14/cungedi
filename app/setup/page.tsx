import Link from "next/link";
import { getSupabaseSetupStatus } from "@/lib/supabase/health";

export const metadata = {
  title: "Supabase 设置检查",
};

const steps = [
  "在 Supabase 官网注册或登录账号。",
  "创建一个新的 Supabase 项目，并等待项目初始化完成。",
  "在项目的 Connect 面板中找到 Next.js 所需的 URL 和 publishable key。",
  "把 .env.example 复制为 .env.local，并填入这两个值。",
  "重启本地应用后，重新打开这个页面确认状态变为已连接。",
];

export default async function SetupPage() {
  const status = await getSupabaseSetupStatus();

  return (
    <main className="flex min-h-screen items-center justify-center bg-stone-950 px-6 py-16 text-stone-50">
      <section className="w-full max-w-5xl space-y-6 rounded-3xl border border-white/10 bg-white/6 p-8 shadow-2xl shadow-black/20 backdrop-blur sm:p-12">
        <div className="space-y-4">
          <span className="inline-flex rounded-full border border-emerald-300/40 bg-emerald-300/12 px-4 py-1 text-sm font-medium tracking-[0.18em] text-emerald-100">
            第二步设置检查
          </span>
          <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
            Supabase 项目连接状态
          </h1>
          <p className="max-w-3xl text-lg leading-8 text-stone-300">
            这个页面只用于确认 Step 2 的基础配置是否完成。它不会开始登录功能，也不会创建任何业务数据。
          </p>
        </div>

        <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-3xl border border-white/10 bg-black/20 p-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm text-stone-400">当前状态</p>
                <h2 className="mt-2 text-2xl font-semibold">{status.message}</h2>
              </div>
              <span
                className={`rounded-full px-4 py-2 text-sm font-medium ${
                  status.reachable
                    ? "bg-emerald-400/15 text-emerald-200"
                    : "bg-amber-300/15 text-amber-100"
                }`}
              >
                {status.reachable ? "已连接" : "待完成"}
              </span>
            </div>

            <p className="mt-4 text-sm leading-7 text-stone-300">
              {status.details}
            </p>

            <dl className="mt-6 grid gap-3 text-sm text-stone-300">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <dt className="text-stone-400">环境变量</dt>
                <dd className="mt-1">
                  {status.configured ? "已检测到" : "未检测到"}
                </dd>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <dt className="text-stone-400">项目地址</dt>
                <dd className="mt-1 break-all">{status.url ?? "尚未提供"}</dd>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <dt className="text-stone-400">项目标识</dt>
                <dd className="mt-1">{status.projectRef ?? "尚未识别"}</dd>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <dt className="text-stone-400">HTTP 状态</dt>
                <dd className="mt-1">
                  {status.httpStatus ? String(status.httpStatus) : "暂无"}
                </dd>
              </div>
            </dl>
          </div>

          <div className="rounded-3xl border border-white/10 bg-black/20 p-6">
            <h2 className="text-xl font-semibold">你需要手动完成的 Supabase 设置</h2>
            <ol className="mt-4 space-y-3 text-sm leading-7 text-stone-300">
              {steps.map((step, index) => (
                <li key={step}>
                  {index + 1}. {step}
                </li>
              ))}
            </ol>

            <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-stone-300">
              <p className="font-medium text-stone-100">需要填写的变量</p>
              <p className="mt-2 break-all">
                NEXT_PUBLIC_SUPABASE_URL
                <br />
                NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
              </p>
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href="/"
                className="rounded-full bg-stone-100 px-5 py-3 text-sm font-medium text-stone-950 transition hover:bg-white"
              >
                返回首页
              </Link>
              <a
                href="https://supabase.com/dashboard/new/_"
                target="_blank"
                rel="noreferrer"
                className="rounded-full border border-white/15 px-5 py-3 text-sm font-medium text-stone-100 transition hover:bg-white/8"
              >
                打开 Supabase 控制台
              </a>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
