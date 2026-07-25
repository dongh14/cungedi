import assert from "node:assert/strict";
import test from "node:test";
import { fetchSourcePageMetadata } from "@/lib/source-posts/metadata-fetcher";
import { isSafePublicUrl, validateSourcePageMetadata } from "@/lib/source-posts/metadata-schema";

function response(body: string, options: { url?: string; status?: number; contentType?: string; headers?: Record<string, string> } = {}) {
  return new Response(body, {
    status: options.status ?? 200,
    headers: { "content-type": options.contentType ?? "text/html; charset=utf-8", ...options.headers },
  }) as Response & { url: string };
}

test("accepts public source URLs and rejects SSRF or credential targets", () => {
  assert.equal(isSafePublicUrl("https://www.xiaohongshu.com/explore/place"), true);
  assert.equal(isSafePublicUrl("https://www.douyin.com/video/1"), true);
  assert.equal(isSafePublicUrl("https://example.com/place"), true);
  assert.equal(isSafePublicUrl("http://localhost:3000"), false);
  assert.equal(isSafePublicUrl("http://192.168.1.10/place"), false);
  assert.equal(isSafePublicUrl("http://[::1]/place"), false);
  assert.equal(isSafePublicUrl("https://user:password@example.com/place"), false);
  assert.equal(isSafePublicUrl("file:///tmp/page"), false);
  assert.equal(isSafePublicUrl("https://printer.local/page"), false);
});

test("parses only bounded page metadata and resolves safe relative URLs", async () => {
  let requestInit: RequestInit | undefined;
  const result = await fetchSourcePageMetadata("https://example.com/posts/1", "web", {
    fetchImpl: async (_url, init) => {
      requestInit = init;
      return response(`
        <html><head>
          <title>Page title</title>
          <meta name="description" content="Page description" />
          <meta property="og:title" content="Open Graph title" />
          <meta property="og:description" content="Open Graph description" />
          <meta property="og:site_name" content="Example" />
          <meta property="og:image" content="/images/cover.jpg" />
          <link rel="canonical" href="/posts/canonical" />
          <script>document.write('<meta property="og:title" content="secret" />')</script>
        </head></html>
      `);
    },
  });

  assert.equal(result.status, "success");
  assert.equal(result.title, "Page title");
  assert.equal(result.description, "Page description");
  assert.equal(result.ogTitle, "Open Graph title");
  assert.equal(result.ogDescription, "Open Graph description");
  assert.equal(result.ogSiteName, "Example");
  assert.equal(result.ogImageUrl, "https://example.com/images/cover.jpg");
  assert.equal(result.canonicalUrl, "https://example.com/posts/canonical");
  assert.equal("html" in result, false);
  assert.equal(String((requestInit?.headers as Record<string, string>).Cookie ?? ""), "");
  assert.equal(String((requestInit?.headers as Record<string, string>).Authorization ?? ""), "");
});

test("normalizes duplicate, blank, malformed, and oversized metadata safely", async () => {
  const result = await fetchSourcePageMetadata("https://example.com/page", "web", {
    fetchImpl: async () => response(`
      <title>  Useful   title </title>
      <meta property="og:title" content="" />
      <meta property="og:image" content="data:image/png;base64,secret" />
      <link rel="canonical" href="javascript:alert(1)" />
    `),
  });

  assert.equal(result.title, "Useful title");
  assert.equal(result.ogTitle, null);
  assert.equal(result.ogImageUrl, null);
  assert.equal(result.canonicalUrl, null);
  assert.equal(result.status, "partial");
  assert.equal(validateSourcePageMetadata(result)?.title, "Useful title");
});

test("manual redirects stay bounded and cannot reach private or unrelated platform hosts", async () => {
  const privateRedirect = await fetchSourcePageMetadata("https://www.xiaohongshu.com/explore/1", "xiaohongshu", {
    fetchImpl: async () => response("", { status: 302, headers: { location: "http://127.0.0.1/private" } }),
  });
  const unrelatedRedirect = await fetchSourcePageMetadata("https://www.xiaohongshu.com/explore/1", "xiaohongshu", {
    fetchImpl: async () => response("", { status: 302, headers: { location: "https://example.com/page" } }),
  });

  assert.equal(privateRedirect.status, "blocked");
  assert.equal(unrelatedRedirect.status, "blocked");
});

test("handles blocked, timeout, non-HTML, and oversized responses without returning content", async () => {
  const blocked = await fetchSourcePageMetadata("https://example.com/blocked", "web", {
    fetchImpl: async () => response("", { status: 403 }),
  });
  const nonHtml = await fetchSourcePageMetadata("https://example.com/file", "web", {
    fetchImpl: async () => response("binary", { contentType: "application/octet-stream" }),
  });
  const oversized = await fetchSourcePageMetadata("https://example.com/large", "web", {
    maxBytes: 10,
    fetchImpl: async () => response("12345678901"),
  });
  const timeout = await fetchSourcePageMetadata("https://example.com/slow", "web", {
    timeoutMs: 10,
    fetchImpl: async () => new Promise<Response>(() => undefined),
  });
  const challenge = await fetchSourcePageMetadata("https://example.com/challenge", "web", {
    fetchImpl: async () => response("<html><title>Checking your browser</title><p>captcha</p></html>"),
  });

  assert.equal(blocked.status, "blocked");
  assert.equal(nonHtml.status, "invalid");
  assert.equal(oversized.status, "invalid");
  assert.equal(timeout.status, "timeout");
  assert.equal(challenge.status, "blocked");
  assert.equal("html" in timeout, false);
});
