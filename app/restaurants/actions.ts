"use server";

import { redirect } from "next/navigation";
import {
  diffRestaurantCollectionMemberships,
  normalizeSelectedCollectionIds,
} from "@/lib/restaurants/collection-memberships";
import {
  isRestaurantCategory,
  normalizePlaceCategory,
  personalOnlyPrivacy,
  type RestaurantCategory,
} from "@/lib/restaurants/constants";
import {
  buildRestaurantInsertPayload,
  buildRestaurantUpdatePayload,
} from "@/lib/restaurants/record-payloads";
import {
  appendAIReviewDraftState,
  parseAIReviewDraftState,
  type AIReviewDraftState,
} from "@/lib/restaurants/ai-review-state";
import { parseSourceIntakeInput } from "@/lib/restaurants/source-intake";
import { extractFirstHttpUrl } from "@/lib/restaurants/source-url";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { logWorkflowDiagnostic } from "@/lib/restaurants/workflow-diagnostics";
import { isValidLatitude, isValidLongitude } from "@/lib/map/place-location";
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

function getRawFormValue(formData: FormData, key: string) {
  return formData.get(key)?.toString() ?? "";
}

function normalizeOptionalField(value: string) {
  return value ? value : null;
}

function getCategoryValue(value: string): RestaurantCategory | null {
  return isRestaurantCategory(value) ? normalizePlaceCategory(value) : null;
}

function buildNewRestaurantRedirect(
  values: {
    name: string;
    city: string;
    country: string;
    district: string;
    sourceInput: string;
    privacy: string;
    category: string;
    address: string;
    cuisine: string;
    note: string;
  },
  error: string,
) {
  return buildRedirect("/restaurants/new/manual", {
    error,
    name: values.name,
    city: values.city,
    country: values.country,
    district: values.district,
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
    country: string;
    district: string;
    sourceInput: string;
    privacy: string;
    category: string;
    address: string;
    cuisine: string;
    note: string;
    collectionIds: number[];
    manualEvidence?: string;
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
    country: values.country,
    district: values.district,
    source_input: values.sourceInput,
    privacy: values.privacy,
    category: values.category,
    address: values.address,
    cuisine: values.cuisine,
    note: values.note,
    ...(values.collectionIds.length > 0
      ? { collection_ids: values.collectionIds.join(",") }
      : {}),
    ...(values.manualEvidence ? { manual_evidence: values.manualEvidence } : {}),
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
  return buildRedirect("/restaurants/new/source", {
    ...(state.sourceError ? { source_error: state.sourceError } : {}),
    ...(state.sourceMessage ? { source_message: state.sourceMessage } : {}),
    intake_input: values.sourceInput,
  });
}

function buildEditRestaurantRedirect(
  restaurantId: number,
  values: {
    name: string;
    city: string;
    category: string;
    cuisine: string;
    country: string;
    district: string;
    address: string;
    latitude: string;
    longitude: string;
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
    name: values.name,
    city: values.city,
    category: values.category,
    cuisine: values.cuisine,
    country: values.country,
    district: values.district,
    address: values.address,
    latitude: values.latitude,
    longitude: values.longitude,
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

function buildReviewCollectionRedirect(
  sourceUrl: string,
  state: {
    error?: string;
    message?: string;
    aiDraftState?: AIReviewDraftState | null;
    draftValues?: Record<string, string>;
    manualEvidence?: string;
    sourceInput?: string;
    collectionIds?: number[];
  },
) {
  const params = new URLSearchParams({ source_url: sourceUrl });

  if (state.error) {
    params.set("collection_error", state.error);
  }

  if (state.message) {
    params.set("collection_message", state.message);
  }

  if (state.manualEvidence) {
    params.set("manual_evidence", state.manualEvidence);
  }

  if (state.sourceInput) {
    params.set("source_input", state.sourceInput);
  }

  if (state.collectionIds && state.collectionIds.length > 0) {
    params.set("collection_ids", state.collectionIds.join(","));
  }

  for (const [field, value] of Object.entries(state.draftValues ?? {})) {
    params.set(field, value);
  }

  if (state.aiDraftState) {
    return `/restaurants/review?${appendAIReviewDraftState(params, state.aiDraftState).toString()}`;
  }

  return `/restaurants/review?${params.toString()}`;
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
  const country = getFormValue(formData, "country");
  const district = getFormValue(formData, "district");
  const sourceInput = getRawFormValue(formData, "source_url");
  const privacy = personalOnlyPrivacy;
  const category = getFormValue(formData, "category");
  const address = getFormValue(formData, "address");
  const cuisine = getFormValue(formData, "cuisine");
  const note = getFormValue(formData, "note");
  const manualEvidence = getFormValue(formData, "manual_evidence");
  const collectionIds = normalizeSelectedCollectionIds(
    formData.getAll("collection_ids").map((value) => value.toString()),
  );
  const returnTo = getFormValue(formData, "return_to");
  const reviewSourceInput = getFormValue(formData, "review_source_url");
  const reviewSourceUrl =
    extractFirstHttpUrl(reviewSourceInput) ?? extractFirstHttpUrl(sourceInput);
  const values = {
    name,
    city,
    country,
    district,
    sourceInput,
    privacy,
    category,
    address,
    cuisine,
    note,
    collectionIds,
    manualEvidence,
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

  if (!name || !city || !sourceInput || !category) {
    redirectToDraft("请先填写所有必填项：地点名称、城市、来源输入和分类。");
  }

  const sourceUrl = extractFirstHttpUrl(sourceInput);

  if (!sourceUrl) {
    redirectToDraft("请粘贴有效的链接，或包含有效链接的分享文案");
  }

  const parsedCategory = getCategoryValue(category);

  if (!parsedCategory) {
      redirectToDraft("分类只支持 美食、景点、住宿、购物、娱乐、其他。");
  }

  const finalSourceUrl = sourceUrl as string;
  const finalCategory = parsedCategory as RestaurantCategory;

  return {
    name,
    city,
    country: normalizeOptionalField(country),
    district: normalizeOptionalField(district),
    sourceUrl: finalSourceUrl,
    privacy: personalOnlyPrivacy,
    category: finalCategory,
    address: normalizeOptionalField(address),
    cuisine: normalizeOptionalField(cuisine),
    note: normalizeOptionalField(note),
    collectionIds,
    returnTo: returnTo === "review" ? "review" : "new",
    reviewSourceUrl: reviewSourceUrl || finalSourceUrl,
    manualEvidence,
    intakeInput: sourceInput,
  };
}

function parseRestaurantUpdateForm(formData: FormData): RestaurantUpdateInput {
  const restaurantIdValue = getFormValue(formData, "restaurant_id");
  const privacy = personalOnlyPrivacy;
  const name = getFormValue(formData, "name");
  const city = getFormValue(formData, "city");
  const country = getFormValue(formData, "country");
  const district = getFormValue(formData, "district");
  const address = getFormValue(formData, "address");
  const latitudeInput = getFormValue(formData, "latitude");
  const longitudeInput = getFormValue(formData, "longitude");
  const category = getFormValue(formData, "category");
  const cuisine = getFormValue(formData, "cuisine");
  const note = getFormValue(formData, "note");
  const restaurantId = Number(restaurantIdValue);
  const values = {
    name,
    city,
    category,
    cuisine,
    country,
    district,
    address,
    latitude: latitudeInput,
    longitude: longitudeInput,
    privacy,
    note,
  };

  if (!Number.isInteger(restaurantId) || restaurantId <= 0) {
    redirect("/restaurants");
  }

  if (!name || !city) {
    redirect(
      buildEditRestaurantRedirect(restaurantId, values, {
        error: "请填写地点名称和城市。",
      }),
    );
  }

  const latitude = latitudeInput ? Number(latitudeInput) : null;
  const longitude = longitudeInput ? Number(longitudeInput) : null;

  if (
    (latitude !== null && !isValidLatitude(latitude)) ||
    (longitude !== null && !isValidLongitude(longitude)) ||
    (latitudeInput && !longitudeInput) ||
    (!latitudeInput && longitudeInput)
  ) {
    redirect(
      buildEditRestaurantRedirect(restaurantId, values, {
        error: "请输入有效且完整的纬度和经度，或留空使用区域位置。",
      }),
    );
  }

  const parsedCategory = getCategoryValue(category);

  if (!parsedCategory) {
    redirect(
      buildEditRestaurantRedirect(restaurantId, values, {
        error: "分类只支持 美食、景点、住宿、购物、娱乐、其他；旧数据中的玩乐仍然兼容。",
      }),
    );
  }

  return {
    id: restaurantId,
    name,
    city,
    country: normalizeOptionalField(country),
    district: normalizeOptionalField(district),
    privacy,
    category: parsedCategory,
    address: normalizeOptionalField(address),
    latitude,
    longitude,
    cuisine: normalizeOptionalField(cuisine),
    note: normalizeOptionalField(note),
  };
}

function parseSourceIntakeForm(formData: FormData) {
  const sourceInput = getRawFormValue(formData, "source_input");
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
    normalizedInput: result.normalizedInput,
  };
}

function parseReviewDraftForm(formData: FormData) {
  const sourceInput = getRawFormValue(formData, "source_url");
  const name = getFormValue(formData, "name");
  const city = getFormValue(formData, "city");
  const country = getFormValue(formData, "country");
  const district = getFormValue(formData, "district");
  const privacy = personalOnlyPrivacy;
  const category = getFormValue(formData, "category");
  const address = getFormValue(formData, "address");
  const cuisine = getFormValue(formData, "cuisine");
  const note = getFormValue(formData, "note");
  const collectionIds = normalizeSelectedCollectionIds(
    formData.getAll("collection_ids").map((value) => value.toString()),
  );
  const intakeResult = parseSourceIntakeInput(sourceInput);

  const redirectValues = {
    name,
    city,
    country,
    district,
    sourceInput,
    privacy,
    category,
    address,
    cuisine,
    note,
    collectionIds,
  };

  if (!intakeResult.ok) {
    redirect(buildNewRestaurantRedirect(redirectValues, intakeResult.error));
  }

  return {
    sourceUrl: intakeResult.intake.sourceUrl,
    values: {
      ...redirectValues,
      sourceInput,
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
    logWorkflowDiagnostic({ event: "save_failed" });
    const safeSaveError = "保存失败，请重试";
    const redirectValues = {
      name: restaurant.name,
      city: restaurant.city,
      country: restaurant.country ?? "",
      district: restaurant.district ?? "",
      sourceInput: restaurant.intakeInput ?? restaurant.sourceUrl,
      privacy: restaurant.privacy,
      category: restaurant.category,
      address: restaurant.address ?? "",
      cuisine: restaurant.cuisine ?? "",
      note: restaurant.note ?? "",
      collectionIds: restaurant.collectionIds ?? [],
      manualEvidence: restaurant.manualEvidence ?? "",
    };

    if (restaurant.returnTo === "review" && restaurant.reviewSourceUrl) {
      redirect(
        buildReviewRestaurantRedirect(
          {
            sourceUrl: restaurant.reviewSourceUrl,
            ...redirectValues,
          },
          {
            error: safeSaveError,
          },
        ),
      );
    }

    redirect(buildNewRestaurantRedirect(redirectValues, safeSaveError));
  }

  if (restaurant.collectionIds && restaurant.collectionIds.length > 0) {
    const { error: collectionError } = await supabase
      .from("restaurant_collections")
      .insert(
        restaurant.collectionIds.map((collectionId) => ({
          restaurant_id: data.id,
          collection_id: collectionId,
        })),
      );

    if (collectionError) {
      redirect(
        buildRedirect("/restaurants", {
          message: `地点已保存，但合集归类失败：${collectionError.message}`,
          created: String(data.id),
        }),
      );
    }
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
    logWorkflowDiagnostic({ event: "save_failed" });
    redirect(
      buildEditRestaurantRedirect(
        restaurant.id,
        {
          name: restaurant.name ?? "",
          city: restaurant.city ?? "",
          category: restaurant.category,
          country: restaurant.country ?? "",
          district: restaurant.district ?? "",
          address: restaurant.address ?? "",
          latitude: restaurant.latitude === null ? "" : String(restaurant.latitude),
          longitude: restaurant.longitude === null ? "" : String(restaurant.longitude),
          cuisine: restaurant.cuisine ?? "",
          privacy: restaurant.privacy,
          note: restaurant.note ?? "",
        },
        {
          error: "保存失败，请重试",
        },
      ),
    );
  }

  redirect(
    buildRedirect(`/restaurants/${restaurant.id}`, {
      message: "地点信息已更新",
    }),
  );
}

export async function deleteRestaurantAction(formData: FormData) {
  const restaurantId = Number(getFormValue(formData, "restaurant_id"));

  if (!Number.isInteger(restaurantId) || restaurantId <= 0) {
    redirect(buildRedirect("/restaurants", { error: "找不到这个地点" }));
  }

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(buildRedirect("/login", { error: "请先登录后再删除地点。" }));
  }

  const { error } = await supabase
    .from("restaurants")
    .delete()
    .eq("id", restaurantId)
    .eq("user_id", user.id);

  if (error) {
    redirect(buildRedirect(`/restaurants/${restaurantId}/edit`, { error: "删除失败，请重试。" }));
  }

  redirect(buildRedirect("/restaurants", { message: "地点已删除" }));
}

export async function createCollectionAction(formData: FormData) {
  const name = getFormValue(formData, "name");
  const returnTo = getFormValue(formData, "return_to");
  const reviewSourceUrl = extractFirstHttpUrl(getFormValue(formData, "source_url"));
  const sourceInput = getRawFormValue(formData, "source_input");
  const manualEvidence = getFormValue(formData, "manual_evidence");
  const collectionIds = normalizeSelectedCollectionIds(
    formData.getAll("collection_ids").map((value) => value.toString()),
  );
  const aiDraftState = parseAIReviewDraftState({
    ai_snapshot: formData.getAll("ai_snapshot").map((value) => value.toString()),
    ai_snapshot_confidence: getFormValue(formData, "ai_snapshot_confidence"),
    ai_snapshot_reason: getFormValue(formData, "ai_snapshot_reason"),
    ai_accepted: formData.getAll("ai_accepted").map((value) => value.toString()),
    ai_reject_factual: getFormValue(formData, "ai_reject_factual"),
    ai_reject_understanding: getFormValue(formData, "ai_reject_understanding"),
  });
  const draftValues = Object.fromEntries(
    ["name", "city", "country", "district", "address", "category", "cuisine", "note"]
      .flatMap((field) => {
        const value = formData.get(`review_${field}`);

        return value === null ? [] : [[field, value.toString()]];
      }),
  );
  const redirectCollectionResult = (state: { error?: string; message?: string }): never => {
    if (returnTo === "review" && reviewSourceUrl) {
      redirect(buildReviewCollectionRedirect(reviewSourceUrl, {
        ...state,
        aiDraftState,
        draftValues,
        sourceInput,
        manualEvidence,
        collectionIds,
      }));
    }

    redirect(buildCollectionsRedirect(state));
  };

  if (!name) {
    redirectCollectionResult({ error: "请先填写合集名称。" });
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
    redirectCollectionResult({ error: error.message ?? "创建合集失败，请稍后重试。" });
  }

  redirectCollectionResult({ message: "合集已创建，请选择后再保存地点。" });
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
  const { sourceUrl, normalizedInput } = parseSourceIntakeForm(formData);

  logWorkflowDiagnostic({
    event: "intake_started",
    sourceUrls: [sourceUrl],
  });

  redirect(
    buildRedirect("/restaurants/review", {
      source_url: sourceUrl,
      source_input: normalizedInput.rawInput,
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
