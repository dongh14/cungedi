"use server";

import { redirect } from "next/navigation";
import {
  diffRestaurantCollectionMemberships,
  normalizeSelectedCollectionIds,
} from "@/lib/restaurants/collection-memberships";
import {
  isRestaurantCategory,
  type RestaurantCategory,
  type RestaurantPrivacy,
} from "@/lib/restaurants/constants";
import {
  buildRestaurantInsertPayload,
  buildRestaurantUpdatePayload,
} from "@/lib/restaurants/record-payloads";
import { parseSourceIntakeInput } from "@/lib/restaurants/source-intake";
import { extractFirstHttpUrl } from "@/lib/restaurants/source-url";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type {
  RestaurantInsertInput,
  RestaurantUpdateInput,
} from "@/lib/restaurants/types";

function buildRedirect(pathname: string, params: Record<string, string>) {
  const searchParams = new URLSearchParams(params);
  const query = searchParams.toString();

  return query ? `${pathname}?${query}` : pathname;
}

function getFormValue(formData: FormData, key: string) {
  return formData.get(key)?.toString().trim() ?? "";
}

function normalizeOptionalField(value: string) {
  return value ? value : null;
}

function getPrivacyValue(value: string): RestaurantPrivacy | null {
  if (value === "private" || value === "public") {
    return value;
  }

  return null;
}

function getCategoryValue(value: string): RestaurantCategory | null {
  if (isRestaurantCategory(value)) {
    return value;
  }

  return null;
}

function buildNewRestaurantRedirect(
  values: {
    name: string;
    city: string;
    sourceInput: string;
    privacy: string;
    category: string;
    address: string;
    cuisine: string;
    note: string;
  },
  error: string,
) {
  return buildRedirect("/restaurants/new", {
    error,
    name: values.name,
    city: values.city,
    source_input: values.sourceInput,
    privacy: values.privacy,
    category: values.category,
    address: values.address,
    cuisine: values.cuisine,
    note: values.note,
  });
}

function buildReviewRestaurantRedirect(
  values: {
    sourceUrl: string;
    name: string;
    city: string;
    sourceInput: string;
    privacy: string;
    category: string;
    address: string;
    cuisine: string;
    note: string;
  },
  state: {
    error?: string;
    message?: string;
  },
) {
  return buildRedirect("/restaurants/review", {
    source_url: values.sourceUrl,
    ...(state.error ? { error: state.error } : {}),
    ...(state.message ? { message: state.message } : {}),
    name: values.name,
    city: values.city,
    source_input: values.sourceInput,
    privacy: values.privacy,
    category: values.category,
    address: values.address,
    cuisine: values.cuisine,
    note: values.note,
  });
}

function buildSourceIntakeRedirect(
  values: {
    sourceInput: string;
  },
  state: {
    sourceError?: string;
    sourceMessage?: string;
  },
) {
  return buildRedirect("/restaurants/new", {
    ...(state.sourceError ? { source_error: state.sourceError } : {}),
    ...(state.sourceMessage ? { source_message: state.sourceMessage } : {}),
    intake_input: values.sourceInput,
  });
}

function buildEditRestaurantRedirect(
  restaurantId: number,
  values: {
    category: string;
    cuisine: string;
    privacy: string;
    note: string;
  },
  state: {
    error?: string;
    message?: string;
  },
) {
  return buildRedirect(`/restaurants/${restaurantId}/edit`, {
    ...(state.error ? { error: state.error } : {}),
    ...(state.message ? { message: state.message } : {}),
    category: values.category,
    cuisine: values.cuisine,
    privacy: values.privacy,
    note: values.note,
  });
}

function buildCollectionsRedirect(state: {
  error?: string;
  message?: string;
}) {
  return buildRedirect("/collections", {
    ...(state.error ? { error: state.error } : {}),
    ...(state.message ? { message: state.message } : {}),
  });
}

function buildEditRestaurantCollectionsRedirect(
  restaurantId: number,
  state: {
    collectionError?: string;
    collectionMessage?: string;
  },
) {
  return buildRedirect(`/restaurants/${restaurantId}/edit`, {
    ...(state.collectionError ? { collection_error: state.collectionError } : {}),
    ...(state.collectionMessage ? { collection_message: state.collectionMessage } : {}),
  });
}

function parseRestaurantForm(formData: FormData): RestaurantInsertInput {
  const name = getFormValue(formData, "name");
  const city = getFormValue(formData, "city");
  const sourceInput = getFormValue(formData, "source_url");
  const privacy = getFormValue(formData, "privacy");
  const category = getFormValue(formData, "category");
  const address = getFormValue(formData, "address");
  const cuisine = getFormValue(formData, "cuisine");
  const note = getFormValue(formData, "note");
  const returnTo = getFormValue(formData, "return_to");
  const reviewSourceInput = getFormValue(formData, "review_source_url");
  const reviewSourceUrl =
    extractFirstHttpUrl(reviewSourceInput) ?? extractFirstHttpUrl(sourceInput);
  const values = {
    name,
    city,
    sourceInput,
    privacy,
    category,
    address,
    cuisine,
    note,
  };
  const redirectToDraft = (error: string): never => {
    if (returnTo === "review" && reviewSourceUrl) {
      redirect(
        buildReviewRestaurantRedirect(
          {
            sourceUrl: reviewSourceUrl,
            ...values,
          },
          { error },
        ),
      );
    }

    redirect(buildNewRestaurantRedirect(values, error));
  };

  if (!name || !city || !sourceInput || !privacy || !category) {
    redirectToDraft("请先填写所有必填项：地点名称、城市、来源输入、分类和可见范围。");
  }

  const sourceUrl = extractFirstHttpUrl(sourceInput);

  if (!sourceUrl) {
    redirectToDraft("请粘贴有效的链接，或包含有效链接的分享文案");
  }

  const parsedPrivacy = getPrivacyValue(privacy);

  if (!parsedPrivacy) {
    redirectToDraft("可见范围只支持 private 或 public。");
  }

  const parsedCategory = getCategoryValue(category);

  if (!parsedCategory) {
    redirectToDraft("分类只支持 美食、购物、玩乐、景点、住宿、其他。");
  }

  const finalSourceUrl = sourceUrl as string;
  const finalPrivacy = parsedPrivacy as RestaurantPrivacy;
  const finalCategory = parsedCategory as RestaurantCategory;

  return {
    name,
    city,
    sourceUrl: finalSourceUrl,
    privacy: finalPrivacy,
    category: finalCategory,
    address: normalizeOptionalField(address),
    cuisine: normalizeOptionalField(cuisine),
    note: normalizeOptionalField(note),
    returnTo: returnTo === "review" ? "review" : "new",
    reviewSourceUrl: reviewSourceUrl || finalSourceUrl,
  };
}

function parseRestaurantUpdateForm(formData: FormData): RestaurantUpdateInput {
  const restaurantIdValue = getFormValue(formData, "restaurant_id");
  const privacy = getFormValue(formData, "privacy");
  const category = getFormValue(formData, "category");
  const cuisine = getFormValue(formData, "cuisine");
  const note = getFormValue(formData, "note");
  const restaurantId = Number(restaurantIdValue);
  const values = {
    category,
    cuisine,
    privacy,
    note,
  };

  if (!Number.isInteger(restaurantId) || restaurantId <= 0) {
    redirect("/restaurants");
  }

  if (privacy !== "private" && privacy !== "public") {
    redirect(
      buildEditRestaurantRedirect(restaurantId, values, {
        error: "可见范围只支持 private 或 public。",
      }),
    );
  }

  const parsedCategory = getCategoryValue(category);

  if (!parsedCategory) {
    redirect(
      buildEditRestaurantRedirect(restaurantId, values, {
        error: "分类只支持 美食、购物、玩乐、景点、住宿、其他。",
      }),
    );
  }

  return {
    id: restaurantId,
    privacy,
    category: parsedCategory,
    cuisine: normalizeOptionalField(cuisine),
    note: normalizeOptionalField(note),
  };
}

function parseSourceIntakeForm(formData: FormData) {
  const sourceInput = getFormValue(formData, "source_input");
  const values = {
    sourceInput,
  };

  const result = parseSourceIntakeInput(sourceInput);

  if (!result.ok) {
    redirect(
      buildSourceIntakeRedirect(values, {
        sourceError: result.error,
      }),
    );
  }

  return {
    sourceInput,
    sourceUrl: result.intake.sourceUrl,
  };
}

function parseReviewDraftForm(formData: FormData) {
  const sourceInput = getFormValue(formData, "source_url");
  const name = getFormValue(formData, "name");
  const city = getFormValue(formData, "city");
  const privacy = getFormValue(formData, "privacy");
  const category = getFormValue(formData, "category");
  const address = getFormValue(formData, "address");
  const cuisine = getFormValue(formData, "cuisine");
  const note = getFormValue(formData, "note");
  const intakeResult = parseSourceIntakeInput(sourceInput);

  const redirectValues = {
    name,
    city,
    sourceInput,
    privacy,
    category,
    address,
    cuisine,
    note,
  };

  if (!intakeResult.ok) {
    redirect(buildNewRestaurantRedirect(redirectValues, intakeResult.error));
  }

  return {
    sourceUrl: intakeResult.intake.sourceUrl,
    values: {
      ...redirectValues,
      sourceInput: intakeResult.intake.sourceUrl,
    },
  };
}

export async function createRestaurantAction(formData: FormData) {
  const restaurant = parseRestaurantForm(formData);
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(buildRedirect("/login", { error: "请先登录后再创建地点。" }));
  }

  const { data, error } = await supabase
    .from("restaurants")
    .insert(buildRestaurantInsertPayload(user.id, restaurant))
    .select("id")
    .single();

  if (error || !data) {
    const redirectValues = {
      name: restaurant.name,
      city: restaurant.city,
      sourceInput: restaurant.sourceUrl,
      privacy: restaurant.privacy,
      category: restaurant.category,
      address: restaurant.address ?? "",
      cuisine: restaurant.cuisine ?? "",
      note: restaurant.note ?? "",
    };

    if (restaurant.returnTo === "review" && restaurant.reviewSourceUrl) {
      redirect(
        buildReviewRestaurantRedirect(
          {
            sourceUrl: restaurant.reviewSourceUrl,
            ...redirectValues,
          },
          {
            error: error?.message ?? "保存失败，请稍后重试。",
          },
        ),
      );
    }

    redirect(buildNewRestaurantRedirect(redirectValues, error?.message ?? "保存失败，请稍后重试。"));
  }

  redirect(
    buildRedirect("/restaurants", {
      message: "地点已成功保存。",
      created: String(data.id),
    }),
  );
}

export async function updateRestaurantAction(formData: FormData) {
  const restaurant = parseRestaurantUpdateForm(formData);
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(buildRedirect("/login", { error: "请先登录后再编辑地点。" }));
  }

  const { data, error } = await supabase
    .from("restaurants")
    .update(buildRestaurantUpdatePayload(restaurant))
    .eq("id", restaurant.id)
    .select("id")
    .single();

  if (error || !data) {
    redirect(
      buildEditRestaurantRedirect(
        restaurant.id,
        {
          category: restaurant.category,
          cuisine: restaurant.cuisine ?? "",
          privacy: restaurant.privacy,
          note: restaurant.note ?? "",
        },
        {
          error: error?.message ?? "更新失败，请稍后重试。",
        },
      ),
    );
  }

  redirect(
    buildRedirect("/restaurants", {
      message: "地点信息已更新",
    }),
  );
}

export async function createCollectionAction(formData: FormData) {
  const name = getFormValue(formData, "name");

  if (!name) {
    redirect(
      buildCollectionsRedirect({
        error: "请先填写合集名称。",
      }),
    );
  }

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(buildRedirect("/login", { error: "请先登录后再创建合集。" }));
  }

  const { error } = await supabase.from("collections").insert({
    user_id: user.id,
    name,
  });

  if (error) {
    redirect(
      buildCollectionsRedirect({
        error: error.message ?? "创建合集失败，请稍后重试。",
      }),
    );
  }

  redirect(
    buildCollectionsRedirect({
      message: "合集已创建",
    }),
  );
}

export async function updateRestaurantCollectionsAction(formData: FormData) {
  const restaurantId = Number(getFormValue(formData, "restaurant_id"));

  if (!Number.isInteger(restaurantId) || restaurantId <= 0) {
    redirect("/restaurants");
  }

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(buildRedirect("/login", { error: "请先登录后再管理合集。" }));
  }

  const selectedCollectionIds = normalizeSelectedCollectionIds(
    formData.getAll("collection_ids").map((value) => value.toString()),
  );

  const { data: currentMemberships, error: currentMembershipsError } = await supabase
    .from("restaurant_collections")
    .select("collection_id")
    .eq("restaurant_id", restaurantId);

  if (currentMembershipsError) {
    redirect(
      buildEditRestaurantCollectionsRedirect(restaurantId, {
        collectionError: currentMembershipsError.message ?? "读取合集归属失败，请稍后重试。",
      }),
    );
  }

  const { toAdd, toRemove } = diffRestaurantCollectionMemberships({
    currentCollectionIds: (currentMemberships ?? []).map((membership) => membership.collection_id),
    nextCollectionIds: selectedCollectionIds,
  });

  if (toAdd.length > 0) {
    const { error } = await supabase.from("restaurant_collections").insert(
      toAdd.map((collectionId) => ({
        restaurant_id: restaurantId,
        collection_id: collectionId,
      })),
    );

    if (error) {
      redirect(
        buildEditRestaurantCollectionsRedirect(restaurantId, {
          collectionError: error.message ?? "更新合集归属失败，请稍后重试。",
        }),
      );
    }
  }

  if (toRemove.length > 0) {
    const { error } = await supabase
      .from("restaurant_collections")
      .delete()
      .eq("restaurant_id", restaurantId)
      .in("collection_id", toRemove);

    if (error) {
      redirect(
        buildEditRestaurantCollectionsRedirect(restaurantId, {
          collectionError: error.message ?? "更新合集归属失败，请稍后重试。",
        }),
      );
    }
  }

  redirect(
    buildEditRestaurantCollectionsRedirect(restaurantId, {
      collectionMessage: "合集归属已更新",
    }),
  );
}

export async function startSourceIntakeAction(formData: FormData) {
  const { sourceUrl } = parseSourceIntakeForm(formData);

  redirect(
    buildRedirect("/restaurants/review", {
      source_url: sourceUrl,
    }),
  );
}

export async function startRestaurantReviewAction(formData: FormData) {
  const { sourceUrl, values } = parseReviewDraftForm(formData);

  redirect(
    buildReviewRestaurantRedirect(
      {
        sourceUrl,
        ...values,
      },
      {},
    ),
  );
}
