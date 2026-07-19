"use client";

import { useRouter } from "next/navigation";
import { AppIcon } from "@/components/app-icon";

export function MenuBackButton() {
  const router = useRouter();

  function handleBack() {
    if (window.history.length > 1) {
      router.back();
      return;
    }

    router.push("/dashboard");
  }

  return (
    <button type="button" className="menu-back-button" onClick={handleBack} aria-label="返回">
      <AppIcon name="back" size={21} strokeWidth={2.1} />
      <span>返回</span>
    </button>
  );
}
