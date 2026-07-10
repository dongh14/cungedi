"use client";

import { useEffect, useRef, useState } from "react";
import { cuisineSuggestions } from "@/lib/restaurants/constants";

type CuisineFieldProps = {
  id: string;
  name: string;
  initialValue: string;
  placeholder: string;
};

export function CuisineField({
  id,
  name,
  initialValue,
  placeholder,
}: CuisineFieldProps) {
  const [value, setValue] = useState(initialValue);
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setValue(initialValue);
  }, [initialValue]);

  useEffect(() => {
    function handlePointerDown(event: PointerEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    window.addEventListener("pointerdown", handlePointerDown);

    return () => {
      window.removeEventListener("pointerdown", handlePointerDown);
    };
  }, []);

  return (
    <div ref={containerRef} className="space-y-3">
      <div className="relative">
        <input
          id={id}
          name={name}
          value={value}
          onChange={(event) => setValue(event.target.value)}
          className="w-full rounded-[22px] border border-[var(--border-soft)] bg-[var(--surface-muted)] px-4 py-3.5 pr-14 text-sm text-[var(--ink-strong)] outline-none transition focus:border-[var(--accent)] focus:ring-4 focus:ring-[var(--accent-glow)]"
          placeholder={placeholder}
          autoComplete="off"
        />
        <button
          type="button"
          aria-label={isOpen ? "收起菜系列表" : "展开菜系列表"}
          aria-expanded={isOpen}
          aria-controls={`${id}-options`}
          onClick={() => setIsOpen((current) => !current)}
          className="absolute right-2 top-1/2 inline-flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-[var(--border-soft)] bg-white text-base font-semibold text-[var(--ink-soft)] transition hover:border-[var(--accent)] hover:text-[var(--accent)]"
        >
          ▾
        </button>
      </div>

      {isOpen ? (
        <div
          id={`${id}-options`}
          className="rounded-[24px] border border-[var(--border-soft)] bg-white p-3 shadow-[0_18px_38px_rgba(145,72,30,0.12)]"
        >
          <div className="flex flex-wrap gap-2">
            {cuisineSuggestions.map((option) => {
              const isSelected = value === option;

              return (
                <button
                  key={option}
                  type="button"
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => {
                    setValue(option);
                    setIsOpen(false);
                  }}
                  className={`rounded-full px-3 py-2 text-sm transition ${
                    isSelected
                      ? "bg-[var(--accent)] text-white"
                      : "border border-[var(--border-soft)] bg-[var(--surface-muted)] text-[var(--ink-soft)] hover:border-[var(--accent)] hover:text-[var(--accent)]"
                  }`}
                >
                  {option}
                </button>
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
}
