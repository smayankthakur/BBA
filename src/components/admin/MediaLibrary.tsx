"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { deleteMediaAction } from "@/app/admin/actions";
import { uploadImage, type MediaItem } from "./upload";

const size = (b: number | null) =>
  b == null
    ? ""
    : b > 1e6
      ? `${(b / 1e6).toFixed(1)} MB`
      : `${Math.round(b / 1e3)} KB`;

export default function MediaLibrary({
  items,
  ready,
}: {
  items: MediaItem[];
  ready: boolean;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(0);
  const [error, setError] = useState("");
  const [over, setOver] = useState(false);
  const [copied, setCopied] = useState("");
  const input = useRef<HTMLInputElement>(null);

  async function upload(files: FileList) {
    setError("");
    for (const f of Array.from(files)) {
      setBusy((b) => b + 1);
      try {
        await uploadImage(f);
      } catch (e) {
        setError((e as Error).message);
      } finally {
        setBusy((b) => b - 1);
      }
    }
    router.refresh();
  }

  return (
    <>
      {ready ? (
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
          <p>Drop photos here to upload, or</p>
          <button
            type="button"
            className="ad-btn"
            onClick={() => input.current?.click()}
            disabled={busy > 0}
          >
            {busy > 0 ? `Uploading ${busy}…` : "Select files"}
          </button>
          <input
            ref={input}
            type="file"
            accept="image/*,.heic,.heif"
            multiple
            hidden
            onChange={(e) => {
              if (e.target.files?.length) upload(e.target.files);
              e.target.value = "";
            }}
          />
          <small className="ad-help">
            Photos are resized to 2000px and saved as WebP. Use them on products
            and pages.
          </small>
        </div>
      ) : (
        <div className="ad-notice is-warn">
          <p>
            Image storage isn&apos;t connected yet. Connect Vercel Blob to the
            project to upload photos.
          </p>
        </div>
      )}
      {error && (
        <div className="ad-notice is-err" role="alert">
          <p>{error}</p>
        </div>
      )}

      {items.length === 0 ? (
        <p className="ad-empty">
          No uploaded photos yet. Built-in product photos stay in place until
          you replace them.
        </p>
      ) : (
        <div className="ad-media-grid" style={{ marginTop: 20 }}>
          {items.map((m) => (
            <div className="ad-media-item" key={m.id}>
              <a href={m.url} target="_blank" rel="noopener noreferrer">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={m.url} alt={m.filename ?? ""} loading="lazy" />
              </a>
              <div className="ad-media-meta">
                <div
                  title={m.filename ?? ""}
                  style={{
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {m.filename}
                </div>
                <div>
                  {m.width}×{m.height} · {size(m.bytes)}
                </div>
                <div
                  className="ad-row-actions"
                  style={{ visibility: "visible" }}
                >
                  <button
                    type="button"
                    className="ad-link-btn"
                    onClick={() => {
                      navigator.clipboard
                        ?.writeText(m.url)
                        .then(() => setCopied(m.id));
                    }}
                  >
                    {copied === m.id ? "Copied" : "Copy link"}
                  </button>
                  <form
                    action={deleteMediaAction}
                    onSubmit={(e) => {
                      if (!confirm("Delete this photo permanently?"))
                        e.preventDefault();
                    }}
                  >
                    <input type="hidden" name="id" value={m.id} />
                    <button className="ad-link-btn is-danger">Delete</button>
                  </form>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
