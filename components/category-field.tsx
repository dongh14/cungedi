"use client";

import type { ReactNode } from "react";
import {
  categoryOptions,
  getCanonicalPlaceCategory,
} from "@/lib/restaurants/constants";

type CategoryFieldProps = {
  children?: ReactNode;
  name?: string;
  selectedValue: string;
  onChange: (value: string) => void;
};

export function CategoryField({
  children,
  name = "category",
  selectedValue,
  onChange,
}: CategoryFieldProps) {
  const normalizedSelectedValue = getCanonicalPlaceCategory(selectedValue) ?? "";
  const selectedOption = categoryOptions.find(
    (option) => option.value === normalizedSelectedValue,
  );
  const remainingOptions = categoryOptions.filter(
    (option) => option.value !== normalizedSelectedValue,
  );

  return (
    <div className="space-y-3">
      {selectedOption ? (
        <label
          key={selectedOption.value}
          className="flex cursor-pointer gap-3 rounded-[24px] border border-[var(--border-soft)] bg-[var(--surface-muted)] p-4 transition hover:border-[var(--accent)]/45"
        >
          <input
            type="radio"
            name={name}
            value={selectedOption.value}
            checked
            onChange={(event) => onChange(event.target.value)}
            className="mt-1 h-4 w-4 accent-[var(--accent)]"
          />
          <span className="min-w-0">
            <span className="block text-sm font-semibold text-[var(--ink-strong)]">
              {selectedOption.label}
            </span>
            <span className="mt-1 block text-xs leading-6 text-[var(--ink-soft)]">
              {selectedOption.description}
            </span>
          </span>
        </label>

      ) : null}

      {selectedOption ? children : null}

      <div className="grid gap-3">
        {(selectedOption ? remainingOptions : categoryOptions).map((option) => (
          <label
            key={option.value}
            className="flex cursor-pointer gap-3 rounded-[24px] border border-[var(--border-soft)] bg-[var(--surface-muted)] p-4 transition hover:border-[var(--accent)]/45"
          >
            <input
              type="radio"
              name={name}
              value={option.value}
              checked={normalizedSelectedValue === option.value}
              onChange={(event) => onChange(event.target.value)}
              className="mt-1 h-4 w-4 accent-[var(--accent)]"
            />
            <span className="min-w-0">
              <span className="block text-sm font-semibold text-[var(--ink-strong)]">
                {option.label}
              </span>
              <span className="mt-1 block text-xs leading-6 text-[var(--ink-soft)]">
                {option.description}
              </span>
            </span>
          </label>
        ))}
      </div>
    </div>
  );
}
