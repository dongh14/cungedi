"use client";

import { useEffect, useRef, type ReactNode } from "react";

type BottomSheetProps = {
  open: boolean;
  title: string;
  labelledBy?: string;
  onClose: () => void;
  dismissOnBackdrop?: boolean;
  children: ReactNode;
};

export function BottomSheet({ open, title, labelledBy, onClose, dismissOnBackdrop = true, children }: BottomSheetProps) {
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);
  const sheetRef = useRef<HTMLElement | null>(null);
  const triggerRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) {
      triggerRef.current?.focus();
      return;
    }

    triggerRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    closeButtonRef.current?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
        return;
      }

      if (event.key !== "Tab") {
        return;
      }

      const focusableElements = Array.from(
        sheetRef.current?.querySelectorAll<HTMLElement>(
          "button, input, textarea, select, a[href]",
        ) ?? [],
      ).filter((element) => !element.hasAttribute("disabled"));

      if (focusableElements.length === 0) {
        return;
      }

      const first = focusableElements[0];
      const last = focusableElements[focusableElements.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    document.body.dataset.sheetOpen = "true";

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      delete document.body.dataset.sheetOpen;
    };
  }, [onClose, open]);

  if (!open) {
    return null;
  }

  return (
    <div className="bottom-sheet-overlay" role="presentation" onMouseDown={(event) => {
      if (dismissOnBackdrop && event.target === event.currentTarget) {
        onClose();
      }
    }}>
      <section
        ref={sheetRef}
        className="bottom-sheet"
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy ?? "bottom-sheet-title"}
      >
        <div className="bottom-sheet-handle" aria-hidden="true" />
        <header className="bottom-sheet-header">
          <h2 id={labelledBy ?? "bottom-sheet-title"}>{title}</h2>
          <button ref={closeButtonRef} type="button" className="bottom-sheet-close" onClick={onClose} aria-label="关闭">
            ×
          </button>
        </header>
        <div className="bottom-sheet-content">{children}</div>
      </section>
    </div>
  );
}
