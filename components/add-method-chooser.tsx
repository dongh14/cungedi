"use client";

import Link from "next/link";
import { AppIcon } from "@/components/app-icon";
import { addMethods } from "@/lib/restaurants/add-flow";

export function AddMethodChooser() {
  return (
    <>
      <section className="add-method-choices" aria-labelledby="add-method-title">
        <h2 id="add-method-title">你想怎么添加？</h2>
        <div className="add-method-choice-list">
          <Link href={addMethods[0].href} className="add-method-choice">
            <span className="add-method-choice-icon"><AppIcon name="edit" size={22} /></span>
            <span>
              <strong>{addMethods[0].label}</strong>
              <small>{addMethods[0].description}</small>
            </span>
            <span className="add-method-choice-arrow" aria-hidden="true">›</span>
          </Link>
          <Link href={addMethods[1].href} className="add-method-choice">
            <span className="add-method-choice-icon add-method-choice-icon-orange"><AppIcon name="link" size={22} /></span>
            <span>
              <strong>{addMethods[1].label}</strong>
              <small>{addMethods[1].description}</small>
            </span>
            <span className="add-method-choice-arrow" aria-hidden="true">›</span>
          </Link>
        </div>
      </section>
    </>
  );
}
