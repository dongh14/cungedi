"use client";

import { useFormStatus } from "react-dom";

export function SourceIntakeSubmitButton() {
  const { pending } = useFormStatus();

  return (
    <div className="space-y-2">
      <button
        type="submit"
        className="primary-button w-full"
        disabled={pending}
        aria-busy={pending}
      >
        {pending ? "正在识别…" : "识别地点"}
      </button>
      {pending ? (
        <div
          className="flex items-center justify-center gap-2 rounded-[20px] border border-orange-100 bg-orange-50 px-4 py-3 text-sm text-[var(--accent)]"
          aria-live="polite"
        >
          <span className="h-4 w-4 animate-pulse rounded-full border-2 border-orange-200 border-t-[var(--accent)]" aria-hidden="true" />
          <span>正在识别来源信息，请稍候…</span>
        </div>
      ) : null}
    </div>
  );
}
