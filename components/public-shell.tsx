import type { ReactNode } from "react";
import { SiteBrand } from "@/components/site-brand";

type PublicShellProps = { eyebrow: string; title: string; description: string; children: ReactNode; aside?: ReactNode };

export function PublicShell({ eyebrow, title, description, children, aside }: PublicShellProps) {
  return (
    <main className="public-shell">
      <header className="public-header"><SiteBrand /><span className="public-header-note">个人收藏工具</span></header>
      <div className="public-canvas">
        <section className="public-intro"><span>{eyebrow}</span><h1>{title}</h1><p>{description}</p></section>
        <div className="public-content"><div>{children}</div>{aside ? <aside>{aside}</aside> : null}</div>
      </div>
    </main>
  );
}
