import { signUpAction } from "@/app/auth/actions";
import { redirect } from "next/navigation";
import { AuthCard } from "@/components/auth-card";
import { PlaceholderCard } from "@/components/placeholder-card";
import { PublicShell } from "@/components/public-shell";
import { getAuthenticatedUser } from "@/lib/auth/require-user";

type SignUpPageProps = {
  searchParams?: Promise<{
    error?: string;
    message?: string;
  }>;
};

export default async function SignUpPage({ searchParams }: SignUpPageProps) {
  const user = await getAuthenticatedUser();

  if (user) {
    redirect("/dashboard");
  }

  const params = (await searchParams) ?? {};

  return (
    <PublicShell
      eyebrow="账号入口"
      title="先创建账号，再开始搭建你的地点收藏"
      description="注册页与登录页现在共享同一套移动端优先视觉风格。后续你可以在这个基础上继续保存美食、购物、娱乐、景点、住宿和其他地点。"
      aside={
          <PlaceholderCard
            title="注册后的下一站"
            description="创建个人账号后，你就可以开始保存和整理喜欢的地点。"
            items={[
              "使用邮箱和密码创建账号。",
              "注册后即可开始添加地点。",
              "邮箱确认仍按当前账号设置执行。",
            ]}
        />
      }
    >
      <AuthCard
        formAction={signUpAction}
        title="邮箱注册"
        description="创建一个新的个人账号。根据你的 Supabase 项目设置，注册后可能需要先完成邮箱确认。"
        submitLabel="注册"
        accentLabel="第三步认证"
        alternateHref="/login"
        alternateLabel="已有账号？去登录"
        searchParams={params}
      />
    </PublicShell>
  );
}
