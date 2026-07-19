import assert from "node:assert/strict";
import test from "node:test";
import {
  consumeLoginSuccessSignal,
  LOGIN_SUCCESS_SIGNAL,
  LOGIN_SUCCESS_TOAST_DURATION_MS,
} from "./login-success-toast.ts";

test("successful login exposes a one-time toast signal and cleans it from the URL", () => {
  assert.equal(LOGIN_SUCCESS_SIGNAL, "1");
  assert.deepEqual(consumeLoginSuccessSignal("?login_success=1"), {
    shouldShow: true,
    cleanedSearch: "",
  });
  assert.deepEqual(consumeLoginSuccessSignal("?login_success=1&message=keep"), {
    shouldShow: true,
    cleanedSearch: "?message=keep",
  });
});

test("normal dashboard visits and refreshed URLs do not show the toast", () => {
  assert.deepEqual(consumeLoginSuccessSignal(""), {
    shouldShow: false,
    cleanedSearch: "",
  });
  assert.deepEqual(consumeLoginSuccessSignal("?message=keep"), {
    shouldShow: false,
    cleanedSearch: "?message=keep",
  });
});

test("toast lifecycle is configured for a short 2.5 second dismissal", () => {
  assert.equal(LOGIN_SUCCESS_TOAST_DURATION_MS, 2500);
});
