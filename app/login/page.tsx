import { loginAction } from "@/app/auth/actions";
import { AuthCard } from "@/components/auth-card";
import { PlaceholderCard } from "@/components/placeholder-card";
import { PublicShell } from "@/components/public-shell";

type LoginPageProps = {
  searchParams?: Promise<{
    error?: string;
    message?: string;
  }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = (await searchParams) ?? {};

  return (
    <PublicShell
      eyebrow="账号入口"
      title="登录后继续进入你的地点收藏面板"
      description="登录页现在已经纳入统一视觉风格。它会带你进入移动端优先的主导航外壳，并继续进入你的个人地点收藏流程。"
      aside={
        <>
          <PlaceholderCard
            title="登录后会看到什么"
            description="登录成功后会进入主页面总览，并可以通过底部导航访问添加入口、已收藏与地图页占位。 "
            items={[
              "页面已经按 iPhone 竖屏节奏排版。",
              "地点录入、列表和地图能力都已经接入当前主路径。",
              "RLS 仍会继续保护你后续的数据访问。",
            ]}
          />
        </>
      }
    >
      <AuthCard
        formAction={loginAction}
        title="邮箱登录"
        description="使用 Supabase 邮箱密码登录。当前阶段重点是地点收藏主路径与导航体验。"
        submitLabel="登录"
        accentLabel="第三步认证"
        alternateHref="/sign-up"
        alternateLabel="没有账号？去注册"
        searchParams={params}
      />
    </PublicShell>
  );
}
