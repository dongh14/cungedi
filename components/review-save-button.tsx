"use client";

import { useFormStatus } from "react-dom";

export function ReviewSaveButton({ formId }: { formId?: string }) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      {...(formId ? { form: formId } : {})}
      className="primary-button w-full"
      disabled={pending}
    >
      {pending ? "保存中…" : "保存地点"}
    </button>
  );
}
