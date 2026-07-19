import { notFound } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { CollectionMembershipCard } from "@/components/collection-membership-card";
import { DeleteRestaurantButton } from "@/components/delete-restaurant-button";
import { RestaurantEditFormCard } from "@/components/restaurant-edit-form-card";
import { requireAuthenticatedUser } from "@/lib/auth/require-user";
import {
  getCurrentUserCollectionIdsForRestaurant,
  getCurrentUserCollectionOptions,
  getCurrentUserRestaurantById,
} from "@/lib/restaurants/queries";

type EditRestaurantPageProps = {
  params: Promise<{
    id: string;
  }>;
  searchParams?: Promise<{
    error?: string;
    message?: string;
    collection_error?: string;
    collection_message?: string;
    category?: string;
    cuisine?: string;
    name?: string;
    city?: string;
    country?: string;
    district?: string;
    address?: string;
    latitude?: string;
    longitude?: string;
    note?: string;
  }>;
};

export default async function EditRestaurantPage({
  params,
  searchParams,
}: EditRestaurantPageProps) {
  const user = await requireAuthenticatedUser();
  const routeParams = await params;
  const resolvedSearchParams = (await searchParams) ?? {};
  const restaurantId = Number(routeParams.id);

  if (!Number.isInteger(restaurantId) || restaurantId <= 0) {
    notFound();
  }

  const { restaurant, error } = await getCurrentUserRestaurantById(restaurantId);
  const { collections: collectionOptions, error: collectionsError } =
    await getCurrentUserCollectionOptions();
  const { collectionIds, error: collectionIdsError } =
    await getCurrentUserCollectionIdsForRestaurant(restaurantId);

  if (error) {
    return (
      <AppShell
        currentPath="/restaurants"
        eyebrow=""
        title="编辑地点"
        description=""
        userEmail={user.email}
        userId={user.userId}
        topbarVariant="back"
        hidePageHeading
      >
        <div className="edit-state-card" role="alert">
          暂时无法读取地点，请稍后再试
        </div>
      </AppShell>
    );
  }

  if (!restaurant) {
    return (
      <AppShell
        currentPath="/restaurants"
        eyebrow=""
        title="编辑地点"
        description=""
        userEmail={user.email}
        userId={user.userId}
        topbarVariant="back"
        hidePageHeading
      >
        <div className="edit-state-card" role="alert">
          找不到这个地点
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell
      currentPath="/restaurants"
      eyebrow=""
      title="编辑地点"
      description=""
      userEmail={user.email}
      userId={user.userId}
      topbarVariant="back"
      topbarActions={<DeleteRestaurantButton restaurantId={restaurant.id} />}
      hidePageHeading
    >
      <div className="edit-page-stack">
        <RestaurantEditFormCard
          restaurant={restaurant}
          searchParams={resolvedSearchParams}
        />

        <CollectionMembershipCard
          restaurantId={restaurant.id}
          collectionOptions={collectionOptions}
          selectedCollectionIds={collectionIds}
          message={resolvedSearchParams.collection_message}
          error={resolvedSearchParams.collection_error ?? (collectionsError || collectionIdsError ? "暂时无法读取合集，请稍后再试" : undefined)}
        />
      </div>
    </AppShell>
  );
}
