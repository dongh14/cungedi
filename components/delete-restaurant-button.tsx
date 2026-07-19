"use client";

import { useState } from "react";
import { deleteRestaurantAction } from "@/app/restaurants/actions";

export function DeleteRestaurantButton({ restaurantId }: { restaurantId: number }) {
  const [isConfirming, setIsConfirming] = useState(false);

  return (
    <>
      <button
        type="button"
        className="edit-delete-button"
        onClick={() => setIsConfirming(true)}
        aria-label="删除地点"
      >
        删除
      </button>
      {isConfirming ? (
        <div className="edit-confirm-backdrop" role="presentation">
          <div
            className="edit-confirm-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-place-title"
          >
            <h2 id="delete-place-title">删除这个地点？</h2>
            <p>此操作无法撤销。</p>
            <div className="edit-confirm-actions">
              <button type="button" onClick={() => setIsConfirming(false)}>
                取消
              </button>
              <form action={deleteRestaurantAction}>
                <input type="hidden" name="restaurant_id" value={restaurantId} />
                <button type="submit" className="edit-confirm-delete">
                  删除
                </button>
              </form>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
