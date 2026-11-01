"use client";

import { useState } from "react";

/** A value with a small "Copy" button (for typing order details into ProShip). */
export default function CopyText({ value, label }: { value: string; label: string }) {
  const [done, setDone] = useState(false);
  return (
    <span className="ad-copytext">
      <span>{value}</span>
      <button
        type="button"
        className="ad-btn is-small"
        aria-label={`Copy ${label}`}
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(value);
          } catch {
            // Older phones: select the text so a long-press copies it.
            const r = document.createRange();
            const el = document.activeElement?.previousElementSibling;
            if (el) {
              r.selectNodeContents(el);
              getSelection()?.removeAllRanges();
              getSelection()?.addRange(r);
            }
          }
          setDone(true);
          window.setTimeout(() => setDone(false), 1500);
        }}
      >
        {done ? "Copied" : "Copy"}
      </button>
    </span>
  );
}
