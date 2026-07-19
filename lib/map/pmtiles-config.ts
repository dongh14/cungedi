const defaultPmtilesPublicPath = "/maps/base.pmtiles";

export type PmtilesBasemapConfig =
  | {
      status: "ready";
      publicPath: string;
      requestUrl: string;
      sourceUrl: string;
      storage: "local" | "remote";
    }
  | {
      status: "config-error";
      publicPath: string;
      reason: "invalid-url" | "invalid-public-path" | "missing-production-url" | "insecure-production-url";
    };

type PmtilesResolverOptions = {
  origin?: string;
  configuredUrl?: string;
  localPath?: string;
  environment?: string;
};

function getConfiguredUrl(options: PmtilesResolverOptions) {
  return options.configuredUrl ?? process.env.NEXT_PUBLIC_PMTILES_URL;
}

function getLocalPath(options: PmtilesResolverOptions) {
  return options.localPath ?? process.env.NEXT_PUBLIC_PM_TILES_BASEMAP_PATH ?? defaultPmtilesPublicPath;
}

function getLocalRequestUrl(path: string, origin?: string) {
  if (!origin) {
    return path;
  }

  return new URL(path, origin).toString();
}

export function getPmtilesUrl(options: PmtilesResolverOptions = {}) {
  const configured = getConfiguredUrl(options)?.trim();
  const environment = options.environment ?? process.env.NODE_ENV;

  if (configured) {
    let url: URL;

    try {
      url = new URL(configured);
    } catch {
      throw new Error("NEXT_PUBLIC_PMTILES_URL must be a valid URL.");
    }

    if (environment === "production" && url.protocol !== "https:") {
      throw new Error("NEXT_PUBLIC_PMTILES_URL must use HTTPS in production.");
    }

    return url.toString();
  }

  if (environment === "production") {
    throw new Error("NEXT_PUBLIC_PMTILES_URL is required in production.");
  }

  const localPath = getLocalPath(options).trim() || defaultPmtilesPublicPath;

  if (!localPath.startsWith("/")) {
    throw new Error("NEXT_PUBLIC_PM_TILES_BASEMAP_PATH must use a public path starting with /.");
  }

  return getLocalRequestUrl(localPath, options.origin);
}

export function resolvePmtilesBasemapConfig(
  options: PmtilesResolverOptions = {},
): PmtilesBasemapConfig {
  const configured = getConfiguredUrl(options)?.trim();
  const localPath = getLocalPath(options).trim() || defaultPmtilesPublicPath;
  const environment = options.environment ?? process.env.NODE_ENV;

  try {
    const requestUrl = getPmtilesUrl(options);
    const storage = configured ? "remote" : "local";

    return {
      status: "ready",
      publicPath: configured || localPath,
      requestUrl,
      sourceUrl: `pmtiles://${requestUrl}`,
      storage,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "";

    let reason: Extract<PmtilesBasemapConfig, { status: "config-error" }>["reason"];
    if (message.includes("required in production")) {
      reason = "missing-production-url";
    } else if (message.includes("HTTPS in production")) {
      reason = "insecure-production-url";
    } else if (message.includes("public path")) {
      reason = "invalid-public-path";
    } else {
      reason = "invalid-url";
    }

    return {
      status: "config-error",
      publicPath: configured || localPath,
      reason,
    };
  }
}

export function createPmtilesMissingFileMessage(publicPath: string) {
  return `未找到本地 PMTiles 底图文件，请把底图文件放到 ${publicPath} 后再刷新页面。`;
}

export function createPmtilesConfigErrorMessage(
  publicPath: string,
  reason?: Extract<PmtilesBasemapConfig, { status: "config-error" }>["reason"],
) {
  if (reason === "missing-production-url") {
    return "生产环境缺少 NEXT_PUBLIC_PMTILES_URL，请配置公开的 HTTPS PMTiles 地址后再部署。";
  }

  if (reason === "insecure-production-url") {
    return "生产环境的 NEXT_PUBLIC_PMTILES_URL 必须使用 HTTPS。";
  }

  if (reason === "invalid-url") {
    return `PMTiles 地址配置无效：${publicPath}。请使用完整的公开 URL。`;
  }

  return `PMTiles 路径配置无效：${publicPath}。请使用以 / 开头的本地 public 路径。`;
}

export function createPmtilesRemoteFailureMessage() {
  return "远程地图底图暂时无法加载，请检查 PMTiles 公共地址和跨域 Range 请求后重试。";
}
