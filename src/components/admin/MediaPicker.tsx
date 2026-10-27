"use client";

import { useEffect, useRef, useState } from "react";
import { fetchMedia, uploadImage, type MediaItem } from "./upload";

/**
 * WordPress-style "Add media" dialog: upload new photos or pick from the library.
 * Calls onPick with the chosen URLs.
 */
export default function MediaPicker({
  multiple = false,
  onPick,
  onClose,
}: {
  multiple?: boolean;
  onPick: (urls: string[]) => void;
  onClose: () => void;
}) {
  const [items, setItems] = useState<MediaItem[] | null>(null);
  const [picked, setPicked] = useState<string[]>([]);
  const [busy, setBusy] = useState(0);
  const [error, setError] = useState("");
  const [over, setOver] = useState(false);
  const dialog = useRef<HTMLDivElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const close = useRef(onClose);
  useEffect(() => {
    close.current = onClose;
  });

  useEffect(() => {
    fetchMedia()
      .then(setItems)
      .catch((e: Error) => {
        setItems([]);
        setError(e.message);
      });
    const prev = document.activeElement as HTMLElement | null;
    dialog.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close.current();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
      prev?.focus();
    };
  }, []);

  async function upload(files: FileList | File[]) {
    setError("");
    for (const f of Array.from(files)) {
      setBusy((b) => b + 1);
      try {
        const m = await uploadImage(f);
        setItems((list) => [m, ...(list ?? [])]);
        setPicked((p) => (multiple ? [...p, m.url] : [m.url]));
      } catch (e) {
        setError((e as Error).message);
      } finally {
        setBusy((b) => b - 1);
      }
    }
  }

  const toggle = (url: string) =>
    setPicked((p) =>
      p.includes(url)
        ? p.filter((u) => u !== url)
        : multiple
          ? [...p, url]
          : [url],
    );

  return (
    <div
      className="ad-modal"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="ad-modal-card"
        role="dialog"
        aria-modal="true"
        aria-labelledby="mp-title"
        tabIndex={-1}
        ref={dialog}
      >
        <div className="ad-modal-head">
          <h2 id="mp-title">{multiple ? "Add photos" : "Choose a photo"}</h2>
          <button type="button" className="ad-btn is-small" onClick={onClose}>
            Close
          </button>
        </div>
        <div className="ad-modal-body">
          <div
            className={`ad-drop${over ? " is-over" : ""}`}
            onDragOver={(e) => {
              e.preventDefault();
              setOver(true);
            }}
            onDragLeave={() => setOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              setOver(false);
              upload(e.dataTransfer.files);
            }}
          >
            <p>Drop photos here, or</p>
            <button
              type="button"
              className="ad-btn"
              onClick={() => input.current?.click()}
              disabled={busy > 0}
            >
              {busy > 0
                ? `Uploading ${busy}…`
                : "Select files from your device"}
            </button>
            <input
              ref={input}
              type="file"
              accept="image/*,.heic,.heif"
              multiple={multiple}
              hidden
              onChange={(e) => {
                if (e.target.files?.length) upload(e.target.files);
                e.target.value = "";
              }}
            />
            <small className="ad-help">
              JPG, PNG, WebP or HEIC. Large phone photos are resized
              automatically.
            </small>
          </div>
          {error && (
            <p className="ad-notice is-err" role="alert">
              {error}
            </p>
          )}
          {items === null ? (
            <p className="ad-muted">Loading the library…</p>
          ) : items.length === 0 ? (
            <p className="ad-muted">No uploaded photos yet.</p>
          ) : (
            <div className="ad-media-grid" style={{ marginTop: 16 }}>
              {items.map((m) => (
                <div
                  key={m.id}
                  className={`ad-media-item${picked.includes(m.url) ? " is-picked" : ""}`}
                >
                  <button
                    type="button"
                    className="ad-pick"
                    onClick={() => toggle(m.url)}
                    aria-pressed={picked.includes(m.url)}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={m.url} alt={m.filename ?? ""} loading="lazy" />
                  </button>
                  <div className="ad-media-meta">{m.filename}</div>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="ad-modal-foot">
          <span className="ad-muted">
            {picked.length ? `${picked.length} selected` : "Nothing selected"}
          </span>
          <button
            type="button"
            className="ad-btn is-primary"
            disabled={!picked.length}
            onClick={() => {
              onPick(picked);
              onClose();
            }}
          >
            {multiple ? "Add to product" : "Use this photo"}
          </button>
        </div>
      </div>
    </div>
  );
}
