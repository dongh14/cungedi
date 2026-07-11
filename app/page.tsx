import Link from "next/link";
import { PlaceholderCard } from "@/components/placeholder-card";
import { PublicShell } from "@/components/public-shell";
import { SurfaceCard } from "@/components/surface-card";

export default function Home() {
  return (
    <PublicShell
      eyebrow="Step 6 导航外壳"
      title="用更轻松的方式整理你看到的地点灵感"
      description="这个版本先把主要页面与导航搭好，让你能在手机尺寸下顺畅地走完整体路径。无论是美食、购物、玩乐、景点还是住宿，后续都可以在这里慢慢存起来。"
      aside={
        <>
          <PlaceholderCard
            title="V1 页面已经就位"
            description="首页、登录、注册、添加入口、已收藏和地图占位页都已经接入统一导航。"
            items={[
              "默认可见文案为简体中文。",
              "整体布局优先适配 iPhone 竖屏。",
              "主强调色使用接近 #FF5B00 的亮橙色。",
            ]}
          />
          <PlaceholderCard
            title="当前支持的主流程"
            description="先完成账号与页面骨架，帮助你快速验证产品方向和操作路线。"
            actionHref="/dashboard"
            actionLabel="打开已登录主页面"
          />
        </>
      }
    >
      <div className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row">
          <Link
            href="/sign-up"
            className="inline-flex justify-center rounded-full bg-[var(--accent)] px-5 py-3.5 text-sm font-semibold text-white shadow-[0_18px_38px_rgba(255,91,0,0.28)] transition hover:bg-[var(--accent-deep)]"
          >
            先注册账号
          </Link>
          <Link
            href="/login"
            className="inline-flex justify-center rounded-full border border-[var(--border-soft)] bg-white px-5 py-3.5 text-sm font-medium text-[var(--ink-strong)] transition hover:border-[var(--accent)] hover:text-[var(--accent)]"
          >
            已有账号，去登录
          </Link>
          <Link
            href="/setup"
            className="inline-flex justify-center rounded-full border border-[var(--border-soft)] bg-[var(--surface-muted)] px-5 py-3.5 text-sm font-medium text-[var(--ink-strong)] transition hover:border-[var(--accent)] hover:text-[var(--accent)]"
          >
            查看 Supabase 设置
          </Link>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          {[
            "支持围绕小红书、抖音、Google Maps 和公开网页建立收藏流程。",
            "保存前先确认信息，避免不准确数据直接进入你的已收藏清单。",
            "后续会逐步接上手动录入、列表浏览和地图回看能力。",
          ].map((item) => (
            <SurfaceCard key={item} className="p-4 sm:p-5">
              <p className="text-sm leading-7 text-[var(--ink-soft)]">{item}</p>
            </SurfaceCard>
          ))}
        </div>
      </div>
    </PublicShell>
  );
}
