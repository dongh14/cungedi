const douyinHosts = new Set(["v.douyin.com", "www.douyin.com", "douyin.com"]);

export function isDouyinUrl(value: string) {
  try {
    const hostname = new URL(value).hostname.toLowerCase().replace(/\.$/, "");

    return douyinHosts.has(hostname) || hostname.endsWith(".douyin.com");
  } catch {
    return false;
  }
}
