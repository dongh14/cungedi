"use client";

import { useEffect } from "react";

const dashboardFixedClass = "dashboard-fixed";

export function DashboardFixedViewport() {
  useEffect(() => {
    const html = document.documentElement;
    const body = document.body;
    const previousHtmlClass = html.className;
    const previousBodyClass = body.className;
    const mediaQuery = window.matchMedia("(orientation: portrait)");

    const reportGeometry = () => {
      if (process.env.NODE_ENV === "production") {
        return;
      }

      const shell = document.querySelector<HTMLElement>(".app-shell-dashboard");
      const shellRect = shell?.getBoundingClientRect();
      const styles = window.getComputedStyle(document.body);

      console.debug("[dashboard-fixed] geometry", {
        portrait: mediaQuery.matches,
        scrollY: window.scrollY,
        documentScrollHeight: document.documentElement.scrollHeight,
        documentClientHeight: document.documentElement.clientHeight,
        bodyScrollHeight: body.scrollHeight,
        shellHeight: shellRect ? Math.round(shellRect.height) : 0,
        shellBottom: shellRect ? Math.round(shellRect.bottom) : 0,
        bodyOverflow: styles.overflow,
        htmlOverflow: window.getComputedStyle(html).overflow,
      });
    };

    const applyLock = () => {
      html.classList.toggle(dashboardFixedClass, mediaQuery.matches);
      body.classList.toggle(dashboardFixedClass, mediaQuery.matches);
      reportGeometry();
    };

    const handleResize = () => window.requestAnimationFrame(reportGeometry);

    applyLock();
    window.addEventListener("resize", handleResize);
    window.addEventListener("orientationchange", applyLock);
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener("change", applyLock);
    } else {
      mediaQuery.addListener(applyLock);
    }

    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("orientationchange", applyLock);
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener("change", applyLock);
      } else {
        mediaQuery.removeListener(applyLock);
      }
      html.className = previousHtmlClass;
      body.className = previousBodyClass;
    };
  }, []);

  return null;
}
