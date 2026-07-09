import { createSupabaseClient } from "@/lib/supabase/client";
import { getSupabaseProjectRef, getSupabasePublicEnv } from "@/lib/supabase/env";

export type SupabaseSetupStatus = {
  configured: boolean;
  reachable: boolean;
  projectRef: string | null;
  url: string | null;
  httpStatus: number | null;
  message: string;
  details: string;
};

export async function getSupabaseSetupStatus(): Promise<SupabaseSetupStatus> {
  const env = getSupabasePublicEnv();

  if (!env) {
    return {
      configured: false,
      reachable: false,
      projectRef: null,
      url: null,
      httpStatus: null,
      message: "尚未配置 Supabase 环境变量",
      details:
        "请先在 .env.local 中设置 NEXT_PUBLIC_SUPABASE_URL 和 NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY。",
    };
  }

  const supabase = createSupabaseClient();

  if (!supabase) {
    return {
      configured: false,
      reachable: false,
      projectRef: null,
      url: env.url,
      httpStatus: null,
      message: "Supabase 客户端初始化失败",
      details: "请检查环境变量是否完整并重新启动应用。",
    };
  }

  try {
    const response = await fetch(`${env.url}/auth/v1/settings`, {
      method: "GET",
      headers: {
        apikey: env.publishableKey,
        Authorization: `Bearer ${env.publishableKey}`,
      },
      cache: "no-store",
    });

    if (!response.ok) {
      return {
        configured: true,
        reachable: false,
        projectRef: getSupabaseProjectRef(env.url),
        url: env.url,
        httpStatus: response.status,
        message: "已检测到 Supabase 配置，但连接检查未通过",
        details: `应用已联系到 Supabase 端点，但返回了 HTTP ${response.status}。请确认项目地址和 publishable key 是否正确。`,
      };
    }

    return {
      configured: true,
      reachable: true,
      projectRef: getSupabaseProjectRef(env.url),
      url: env.url,
      httpStatus: response.status,
      message: "Supabase 连接正常",
      details: "应用已成功读取 Supabase 的公开认证设置，可以继续进入后续步骤。",
    };
  } catch (error) {
    const details =
      error instanceof Error ? error.message : "发生了未知连接错误。";

    return {
      configured: true,
      reachable: false,
      projectRef: getSupabaseProjectRef(env.url),
      url: env.url,
      httpStatus: null,
      message: "已检测到 Supabase 配置，但当前无法连通",
      details,
    };
  }
}
