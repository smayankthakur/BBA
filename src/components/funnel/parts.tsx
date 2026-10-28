"use client";

import { formatINR } from "@/lib/format";
import { MAX_PURPOSES } from "@/lib/pricing";

/* Pieces shared by the 60-second reading (Funnel) and the quick order sheet. */

export type RzpResponse = { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string };
export type RzpInstance = { open: () => void; on: (e: string, cb: (r: { error?: { description?: string } }) => void) => void };
declare global {
  interface Window {
    Razorpay?: new (opts: Record<string, unknown>) => RzpInstance;
  }
}

export function loadRazorpay(): Promise<boolean> {
  if (window.Razorpay) return Promise.resolve(true);
  return new Promise((resolve) => {
    const s = document.createElement("script");
    s.src = "https://checkout.razorpay.com/v1/checkout.js";
    s.async = true;
    s.onload = () => resolve(!!window.Razorpay);
    s.onerror = () => resolve(false);
    document.body.appendChild(s);
  });
}

/**
 * "Add another purpose to the same bracelet": chips for the other purposes,
 * the ones the customer already picked in the reading first.
 */
export function PurposeAdd({
  choices,
  suggested,
  selected,
  locked,
  onChange,
  nextPrice,
  title,
  text,
  idBase,
  labels,
}: {
  labels: { second: string; third: string; youChose: string };
  choices: { slug: string; title: string }[];
  suggested: string[];
  selected: string[];
  locked: string[];
  onChange: (next: string[]) => void;
  nextPrice: number | null;
  title: string;
  text: string;
  idBase: string;
}) {
  const room = MAX_PURPOSES - locked.length;
  const list = [...choices].filter((c) => !locked.includes(c.slug)).sort((a, b) => Number(suggested.includes(b.slug)) - Number(suggested.includes(a.slug)));
  return (
    <section className="fn-addon" aria-labelledby={`${idBase}-title`}>
      <h2 id={`${idBase}-title`} className="fn-addon-title">
        {title}
      </h2>
      <p className="fn-addon-text">
        {text}
        {nextPrice !== null && (
          <>
            {" "}
            <b>
              {locked.length + selected.length === 1 ? labels.second : labels.third}: +{formatINR(nextPrice)}
            </b>
          </>
        )}
      </p>
      <ul className="fn-addon-list">
        {list.map((c) => {
          const on = selected.includes(c.slug);
          const full = !on && selected.length >= room;
          return (
            <li key={c.slug}>
              <button
                type="button"
                className={`fn-addon-chip${on ? " is-on" : ""}`}
                aria-pressed={on}
                disabled={full}
                onClick={() => onChange(on ? selected.filter((x) => x !== c.slug) : [...selected, c.slug])}
              >
                <span aria-hidden="true">{on ? "✓" : "+"}</span>
                <span className="t">
                  {c.title}
                  {suggested.includes(c.slug) && !on && <small>{labels.youChose}</small>}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

