"use client";

export default function PrintButton({ label = "Print / save as PDF" }: { label?: string }) {
  return (
    <button type="button" className="ad-btn is-primary" onClick={() => window.print()}>
      {label}
    </button>
  );
}
