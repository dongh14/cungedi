"use server";

import { redirect } from "next/navigation";
import type { RestaurantPrivacy } from "@/lib/restaurants/constants";
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

function buildNewRestaurantRedirect(
  values: {
    name: string;
    city: string;
    sourceInput: string;
    privacy: string;
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
    cuisine: values.cuisine,
    privacy: values.privacy,
    note: values.note,
  });
}

function parseRestaurantForm(formData: FormData): RestaurantInsertInput {
  const name = getFormValue(formData, "name");
  const city = getFormValue(formData, "city");
  const sourceInput = getFormValue(formData, "source_url");
  const privacy = getFormValue(formData, "privacy");
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

  if (!name || !city || !sourceInput || !privacy) {
    redirectToDraft("请先填写所有必填项：餐厅名称、城市、来源输入和可见范围。");
  }

  const sourceUrl = extractFirstHttpUrl(sourceInput);

  if (!sourceUrl) {
    redirectToDraft("请粘贴有效的链接，或包含有效链接的分享文案");
  }

  const parsedPrivacy = getPrivacyValue(privacy);

  if (!parsedPrivacy) {
    redirectToDraft("可见范围只支持 private 或 public。");
  }

  const finalSourceUrl = sourceUrl as string;
  const finalPrivacy = parsedPrivacy as RestaurantPrivacy;

  return {
    name,
    city,
    sourceUrl: finalSourceUrl,
    privacy: finalPrivacy,
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
  const cuisine = getFormValue(formData, "cuisine");
  const note = getFormValue(formData, "note");
  const restaurantId = Number(restaurantIdValue);
  const values = {
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

  return {
    id: restaurantId,
    privacy,
    cuisine: normalizeOptionalField(cuisine),
    note: normalizeOptionalField(note),
  };
}

function parseSourceIntakeForm(formData: FormData) {
  const sourceInput = getFormValue(formData, "source_input");
  const values = {
    sourceInput,
  };

  if (!sourceInput) {
    redirect(
      buildSourceIntakeRedirect(values, {
        sourceError: "请先粘贴有效的链接，或包含有效链接的分享文案",
      }),
    );
  }

  const sourceUrl = extractFirstHttpUrl(sourceInput);

  if (!sourceUrl) {
    redirect(
      buildSourceIntakeRedirect(values, {
        sourceError: "请先粘贴有效的链接，或包含有效链接的分享文案",
      }),
    );
  }

  return {
    sourceInput,
    sourceUrl,
  };
}

export async function createRestaurantAction(formData: FormData) {
  const restaurant = parseRestaurantForm(formData);
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(buildRedirect("/login", { error: "请先登录后再创建餐厅。" }));
  }

  const { data, error } = await supabase
    .from("restaurants")
    .insert({
      user_id: user.id,
      name: restaurant.name,
      city: restaurant.city,
      source_url: restaurant.sourceUrl,
      privacy: restaurant.privacy,
      address: restaurant.address,
      cuisine: restaurant.cuisine,
      note: restaurant.note,
    })
    .select("id")
    .single();

  if (error || !data) {
    const redirectValues = {
      name: restaurant.name,
      city: restaurant.city,
      sourceInput: restaurant.sourceUrl,
      privacy: restaurant.privacy,
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
      message: "餐厅已成功保存。",
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
    redirect(buildRedirect("/login", { error: "请先登录后再编辑餐厅。" }));
  }

  const { data, error } = await supabase
    .from("restaurants")
    .update({
      cuisine: restaurant.cuisine,
      note: restaurant.note,
      privacy: restaurant.privacy,
    })
    .eq("id", restaurant.id)
    .select("id")
    .single();

  if (error || !data) {
    redirect(
      buildEditRestaurantRedirect(
        restaurant.id,
        {
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
      message: "餐厅信息已更新",
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
