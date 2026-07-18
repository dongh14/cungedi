import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type SurfaceCardProps = {
  children: ReactNode;
  className?: string;
  id?: string;
};

export function SurfaceCard({ children, className, id }: SurfaceCardProps) {
  return (
    <section
      id={id}
      className={cn(
        "rounded-[30px] border border-[var(--border-soft)] bg-[var(--surface)] shadow-[0_24px_80px_rgba(145,72,30,0.08)]",
        className,
      )}
    >
      {children}
    </section>
  );
}
