import assert from "node:assert/strict";
import test from "node:test";
import { getSafeLoginErrorMessage } from "./login-ui.ts";

test("login UI keeps local validation errors readable", () => {
  assert.equal(getSafeLoginErrorMessage("请输入邮箱和密码。"), "请输入邮箱和密码。");
});

test("login UI sanitizes provider errors instead of exposing raw details", () => {
  assert.equal(
    getSafeLoginErrorMessage("Invalid login credentials: secret provider detail"),
    "邮箱或密码错误，请检查后重试。",
  );
});
