"use client";

import { useFormStatus } from "react-dom";

export function SourcePostMetadataButton({ disabled = false }: { disabled?: boolean }) {
  const { pending } = useFormStatus();
  const isDisabled = disabled || pending;

  return (
    <button type="submit" className="secondary-button w-full" disabled={isDisabled} aria-busy={pending}>
      {pending ? "正在读取…" : disabled ? "正在读取…" : "读取公开信息"}
    </button>
  );
}
