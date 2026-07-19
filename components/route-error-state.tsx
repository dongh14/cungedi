"use client";

import Link from "next/link";
import { useEffect } from "react";

type RouteErrorStateProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export function RouteErrorState({ error, reset }: RouteErrorStateProps) {
  useEffect(() => {
    if (process.env.NODE_ENV === "development") {
      console.error(error);
    }
  }, [error]);

  return (
    <main className="route-error-page" role="alert">
      <section className="route-error-card">
        <p className="route-error-kicker">存个地</p>
        <h1>这个页面暂时打不开</h1>
        <p>可以重试一次，或者先回到首页继续浏览。你的已保存地点不会因此改变。</p>
        <div className="route-error-actions">
          <button type="button" className="primary-button" onClick={() => reset()}>
            重试
          </button>
          <Link href="/dashboard" className="secondary-button">
            回到首页
          </Link>
        </div>
      </section>
    </main>
  );
}
