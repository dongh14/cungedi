"use client";

import { useState } from "react";

export function AIRefreshControl({
  params,
}: {
  params: Array<readonly [string, string]>;
}) {
  const [pending, setPending] = useState(false);

  return (
    <form
      method="get"
      action="/restaurants/review"
      onSubmit={() => setPending(true)}
      className="space-y-2"
    >
      {params.map(([key, value], index) => (
        <input key={`${key}-${index}`} type="hidden" name={key} value={value} />
      ))}
      <button
        type="submit"
        disabled={pending}
        className="rounded-full border border-[var(--border-soft)] bg-white px-4 py-2.5 text-xs font-semibold text-[var(--ink-strong)] transition hover:border-[var(--accent)] hover:text-[var(--accent)] disabled:cursor-wait disabled:opacity-60"
      >
        {pending ? "重新分析中..." : "重新分析"}
      </button>
      <p className="text-xs leading-6 text-[var(--ink-muted)]">重新分析会再次调用 AI。</p>
    </form>
  );
}
