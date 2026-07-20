"use client";

import type { FormEvent } from "react";
import { createCollectionAction } from "@/app/restaurants/actions";
import { SurfaceCard } from "@/components/surface-card";
import type { AIReviewDraftState } from "@/lib/restaurants/ai-review-state";
import type { CollectionOptionItem } from "@/lib/restaurants/types";

export function ReviewCollectionSelector({
  collectionOptions,
  collectionOptionsError = false,
  selectedCollectionIds,
  sourceUrl,
  sourceInput,
  message,
  formId = "review-save-form",
  aiDraftState,
  draftValues,
  manualEvidence,
}: {
  collectionOptions: CollectionOptionItem[];
  collectionOptionsError?: boolean;
  selectedCollectionIds: number[];
  sourceUrl: string;
  sourceInput?: string;
  message?: string;
  formId?: string;
  aiDraftState?: AIReviewDraftState | null;
  draftValues?: Partial<{
    name: string;
    city: string;
    country: string;
    district: string;
    address: string;
    category: string;
    cuisine: string;
    note: string;
  }>;
  manualEvidence?: string;
}) {
  function syncCurrentDraft(event: FormEvent<HTMLFormElement>) {
    const form = event.currentTarget;
    const params = new URLSearchParams(window.location.search);
    const draftFields = ["name", "city", "country", "district", "address", "category", "cuisine", "note"];

    for (const field of draftFields) {
      const value = params.get(field);
      const input = form.querySelector<HTMLInputElement>(`input[name="review_${field}"]`);

      if (value !== null && input) {
        input.value = value;
      }
    }

    form.querySelectorAll<HTMLInputElement>("input[name=collection_ids]").forEach((input) => input.remove());
    document.querySelectorAll<HTMLInputElement>("input[name=collection_ids]:checked").forEach((input) => {
      const hidden = document.createElement("input");
      hidden.type = "hidden";
      hidden.name = "collection_ids";
      hidden.value = input.value;
      form.appendChild(hidden);
    });
  }

  function renderAIDraftStateInputs() {
    if (!aiDraftState) {
      return null;
    }

    return (
      <>
        {aiDraftState.snapshot.map((field) => (
          <input
            key={`ai-snapshot-${field.field}`}
            type="hidden"
            name="ai_snapshot"
            value={JSON.stringify(field)}
          />
        ))}
        <input type="hidden" name="ai_snapshot_confidence" value={aiDraftState.confidence} />
        <input type="hidden" name="ai_snapshot_reason" value={aiDraftState.reasoningSummary} />
        {aiDraftState.acceptedFields.map((field) => (
          <input key={`ai-accepted-${field}`} type="hidden" name="ai_accepted" value={field} />
        ))}
        {aiDraftState.rejectedGroups.includes("factual") ? (
          <input type="hidden" name="ai_reject_factual" value="1" />
        ) : null}
        {aiDraftState.rejectedGroups.includes("understanding") ? (
          <input type="hidden" name="ai_reject_understanding" value="1" />
        ) : null}
      </>
    );
  }

  return (
    <SurfaceCard className="form-surface p-4 sm:p-5">
      <div className="space-y-4">
        <div>
          <h2 className="[font-family:var(--font-display)] text-xl font-semibold tracking-[-0.03em] text-[var(--ink-strong)]">
            选择合集
          </h2>
          <p className="mt-1 text-xs leading-6 text-[var(--ink-soft)]">
            可以选择一个或多个已有合集；不选择也可以直接保存。
          </p>
        </div>

        {message ? (
          <div className="rounded-[22px] border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            {message}
          </div>
        ) : null}

        {collectionOptionsError ? (
          <p className="rounded-[20px] border border-rose-200 bg-rose-50 p-4 text-sm leading-7 text-rose-700">
            暂时无法读取合集，请稍后再试。
          </p>
        ) : collectionOptions.length > 0 ? (
          <div className="grid gap-3">
            {collectionOptions.map((collection) => (
              <label key={collection.id} className="review-collection-option">
                <input
                  type="checkbox"
                  name="collection_ids"
                  value={collection.id}
                  form={formId}
                  defaultChecked={selectedCollectionIds.includes(collection.id)}
                  className="h-4 w-4 accent-[var(--accent)]"
                />
                <span className="text-sm font-medium text-[var(--ink-strong)]">{collection.name}</span>
              </label>
            ))}
          </div>
        ) : (
          <p className="rounded-[20px] border border-dashed border-[var(--border-soft)] bg-[var(--surface-muted)] p-4 text-sm leading-7 text-[var(--ink-soft)]">
            还没有合集，可以先创建一个，再回到这里选择。
          </p>
        )}

        <form action={createCollectionAction} onSubmit={syncCurrentDraft} className="flex flex-col gap-3 sm:flex-row">
          <input type="hidden" name="return_to" value="review" />
          <input type="hidden" name="source_url" value={sourceUrl} />
          {sourceInput ? <input type="hidden" name="source_input" value={sourceInput} /> : null}
          {selectedCollectionIds.map((id) => (
            <input key={`selected-collection-${id}`} type="hidden" name="collection_ids" value={id} />
          ))}
          {renderAIDraftStateInputs()}
          {Object.entries(draftValues ?? {}).map(([field, value]) => (
            <input key={`review-${field}`} type="hidden" name={`review_${field}`} value={value} />
          ))}
          {manualEvidence ? (
            <input type="hidden" name="manual_evidence" value={manualEvidence} />
          ) : null}
          <input
            name="name"
            required
            className="form-control min-w-0 flex-1"
            placeholder="新合集名称"
          />
          <button type="submit" className="secondary-button">
            创建合集
          </button>
        </form>
      </div>
    </SurfaceCard>
  );
}
