"use client";

import { useState } from "react";
import { BottomSheet } from "@/components/bottom-sheet";

type CreateCollectionSheetProps = {
  action: (formData: FormData) => void;
};

export function CreateCollectionSheet({ action }: CreateCollectionSheetProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button type="button" className="quiet-create-button" onClick={() => setOpen(true)}>
        新建收藏集
      </button>
      <BottomSheet open={open} title="新建收藏集" labelledBy="create-collection-title" onClose={() => setOpen(false)} dismissOnBackdrop={false}>
        <form action={action} className="bottom-sheet-form">
          <label htmlFor="dashboard-collection-name">收藏集名称</label>
          <input id="dashboard-collection-name" name="name" placeholder="例如：Tokyo Trip" required autoFocus />
          <button type="submit" className="primary-button">创建收藏集</button>
        </form>
      </BottomSheet>
    </>
  );
}
