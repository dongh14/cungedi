"use client";

import { useFormStatus } from "react-dom";

export function SourcePostExtractionButton({ disabled = false }: { disabled?: boolean }) {
  const { pending } = useFormStatus();
  const isDisabled = disabled || pending;

  return (
    <button type="submit" className="secondary-button w-full" disabled={isDisabled} aria-busy={pending}>
      {pending ? "正在识别…" : disabled ? "正在识别…" : "AI 识别地点"}
    </button>
  );
}
