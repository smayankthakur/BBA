"use client";

import { useState } from "react";
import ReadingCard from "./ReadingCard";
import { BRACELETS } from "@/data/pages";
import { bhagyank, isValidDate, mulank } from "@/lib/numerology";

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

/**
 * Staff tool: type the order details (from the order sheet), adjust the
 * crystals Ammit chose, then print the card to put in the box or save as PDF
 * to send on WhatsApp. Nothing is stored or sent.
 */
export default function ReadingCardTool() {
  const [name, setName] = useState("");
  const [dob, setDob] = useState("");
  const [slug, setSlug] = useState(BRACELETS[0].slug);
  const b = BRACELETS.find((x) => x.slug === slug)!;
  const [crystals, setCrystals] = useState(b.crystals.join(", "));
  const [note, setNote] = useState("");

  const [y, mo, d] = dob.split("-").map(Number);
  const ok = !!(y && mo && d && isValidDate(d, mo, y));

  return (
    <main id="main" className="tool">
      <div className="tool-form no-print">
        <h1 className="h3">Reading card</h1>
        <p className="small-note">Staff tool. Nothing you type here is saved or sent. Print, or choose &ldquo;Save as PDF&rdquo; to send on WhatsApp.</p>
        <label className="fn-field">
          <span>Wearer&apos;s name</span>
          <input value={name} onChange={(e) => setName(e.target.value)} />
        </label>
        <label className="fn-field">
          <span>Date of birth</span>
          <input type="date" value={dob} onChange={(e) => setDob(e.target.value)} />
        </label>
        <label className="fn-field">
          <span>Bracelet</span>
          <select
            value={slug}
            onChange={(e) => {
              setSlug(e.target.value);
              setCrystals(BRACELETS.find((x) => x.slug === e.target.value)!.crystals.join(", "));
            }}
          >
            {BRACELETS.map((x) => (
              <option key={x.slug} value={x.slug}>
                {x.title}
              </option>
            ))}
          </select>
        </label>
        <label className="fn-field">
          <span>Crystals Ammit chose (comma-separated)</span>
          <input value={crystals} onChange={(e) => setCrystals(e.target.value)} />
        </label>
        <label className="fn-field">
          <span>Personal note from Ammit (optional)</span>
          <textarea rows={3} value={note} onChange={(e) => setNote(e.target.value)} maxLength={220} />
        </label>
        <button type="button" className="btn btn-lapis" disabled={!ok || !name.trim()} onClick={() => window.print()}>
          Print / save as PDF
        </button>
      </div>
      <div className="tool-preview print-area">
        {ok && name.trim() ? (
          <ReadingCard
            d={{
              kind: "chosen",
              name: name.trim(),
              dob: `${d} ${MONTHS[mo - 1]} ${y}`,
              mulank: mulank(d),
              bhagyank: bhagyank(d, mo, y),
              bracelet: b.title,
              crystals: crystals.split(",").map((c) => c.trim()).filter(Boolean),
              note: note.trim() || undefined,
            }}
          />
        ) : (
          <p className="small-note no-print">Enter a name and date of birth to preview the card.</p>
        )}
      </div>
    </main>
  );
}
