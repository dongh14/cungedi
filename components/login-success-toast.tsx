"use client";

import { useEffect, useRef, useState } from "react";
import {
  consumeLoginSuccessSignal,
  LOGIN_SUCCESS_TOAST_DURATION_MS,
} from "@/lib/restaurants/login-success-toast";

type LoginSuccessToastProps = {
  show: boolean;
};

export function LoginSuccessToast({ show }: LoginSuccessToastProps) {
  const [visible, setVisible] = useState(show);
  const consumed = useRef(false);

  useEffect(() => {
    if (!show || consumed.current) {
      return;
    }

    consumed.current = true;
    const result = consumeLoginSuccessSignal(window.location.search);

    if (!result.shouldShow) {
      return;
    }

    const hash = window.location.hash;
    const nextUrl = `${window.location.pathname}${result.cleanedSearch}${hash}`;
    window.history.replaceState(window.history.state, "", nextUrl);
  }, [show]);

  if (!visible) {
    return null;
  }

  return (
    <div
      className="login-success-toast"
      role="status"
      aria-live="polite"
      style={{ animationDuration: `${LOGIN_SUCCESS_TOAST_DURATION_MS}ms` }}
      onAnimationEnd={() => setVisible(false)}
    >
      你已成功登录
    </div>
  );
}
