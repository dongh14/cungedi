import assert from "node:assert/strict";
import test from "node:test";
import {
  addMethods,
  classifyDetectedAddSourceType,
  getAddSourceHref,
} from "./add-flow.ts";

test("add landing exposes only manual and source choices", () => {
  assert.deepEqual(addMethods.map((method) => method.label), ["手动添加", "粘贴链接"]);
  assert.equal(addMethods.length, 2);
  assert.equal(addMethods[0].href, "/restaurants/new/manual");
  assert.equal(addMethods[1].href, "/restaurants/new/source");
});

test("manual and source choices lead to focused flow steps", () => {
  assert.equal(addMethods[0].description, "自己填写地点信息");
  assert.equal(addMethods[1].description, "从网页、小红书等来源快速添加");
  assert.equal(getAddSourceHref("xiaohongshu"), "/restaurants/new/source");
  assert.equal(getAddSourceHref("website"), "/restaurants/new/source");
});

test("paste flow always opens the single generic link step", () => {
  assert.equal(getAddSourceHref("other"), "/restaurants/new/source");
});

test("source classification remains internal to the paste flow", () => {
  assert.equal(classifyDetectedAddSourceType("xiaohongshu"), "xiaohongshu");
  assert.equal(classifyDetectedAddSourceType("douyin"), "douyin");
  assert.equal(classifyDetectedAddSourceType("website"), "official_web");
  assert.equal(classifyDetectedAddSourceType("unknown"), "other_web");
});
