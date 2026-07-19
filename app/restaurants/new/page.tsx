import { AppShell } from "@/components/app-shell";
import { AddMethodChooser } from "@/components/add-method-chooser";
import { requireAuthenticatedUser } from "@/lib/auth/require-user";

type NewRestaurantPageProps = {
  searchParams?: Promise<{ message?: string }>;
};

export default async function NewRestaurantPage({
  searchParams,
}: NewRestaurantPageProps) {
  const user = await requireAuthenticatedUser();
  const params = (await searchParams) ?? {};

  return (
    <AppShell
      currentPath="/restaurants/new"
      eyebrow="添加地点"
      title="添加地点"
      description="选择一种方式开始。"
      userEmail={user.email}
      userId={user.userId}
      message={params.message}
    >
      <AddMethodChooser />
    </AppShell>
  );
}
