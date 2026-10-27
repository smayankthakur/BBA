"use client";

import { useCallback, useEffect, useRef } from "react";

/**
 * Prev/next arrows for a horizontal, scroll-snapping row, plus gentle
 * auto-advance (one card every few seconds, looping back to the start).
 * Auto-advance pauses while the row is hovered, focused or touched, when it
 * is off screen or the tab is hidden, and never runs for reduced motion.
 */
export default function RowAutoScroll({
  targetId,
  interval = 4500,
  label = "items",
}: {
  targetId: string;
  interval?: number;
  label?: string;
}) {
  const pausedUntil = useRef(0);

  const step = useCallback(
    (dir: 1 | -1) => {
      const el = document.getElementById(targetId);
      const first = el?.firstElementChild as HTMLElement | null;
      if (!el || !first) return;
      const gap = parseFloat(getComputedStyle(el).columnGap || "0") || 0;
      const by = first.getBoundingClientRect().width + gap;
      const max = el.scrollWidth - el.clientWidth;
      const smooth = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth";
      if (dir === 1 && el.scrollLeft >= max - 4) el.scrollTo({ left: 0, behavior: smooth });
      else if (dir === -1 && el.scrollLeft <= 4) el.scrollTo({ left: max, behavior: smooth });
      else el.scrollBy({ left: dir * by, behavior: smooth });
    },
    [targetId],
  );

  useEffect(() => {
    const el = document.getElementById(targetId);
    if (!el) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let visible = false;
    let hovered = false;
    let focused = false;
    const pause = (ms: number) => (pausedUntil.current = Date.now() + ms);

    const io = new IntersectionObserver(([e]) => (visible = e.isIntersecting), { threshold: 0.4 });
    io.observe(el);
    const onEnter = () => (hovered = true);
    const onLeave = () => (hovered = false);
    const onFocusIn = () => (focused = true);
    const onFocusOut = () => (focused = false);
    const onTouch = () => pause(8000);
    el.addEventListener("pointerenter", onEnter);
    el.addEventListener("pointerleave", onLeave);
    el.addEventListener("focusin", onFocusIn);
    el.addEventListener("focusout", onFocusOut);
    el.addEventListener("touchstart", onTouch, { passive: true });
    el.addEventListener("wheel", onTouch, { passive: true });

    const timer = reduced
      ? 0
      : window.setInterval(() => {
          if (!visible || hovered || focused || document.hidden || Date.now() < pausedUntil.current) return;
          if (el.scrollWidth <= el.clientWidth + 4) return; // everything already fits
          step(1);
        }, interval);

    return () => {
      window.clearInterval(timer);
      io.disconnect();
      el.removeEventListener("pointerenter", onEnter);
      el.removeEventListener("pointerleave", onLeave);
      el.removeEventListener("focusin", onFocusIn);
      el.removeEventListener("focusout", onFocusOut);
      el.removeEventListener("touchstart", onTouch);
      el.removeEventListener("wheel", onTouch);
    };
  }, [targetId, interval, step]);

  return (
    <div className="row-arrows">
      <button
        type="button"
        aria-label={`Previous ${label}`}
        aria-controls={targetId}
        onClick={() => {
          pausedUntil.current = Date.now() + 10000;
          step(-1);
        }}
      >
        <span aria-hidden="true">←</span>
      </button>
      <button
        type="button"
        aria-label={`Next ${label}`}
        aria-controls={targetId}
        onClick={() => {
          pausedUntil.current = Date.now() + 10000;
          step(1);
        }}
      >
        <span aria-hidden="true">→</span>
      </button>
    </div>
  );
}
