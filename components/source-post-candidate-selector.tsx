"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type CandidateOption = {
  id: string;
  name: string;
  reviewHref: string;
};

export function SourcePostCandidateSelector({ candidates }: { candidates: CandidateOption[] }) {
  const router = useRouter();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  if (candidates.length === 0) {
    return null;
  }

  function toggleCandidate(id: string) {
    setSelectedIds((current) => current.includes(id)
      ? current.filter((value) => value !== id)
      : [...current, id]);
  }

  function openSelectedCandidate() {
    const selected = candidates.find((candidate) => selectedIds.includes(candidate.id));
    if (selected) {
      router.push(selected.reviewHref);
    }
  }

  return (
    <div className="grid gap-2" aria-label="候选地点选择">
      {candidates.map((candidate) => (
        <label key={candidate.id} className="flex min-h-12 items-center gap-3 rounded-2xl border border-[var(--border-soft)] px-3 py-2 text-sm">
          <input
            type="checkbox"
            checked={selectedIds.includes(candidate.id)}
            onChange={() => toggleCandidate(candidate.id)}
            className="h-4 w-4 accent-[var(--accent)]"
          />
          <span className="min-w-0 flex-1 truncate">{candidate.name || "未确定名称"}</span>
        </label>
      ))}
      <button type="button" className="secondary-button w-full" disabled={selectedIds.length === 0} onClick={openSelectedCandidate}>
        整理所选候选（{selectedIds.length}）
      </button>
      <p className="detail-muted">可多选，之后按顺序逐个确认并保存。</p>
    </div>
  );
}
