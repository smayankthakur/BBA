"use client";

import { useEffect, useState } from "react";

export default function CopyField({
  value,
  label,
  clearQuery = false,
}: {
  value: string;
  label: string;
  clearQuery?: boolean;
}) {
  const [done, setDone] = useState(false);
  // Keep one-time secrets (invite links) out of the address bar and history.
  useEffect(() => {
    if (clearQuery) history.replaceState(null, "", location.pathname);
  }, [clearQuery]);
  return (
    <div className="ad-actions" style={{ alignItems: "stretch" }}>
      <input
        readOnly
        value={value}
        aria-label={label}
        onFocus={(e) => e.target.select()}
        style={{ flex: 1, minWidth: 220 }}
        className="ad-copy"
      />
      <button
        type="button"
        className="ad-btn is-primary"
        onClick={() =>
          navigator.clipboard?.writeText(value).then(() => setDone(true))
        }
      >
        {done ? "Copied" : "Copy link"}
      </button>
    </div>
  );
}
