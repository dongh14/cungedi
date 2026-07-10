import test from "node:test";
import assert from "node:assert/strict";
import { extractFirstHttpUrl } from "@/lib/restaurants/source-url";

test("extracts a direct URL without changing it", () => {
  assert.equal(
    extractFirstHttpUrl("https://www.google.com/maps/place/example"),
    "https://www.google.com/maps/place/example",
  );
});

test("extracts the URL from a full Xiaohongshu share message", () => {
  const shareText =
    "上海这家brunch的含金量不用我多说了吧🥗 先题外话：... http://xhslink.com/o/7J60GjWRHkb 先存好口令，再去【小红书】解锁这篇笔记~";

  assert.equal(
    extractFirstHttpUrl(shareText),
    "http://xhslink.com/o/7J60GjWRHkb",
  );
});

test("returns null when the pasted text has no URL", () => {
  assert.equal(
    extractFirstHttpUrl("只有分享文案，没有任何链接或 http 地址。"),
    null,
  );
});

test("uses the first valid URL when multiple URLs are present", () => {
  const multiUrlText =
    "先看这个 https://first.example.com/path?x=1 再看这个 https://second.example.com/path?y=2";

  assert.equal(
    extractFirstHttpUrl(multiUrlText),
    "https://first.example.com/path?x=1",
  );
});

test("extracts the URL from the common Douyin share-text format", () => {
  const shareText =
    "4.82 复制打开抖音，看看【甜口柠檬🍋的图文作品】西南首店！上海超🔥的Alimentar.🍕Alim... https://v.douyin.com/-QY0bWXdMQs/ :2pm qrr:/ Z@M.jp 01/22";

  assert.equal(
    extractFirstHttpUrl(shareText),
    "https://v.douyin.com/-QY0bWXdMQs/",
  );
});
