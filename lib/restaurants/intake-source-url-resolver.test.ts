import assert from "node:assert/strict";
import test from "node:test";
import { resolveSourceUrl } from "../intake/resolve-source-url.ts";

function mockResponse(
  status: number,
  headers: Record<string, string> = {},
  url = "",
  body?: { cancel: () => Promise<void> },
) {
  return {
    status,
    ok: status >= 200 && status < 300,
    headers: new Headers(headers),
    url,
    body: body ?? null,
  } as unknown as Response;
}

test("resolves a Xiaohongshu short link to an approved destination", async () => {
  const originalUrl = "http://xhslink.com/o/example";
  const resolvedUrl = "https://www.xiaohongshu.com/explore/example";
  const calls: Array<{ url: string; method: string }> = [];

  const result = await resolveSourceUrl(originalUrl, {
    fetchImpl: async (input, init) => {
      calls.push({ url: String(input), method: String(init?.method) });

      return calls.length === 1
        ? mockResponse(302, { location: resolvedUrl })
        : mockResponse(200, {}, resolvedUrl);
    },
  });

  assert.equal(result.originalUrl, originalUrl);
  assert.equal(result.resolvedUrl, resolvedUrl);
  assert.equal(result.platform, "xiaohongshu");
  assert.equal(result.resolutionStatus, "resolved");
  assert.equal(result.redirectCount, 1);
  assert.deepEqual(calls.map((call) => call.method), ["HEAD", "HEAD"]);
});

test("resolves a Douyin short link to an approved destination", async () => {
  const resolvedUrl = "https://www.douyin.com/video/123";
  let requestCount = 0;

  const result = await resolveSourceUrl("https://v.douyin.com/example/", {
    fetchImpl: async () => {
      requestCount += 1;

      return requestCount === 1
        ? mockResponse(302, { location: resolvedUrl })
        : mockResponse(200, {}, resolvedUrl);
    },
  });

  assert.equal(result.platform, "douyin");
  assert.equal(result.resolutionStatus, "resolved");
  assert.equal(result.resolvedUrl, resolvedUrl);
  assert.equal(result.redirectCount, 1);
});

test("does not fetch full platform URLs or generic web URLs", async () => {
  let calls = 0;
  const fetchImpl = async () => {
    calls += 1;
    return mockResponse(200);
  };

  const xiaohongshu = await resolveSourceUrl("https://www.xiaohongshu.com/explore/example", { fetchImpl });
  const douyin = await resolveSourceUrl("https://douyin.com/video/123", { fetchImpl });
  const generic = await resolveSourceUrl("https://example.com/place", { fetchImpl });

  assert.equal(xiaohongshu.resolutionStatus, "not_required");
  assert.equal(douyin.resolutionStatus, "not_required");
  assert.equal(generic.resolutionStatus, "not_required");
  assert.equal(calls, 0);
});

test("blocks unsupported initial hosts and hostname suffix tricks", async () => {
  let calls = 0;
  const fetchImpl = async () => {
    calls += 1;
    return mockResponse(200);
  };

  const unsupported = await resolveSourceUrl("https://xhslink.com.evil.example/path", { fetchImpl });
  const suffixAttack = await resolveSourceUrl("https://douyin.com.attacker.test/video", { fetchImpl });

  assert.equal(unsupported.resolutionStatus, "blocked");
  assert.equal(suffixAttack.resolutionStatus, "blocked");
  assert.equal(calls, 0);
});

test("blocks redirects to unrelated hosts", async () => {
  const result = await resolveSourceUrl("https://xhslink.com/o/example", {
    fetchImpl: async () => mockResponse(302, { location: "https://evil.example/redirect" }),
  });

  assert.equal(result.resolutionStatus, "blocked");
  assert.equal(result.redirectCount, 0);
  assert.equal(result.originalUrl, "https://xhslink.com/o/example");
});

test("blocks localhost and private IPv4 or IPv6 destinations", async () => {
  let calls = 0;
  const fetchImpl = async () => {
    calls += 1;
    return mockResponse(200);
  };

  const localhost = await resolveSourceUrl("http://localhost:3000/test", { fetchImpl });
  const ipv4 = await resolveSourceUrl("http://192.168.1.1/test", { fetchImpl });
  const ipv6 = await resolveSourceUrl("http://[::1]/test", { fetchImpl });

  assert.equal(localhost.resolutionStatus, "blocked");
  assert.equal(ipv4.resolutionStatus, "blocked");
  assert.equal(ipv6.resolutionStatus, "blocked");
  assert.equal(calls, 0);
});

test("blocks private destinations returned by a short-link redirect", async () => {
  const result = await resolveSourceUrl("https://v.douyin.com/example/", {
    fetchImpl: async () => mockResponse(302, { location: "http://[fd00::1]/private" }),
  });

  assert.equal(result.resolutionStatus, "blocked");
  assert.equal(result.originalUrl, "https://v.douyin.com/example/");
});

test("rejects credentials and non-http protocols", async () => {
  const credentials = await resolveSourceUrl("https://user:password@xhslink.com/o/example");
  const protocol = await resolveSourceUrl("ftp://xhslink.com/o/example");

  assert.equal(credentials.resolutionStatus, "invalid");
  assert.equal(protocol.resolutionStatus, "invalid");
});

test("stops redirect loops at four redirects", async () => {
  let calls = 0;
  const result = await resolveSourceUrl("https://xhslink.com/o/loop", {
    fetchImpl: async () => {
      calls += 1;
      return mockResponse(302, { location: "https://www.xiaohongshu.com/loop" });
    },
  });

  assert.equal(result.resolutionStatus, "redirect_limit");
  assert.equal(result.redirectCount, 4);
  assert.equal(calls, 5);
});

test("returns timeout for a request that exceeds the total deadline", async () => {
  const result = await resolveSourceUrl("https://xhslink.com/o/slow", {
    timeoutMs: 10,
    fetchImpl: async () => new Promise<Response>(() => undefined),
  });

  assert.equal(result.resolutionStatus, "timeout");
});

test("falls back from rejected HEAD to bounded GET", async () => {
  const resolvedUrl = "https://xiaohongshu.com/explore/example";
  const methods: string[] = [];

  const result = await resolveSourceUrl("https://xhslink.com/o/example", {
    fetchImpl: async (input, init) => {
      methods.push(String(init?.method));

      if (methods.length === 1) {
        return mockResponse(405);
      }

      if (methods.length === 2) {
        return mockResponse(302, { location: resolvedUrl });
      }

      assert.equal(String(input), resolvedUrl);
      return mockResponse(200, {}, resolvedUrl);
    },
  });

  assert.equal(result.resolutionStatus, "resolved");
  assert.deepEqual(methods, ["HEAD", "GET", "HEAD"]);
});

test("cancels bounded response bodies without reading them fully", async () => {
  let cancelCount = 0;
  let textCalled = false;
  const body = {
    cancel: async () => {
      cancelCount += 1;
    },
  };
  let requestCount = 0;

  const result = await resolveSourceUrl("https://xhslink.com/o/example", {
    fetchImpl: async (_input, init) => {
      requestCount += 1;

      if (requestCount === 1) {
        assert.equal(init?.method, "HEAD");
        return mockResponse(405, {}, "", body);
      }

      assert.equal(init?.method, "GET");

      const response = mockResponse(200, {}, "https://www.xiaohongshu.com/explore/example", body) as Response & {
        text: () => Promise<string>;
      };
      response.text = async () => {
        textCalled = true;
        return "unexpected body";
      };
      return response;
    },
  });

  assert.equal(result.resolutionStatus, "resolved");
  assert.equal(textCalled, false);
  assert.equal(cancelCount, 2);
});

test("failed resolution preserves the original URL so review can continue", async () => {
  const originalUrl = "https://v.douyin.com/failure/";
  const result = await resolveSourceUrl(originalUrl, {
    fetchImpl: async () => mockResponse(503),
  });

  assert.equal(result.resolutionStatus, "failed");
  assert.equal(result.originalUrl, originalUrl);
  assert.equal(result.resolvedUrl, originalUrl);
});
