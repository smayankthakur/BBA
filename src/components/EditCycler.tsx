"use client";

import { useEffect } from "react";

/**
 * Phones can't hover, so on small screens the intention rows take turns:
 * every few seconds the next row lights up and its photo fan opens above
 * the list. Runs only while the section is on screen.
 */
export default function EditCycler({ targetId, interval = 2600 }: { targetId: string; interval?: number }) {
  useEffect(() => {
    const section = document.getElementById(targetId);
    if (!section) return;
    const rows = Array.from(section.querySelectorAll<HTMLElement>(".row"));
    if (!rows.length) return;
    const mq = window.matchMedia("(max-width: 760px)");
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let i = 0;
    let timer = 0;
    let visible = false;

    const show = (n: number) => rows.forEach((r, k) => r.classList.toggle("is-active", k === n));
    const stop = () => {
      window.clearInterval(timer);
      timer = 0;
    };
    const start = () => {
      if (timer || reduced || !visible || !mq.matches) return;
      timer = window.setInterval(() => {
        i = (i + 1) % rows.length;
        show(i);
      }, interval);
    };
    const apply = () => {
      if (mq.matches) {
        show(i);
        start();
      } else {
        stop();
        rows.forEach((r) => r.classList.remove("is-active"));
      }
    };

    const io = new IntersectionObserver(
      ([e]) => {
        visible = e.isIntersecting;
        if (visible) start();
        else stop();
      },
      { threshold: 0.35 },
    );
    io.observe(section);
    // Touching a row makes it the active one and restarts the timer from there.
    const onTouch = (e: Event) => {
      const n = rows.indexOf(e.currentTarget as HTMLElement);
      if (n < 0 || !mq.matches) return;
      i = n;
      show(i);
      stop();
      start();
    };
    rows.forEach((r) => r.addEventListener("touchstart", onTouch, { passive: true }));
    mq.addEventListener("change", apply);
    apply();
    return () => {
      stop();
      io.disconnect();
      mq.removeEventListener("change", apply);
      rows.forEach((r) => r.removeEventListener("touchstart", onTouch));
    };
  }, [targetId, interval]);
  return null;
}
