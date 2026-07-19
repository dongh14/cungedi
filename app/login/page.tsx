import { loginAction } from "@/app/auth/actions";
import { redirect } from "next/navigation";
import { AuthCard } from "@/components/auth-card";
import { SiteBrand } from "@/components/site-brand";
import { getSafeLoginErrorMessage } from "@/lib/auth/login-ui";
import { getAuthenticatedUser } from "@/lib/auth/require-user";

type LoginPageProps = {
  searchParams?: Promise<{
    error?: string;
    message?: string;
  }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const user = await getAuthenticatedUser();

  if (user) {
    redirect("/dashboard");
  }

  const params = (await searchParams) ?? {};

  return (
    <main className="login-page">
      <div className="login-page-content">
        <div className="login-brand">
          <SiteBrand
            href="/login"
            subtitle="收藏你喜欢的地方"
            className="login-brand-link"
          />
        </div>
      <AuthCard
        formAction={loginAction}
        title="欢迎回来"
        description="登录账号，继续收藏地点"
        submitLabel="登录"
        alternateHref="/sign-up"
        alternateLabel="还没有账号？立即注册"
        emailPlaceholder="请输入邮箱"
        passwordPlaceholder="请输入密码"
        searchParams={{
          ...params,
          error: getSafeLoginErrorMessage(params.error),
        }}
        variant="login"
      />
      </div>
    </main>
  );
}
