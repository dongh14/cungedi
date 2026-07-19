"use server";

import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getSafeLoginErrorMessage, getSafeSignUpErrorMessage } from "@/lib/auth/login-ui";

function buildRedirect(pathname: string, params: Record<string, string>) {
  const searchParams = new URLSearchParams(params);
  const query = searchParams.toString();

  return query ? `${pathname}?${query}` : pathname;
}

function getFormValue(formData: FormData, key: string) {
  return formData.get(key)?.toString().trim() ?? "";
}

export async function signUpAction(formData: FormData) {
  const email = getFormValue(formData, "email");
  const password = getFormValue(formData, "password");

  if (!email || !password) {
    redirect(buildRedirect("/sign-up", { error: "请输入邮箱和密码。" }));
  }

  if (password.length < 6) {
    redirect(buildRedirect("/sign-up", { error: "密码至少需要 6 位字符。" }));
  }

  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });

  if (error) {
    redirect(buildRedirect("/sign-up", { error: getSafeSignUpErrorMessage(error.message) ?? "注册失败，请检查信息后重试。" }));
  }

  if (data.session) {
    redirect(buildRedirect("/dashboard", { login_success: "1" }));
  }

  redirect(
    buildRedirect("/login", {
      message: "注册成功。若项目启用了邮箱确认，请先完成邮箱确认后再登录。",
    }),
  );
}

export async function loginAction(formData: FormData) {
  const email = getFormValue(formData, "email");
  const password = getFormValue(formData, "password");

  if (!email || !password) {
    redirect(buildRedirect("/login", { error: "请输入邮箱和密码。" }));
  }

  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    redirect(buildRedirect("/login", { error: getSafeLoginErrorMessage(error.message) ?? "邮箱或密码错误，请检查后重试。" }));
  }

  redirect(buildRedirect("/dashboard", { login_success: "1" }));
}

export async function logoutAction() {
  const supabase = await createServerSupabaseClient();

  await supabase.auth.signOut();

  redirect(buildRedirect("/login", { message: "你已退出登录。" }));
}
