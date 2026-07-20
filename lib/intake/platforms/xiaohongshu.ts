const xiaohongshuHosts = new Set([
  "xhslink.com",
  "www.xiaohongshu.com",
  "xiaohongshu.com",
]);

export function isXiaohongshuUrl(value: string) {
  try {
    const hostname = new URL(value).hostname.toLowerCase().replace(/\.$/, "");

    return (
      xiaohongshuHosts.has(hostname) ||
      hostname.endsWith(".xhslink.com") ||
      hostname.endsWith(".xiaohongshu.com")
    );
  } catch {
    return false;
  }
}
