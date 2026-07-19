import { logoutAction } from "@/app/auth/actions";
import { AppShell } from "@/components/app-shell";
import { requireAuthenticatedUser } from "@/lib/auth/require-user";

export default async function AccountPage() {
  const user = await requireAuthenticatedUser();

  return (
    <AppShell
      currentPath="/account"
      eyebrow="我的"
      title="账号"
      description="管理你的个人使用状态。"
      userEmail={user.email}
      userId={user.userId}
    >
      <section className="account-page-card" aria-labelledby="account-title">
        <h2 id="account-title">个人账号</h2>
        <p>{user.email ?? "已登录用户"}</p>
        <form action={logoutAction}>
          <button type="submit" className="secondary-button">退出登录</button>
        </form>
      </section>
    </AppShell>
  );
}
