import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const root = process.cwd();
const read = (path: string) => readFileSync(`${root}/${path}`, "utf8");

test("login page keeps the email-only branded experience", () => {
  const page = read("app/login/page.tsx");
  const card = read("components/auth-card.tsx");

  assert.match(page, /SiteBrand/u);
  assert.match(page, /欢迎回来/u);
  assert.match(page, /请输入邮箱/u);
  assert.match(page, /请输入密码/u);
  assert.match(page, /还没有账号？立即注册/u);
  assert.match(page, /variant="login"/u);
  assert.match(card, /type="email"/u);
  assert.match(card, /autoComplete="email"/u);
  assert.match(card, /PasswordField/u);
  assert.match(card, /AuthSubmitButton/u);
});

test("login page intentionally omits unsupported social authentication", () => {
  const page = read("app/login/page.tsx");
  const card = read("components/auth-card.tsx");

  assert.doesNotMatch(page, /Google|Apple|OAuth|社交登录/u);
  assert.doesNotMatch(card, /Google|Apple|OAuth|社交登录|或使用/u);
});

test("password controls and errors remain accessible", () => {
  const passwordField = read("components/password-field.tsx");
  const card = read("components/auth-card.tsx");

  assert.match(passwordField, /显示密码/u);
  assert.match(passwordField, /隐藏密码/u);
  assert.match(passwordField, /type="button"/u);
  assert.match(card, /role="alert"/u);
  assert.match(card, /autoComplete=\{variant === "login" \? "current-password" : "new-password"\}/u);
});

test("successful login preserves the one-time dashboard toast redirect", () => {
  const actions = read("app/auth/actions.ts");

  assert.match(actions, /redirect\(buildRedirect\("\/dashboard", \{ login_success: "1" \}\)\)/u);
  assert.doesNotMatch(actions, /redirect\(buildRedirect\("\/dashboard", \{ message:/u);
});
