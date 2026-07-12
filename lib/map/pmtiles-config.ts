const defaultPmtilesPublicPath = "/maps/base.pmtiles";

export type LocalPmtilesBasemapConfig =
  | {
      status: "ready";
      publicPath: string;
      sourceUrl: string;
    }
  | {
      status: "config-error";
      publicPath: string;
      reason: "invalid-public-path";
    };

export function resolveLocalPmtilesBasemapConfig(
  rawPath = process.env.NEXT_PUBLIC_PM_TILES_BASEMAP_PATH,
): LocalPmtilesBasemapConfig {
  const trimmedPath = rawPath?.trim() || defaultPmtilesPublicPath;

  if (!trimmedPath.startsWith("/")) {
    return {
      status: "config-error",
      publicPath: trimmedPath,
      reason: "invalid-public-path",
    };
  }

  return {
    status: "ready",
    publicPath: trimmedPath,
    sourceUrl: `pmtiles://${trimmedPath}`,
  };
}

export function createPmtilesMissingFileMessage(publicPath: string) {
  return `未找到本地 PMTiles 底图文件，请把底图文件放到 ${publicPath} 后再刷新页面。`;
}

export function createPmtilesConfigErrorMessage(publicPath: string) {
  return `PMTiles 路径配置无效：${publicPath}。请使用以 / 开头的本地 public 路径。`;
}
