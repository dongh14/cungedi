import { signUpAction } from "@/app/auth/actions";
import { AuthCard } from "@/components/auth-card";
import { PlaceholderCard } from "@/components/placeholder-card";
import { PublicShell } from "@/components/public-shell";

type SignUpPageProps = {
  searchParams?: Promise<{
    error?: string;
    message?: string;
  }>;
};

export default async function SignUpPage({ searchParams }: SignUpPageProps) {
  const params = (await searchParams) ?? {};

  return (
    <PublicShell
      eyebrow="账号入口"
      title="先创建账号，再开始搭建你的旅行餐厅收藏"
      description="注册页与登录页现在共享同一套移动端优先视觉风格。后续步骤会在这个基础上接入真正的录入、列表和地图能力。"
      aside={
        <PlaceholderCard
          title="注册后的下一站"
          description="如果当前 Supabase 项目允许自动登录，你会直接进入受保护的总览页；如果开启了邮箱确认，就先完成邮箱确认再登录。"
          items={[
            "登录与注册页面都保持简体中文可见文案。",
            "English 作为后续次级选项预留。",
            "当前不加入额外翻译系统，避免超出 Step 6 范围。",
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
