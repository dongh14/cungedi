import { AppShell } from "@/components/app-shell";
import { CategorySelector } from "@/components/category-selector";
import { requireAuthenticatedUser } from "@/lib/auth/require-user";

type CategoryPageProps = {
  searchParams?: Promise<{
    return_to?: string;
    category?: string;
  }>;
};

export default async function CategoryPage({ searchParams }: CategoryPageProps) {
  const user = await requireAuthenticatedUser();
  const params = (await searchParams) ?? {};

  return (
    <AppShell
      currentPath="/restaurants/category"
      eyebrow="分类"
      title="选择分类"
      description=""
      userEmail={user.email}
      userId={user.userId}
      topbarVariant="back"
      hidePageHeading
    >
      <CategorySelector returnTo={params.return_to} initialCategory={params.category} />
    </AppShell>
  );
}
