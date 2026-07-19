import Link from "next/link";
import { notFound } from "next/navigation";
import { PlaceholderCard } from "@/components/placeholder-card";
import { PublicShell } from "@/components/public-shell";
import { SurfaceCard } from "@/components/surface-card";
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
  if (process.env.NODE_ENV === "production") {
    notFound();
  }

  const status = await getSupabaseSetupStatus();

  return (
    <PublicShell
      eyebrow="第二步设置检查"
      title="Supabase 已接入，存个地也已经拥有统一页面风格"
      description="这个页面继续负责展示 Supabase 项目连接状态，同时已经切换到移动端优先视觉系统。它不会创建任何收藏数据。"
      aside={
        <PlaceholderCard
          title="手动设置提醒"
          description="如果项目还没配置完成，可以继续在这里检查环境变量、项目地址和 HTTP 返回状态。"
          actionHref="/"
          actionLabel="返回首页"
        />
      }
    >
      <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <SurfaceCard className="p-5 sm:p-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm text-[var(--ink-muted)]">当前状态</p>
              <h2 className="mt-2 [font-family:var(--font-display)] text-2xl font-semibold tracking-[-0.03em] text-[var(--ink-strong)]">
                {status.message}
              </h2>
            </div>
            <span
              className={`rounded-full px-4 py-2 text-sm font-medium ${
                status.reachable
                  ? "bg-emerald-100 text-emerald-700"
                  : "bg-amber-100 text-amber-700"
              }`}
            >
              {status.reachable ? "已连接" : "待完成"}
            </span>
          </div>

          <p className="mt-4 text-sm leading-7 text-[var(--ink-soft)]">
            {status.details}
          </p>

          <dl className="mt-6 grid gap-3 text-sm text-[var(--ink-soft)]">
            <div className="rounded-[24px] border border-[var(--border-soft)] bg-[var(--surface-muted)] p-4">
              <dt className="text-[var(--ink-muted)]">环境变量</dt>
              <dd className="mt-1">{status.configured ? "已检测到" : "未检测到"}</dd>
            </div>
            <div className="rounded-[24px] border border-[var(--border-soft)] bg-[var(--surface-muted)] p-4">
              <dt className="text-[var(--ink-muted)]">项目地址</dt>
              <dd className="mt-1 break-all">{status.url ?? "尚未提供"}</dd>
            </div>
            <div className="rounded-[24px] border border-[var(--border-soft)] bg-[var(--surface-muted)] p-4">
              <dt className="text-[var(--ink-muted)]">项目标识</dt>
              <dd className="mt-1">{status.projectRef ?? "尚未识别"}</dd>
            </div>
            <div className="rounded-[24px] border border-[var(--border-soft)] bg-[var(--surface-muted)] p-4">
              <dt className="text-[var(--ink-muted)]">HTTP 状态</dt>
              <dd className="mt-1">
                {status.httpStatus ? String(status.httpStatus) : "暂无"}
              </dd>
            </div>
          </dl>
        </SurfaceCard>

        <SurfaceCard className="p-5 sm:p-6">
          <h2 className="[font-family:var(--font-display)] text-2xl font-semibold tracking-[-0.03em] text-[var(--ink-strong)]">
            你需要手动完成的 Supabase 设置
          </h2>
          <ol className="mt-4 space-y-3 text-sm leading-7 text-[var(--ink-soft)]">
            {steps.map((step, index) => (
              <li key={step}>
                {index + 1}. {step}
              </li>
            ))}
          </ol>

          <div className="mt-6 rounded-[24px] border border-[var(--border-soft)] bg-[var(--surface-muted)] p-4 text-sm text-[var(--ink-soft)]">
            <p className="font-medium text-[var(--ink-strong)]">需要填写的变量</p>
            <p className="mt-2 break-all">
              NEXT_PUBLIC_SUPABASE_URL
              <br />
              NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
            </p>
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/"
              className="rounded-full bg-[var(--accent)] px-5 py-3 text-sm font-semibold text-white shadow-[0_18px_38px_rgba(255,91,0,0.28)] transition hover:bg-[var(--accent-deep)]"
            >
              返回首页
            </Link>
            <a
              href="https://supabase.com/dashboard/new/_"
              target="_blank"
              rel="noreferrer"
              className="rounded-full border border-[var(--border-soft)] bg-white px-5 py-3 text-sm font-medium text-[var(--ink-strong)] transition hover:border-[var(--accent)] hover:text-[var(--accent)]"
            >
              打开 Supabase 控制台
            </a>
          </div>
        </SurfaceCard>
      </div>
    </PublicShell>
  );
}
