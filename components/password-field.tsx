"use client";

import { useState } from "react";

type PasswordFieldProps = {
  placeholder: string;
  autoComplete: "current-password" | "new-password";
  enterKeyHint?: "done" | "go" | "next" | "search" | "send";
};

export function PasswordField({ placeholder, autoComplete, enterKeyHint = "done" }: PasswordFieldProps) {
  const [visible, setVisible] = useState(false);

  return (
    <span className="password-field">
      <input
        id="password"
        name="password"
        type={visible ? "text" : "password"}
        required
        minLength={6}
        autoComplete={autoComplete}
        enterKeyHint={enterKeyHint}
        className="form-control password-field-input w-full"
        placeholder={placeholder}
      />
      <button
        type="button"
        className="password-field-toggle"
        aria-label={visible ? "隐藏密码" : "显示密码"}
        onClick={() => setVisible((current) => !current)}
      >
        {visible ? "隐藏" : "显示"}
      </button>
    </span>
  );
}
