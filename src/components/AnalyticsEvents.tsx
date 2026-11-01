"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { track } from "@/lib/analytics";

type W = Window & { gtag?: (...a: unknown[]) => void; fbq?: (...a: unknown[]) => void; __bbaAnalytics?: boolean };

/** Page views for in-site navigation (the first view is sent when analytics loads). */
export function RouteViews() {
  const path = usePathname();
  const first = useRef(true);
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    const w = window as W;
    if (!w.__bbaAnalytics) return;
    w.gtag?.("event", "page_view", { page_path: path, page_location: window.location.href, page_title: document.title });
    w.fbq?.("track", "PageView");
  }, [path]);
  return null;
}

/** One event when a page is shown, e.g. view_item on a bracelet page. */
export function ViewEvent({ name, params, meta }: { name: string; params: Record<string, string | number>; meta?: string }) {
  useEffect(() => {
    // Analytics may load a moment later (after consent); retry briefly.
    let n = 0;
    const t = window.setInterval(() => {
      if ((window as W).__bbaAnalytics || ++n > 20) {
        window.clearInterval(t);
        track(name, params, meta);
      }
    }, 300);
    return () => window.clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [name]);
  return null;
}
