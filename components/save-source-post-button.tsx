"use client";

import { saveSourcePostForLaterAction } from "@/app/source-posts/actions";
import { useFormStatus } from "react-dom";

export function SaveSourcePostButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      formAction={saveSourcePostForLaterAction}
      className="secondary-button w-full"
      disabled={pending}
      aria-busy={pending}
    >
      {pending ? "正在保存…" : "先保存帖子，稍后整理"}
    </button>
  );
}
