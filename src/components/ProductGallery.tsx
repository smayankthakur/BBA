"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import RefNote from "./RefNote";
import { useLang } from "./LangProvider";
import { tf } from "@/lib/i18n/ui";

/**
 * Bracelet photos: swipe on phones (scroll-snap), arrows and thumbnails on
 * desktop, tap a photo for full screen with tap-to-zoom (drag or scroll to
 * look around while zoomed). Keyboard: ←/→ to move, Esc to close.
 */
export default function ProductGallery({ photos, title, refNote = "" }: { photos: string[]; title: string; refNote?: string }) {
  const { ui } = useLang();
  const g = ui.common.gallery;
  const [i, setI] = useState(0);
  const [open, setOpen] = useState(false);
  const [zoom, setZoom] = useState(false);
  const track = useRef<HTMLDivElement>(null);
  const lbTrack = useRef<HTMLDivElement>(null);
  const opener = useRef<HTMLElement | null>(null);
  const closeBtn = useRef<HTMLButtonElement>(null);
  const n = photos.length;

  // Which slide is showing (from scroll position)
  const onScroll = (el: HTMLDivElement | null) => {
    if (!el) return;
    const k = Math.round(el.scrollLeft / el.clientWidth);
    if (k !== i && k >= 0 && k < n) setI(k);
  };
  const go = useCallback(
    (k: number, el = track.current, smooth = true) => {
      const t = Math.max(0, Math.min(n - 1, k));
      setI(t);
      el?.scrollTo({ left: t * el.clientWidth, behavior: smooth && !window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "smooth" : "auto" });
    },
    [n],
  );

  const openAt = (k: number, from: HTMLElement) => {
    opener.current = from;
    setI(k);
    setZoom(false);
    setOpen(true);
  };
  const close = useCallback(() => {
    setOpen(false);
    setZoom(false);
    go(i, track.current, false);
    opener.current?.focus();
  }, [go, i]);

  // Lightbox: jump to the photo, lock scroll, keys
  useEffect(() => {
    if (!open) return;
    document.documentElement.classList.add("qo-open");
    requestAnimationFrame(() => {
      lbTrack.current?.scrollTo({ left: i * (lbTrack.current?.clientWidth ?? 0) });
      closeBtn.current?.focus();
    });
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      else if (e.key === "ArrowRight" && !zoom) go(i + 1, lbTrack.current);
      else if (e.key === "ArrowLeft" && !zoom) go(i - 1, lbTrack.current);
      else if (e.key === "Tab") {
        const els = Array.from(document.querySelectorAll<HTMLElement>(".gal-lb button:not([disabled])"));
        if (!els.length) return;
        const first = els[0];
        const last = els[els.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.documentElement.classList.remove("qo-open");
      document.removeEventListener("keydown", onKey);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, zoom, i]);

  // Zoom: tap point stays under the finger
  const toggleZoom = (e: React.MouseEvent<HTMLElement>, frame: HTMLDivElement | null) => {
    if (!frame) return setZoom((z) => !z);
    if (zoom) return setZoom(false);
    const r = frame.getBoundingClientRect();
    const fx = (e.clientX - r.left) / r.width;
    const fy = (e.clientY - r.top) / r.height;
    setZoom(true);
    requestAnimationFrame(() => {
      frame.scrollLeft = fx * frame.scrollWidth - r.width / 2;
      frame.scrollTop = fy * frame.scrollHeight - r.height / 2;
    });
  };
  // Drag to pan while zoomed (mouse; touch scrolls natively)
  const drag = useRef<{ x: number; y: number; l: number; t: number; moved: boolean } | null>(null);

  if (!n) return null;

  return (
    <div className="gal">
      <div className="gal-main">
        <div className="gal-track" ref={track} onScroll={(e) => onScroll(e.currentTarget)} aria-roledescription="carousel" aria-label={title}>
          {photos.map((src, k) => (
            <div className="gal-slide" key={src} role="group" aria-roledescription="slide" aria-label={tf(g.photo, { n: k + 1, total: n })}>
              <button type="button" className="gal-open" onClick={(e) => openAt(k, e.currentTarget)} aria-label={tf(g.open, { n: k + 1, total: n })}>
                <Image src={src} alt="" fill sizes="(max-width: 900px) 92vw, 560px" priority={k === 0} className="gal-img" />
              </button>
              <RefNote text={refNote} />
            </div>
          ))}
        </div>
        {n > 1 && (
          <>
            <button type="button" className="gal-arrow is-prev" onClick={() => go(i - 1)} disabled={i === 0} aria-label={g.prev}>
              ‹
            </button>
            <button type="button" className="gal-arrow is-next" onClick={() => go(i + 1)} disabled={i === n - 1} aria-label={g.next}>
              ›
            </button>
            <p className="gal-count" aria-hidden="true">
              {i + 1} / {n}
            </p>
          </>
        )}
      </div>
      {n > 1 && (
        <div className="gal-thumbs">
          {photos.map((src, k) => (
            <button
              key={src}
              type="button"
              className={`gal-thumb${k === i ? " is-on" : ""}`}
              aria-label={tf(g.show, { n: k + 1 })}
              aria-current={k === i ? "true" : undefined}
              onClick={() => go(k)}
            >
              <Image src={src} alt="" fill sizes="72px" />
            </button>
          ))}
        </div>
      )}

      {open && (
        <div className="gal-lb" role="dialog" aria-modal="true" aria-label={title}>
          <div className="gal-lb-bar">
            <span className="gal-lb-count">{tf(g.photo, { n: i + 1, total: n })}</span>
            <button type="button" className="gal-lb-btn" onClick={() => setZoom((z) => !z)} aria-pressed={zoom}>
              {zoom ? `− ${g.zoomOut}` : `+ ${g.zoomIn}`}
            </button>
            <button type="button" className="gal-lb-btn gal-lb-close" ref={closeBtn} onClick={close} aria-label={g.close}>
              ✕
            </button>
          </div>
          <div className={`gal-lb-track${zoom ? " is-zoom" : ""}`} ref={lbTrack} onScroll={(e) => !zoom && onScroll(e.currentTarget)}>
            {photos.map((src, k) => (
              <div
                className="gal-lb-slide"
                key={src}
                onClick={(e) => {
                  if (drag.current?.moved) return;
                  if (k === i) toggleZoom(e, e.currentTarget);
                }}
                onMouseDown={(e) => {
                  if (!zoom) return;
                  const el = e.currentTarget;
                  drag.current = { x: e.clientX, y: e.clientY, l: el.scrollLeft, t: el.scrollTop, moved: false };
                }}
                onMouseMove={(e) => {
                  const d = drag.current;
                  if (!d || !zoom) return;
                  const dx = e.clientX - d.x;
                  const dy = e.clientY - d.y;
                  if (Math.abs(dx) + Math.abs(dy) > 4) d.moved = true;
                  e.currentTarget.scrollLeft = d.l - dx;
                  e.currentTarget.scrollTop = d.t - dy;
                }}
                onMouseUp={() => window.setTimeout(() => (drag.current = null), 0)}
                onMouseLeave={() => (drag.current = null)}
              >
                <div className="gal-lb-frame">
                  <Image src={src} alt={tf(g.photo, { n: k + 1, total: n })} fill sizes="100vw" className="gal-lb-img" />
                </div>
              </div>
            ))}
          </div>
          {n > 1 && !zoom && (
            <>
              <button type="button" className="gal-arrow is-prev is-lb" onClick={() => go(i - 1, lbTrack.current)} disabled={i === 0} aria-label={g.prev}>
                ‹
              </button>
              <button type="button" className="gal-arrow is-next is-lb" onClick={() => go(i + 1, lbTrack.current)} disabled={i === n - 1} aria-label={g.next}>
                ›
              </button>
            </>
          )}
          {refNote && <p className="gal-lb-note">{refNote}</p>}
        </div>
      )}
    </div>
  );
}
