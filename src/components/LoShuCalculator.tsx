"use client";

import { useMemo, useState } from "react";
import { countDigits, LO_SHU, LO_SHU_LINES } from "@/lib/loshu";
import { bhagyank, isValidDate, mulank } from "@/lib/numerology";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const THIS_YEAR = new Date().getFullYear();

/** Interactive Lo Shu grid from a date of birth. Runs entirely in the browser. */
export default function LoShuCalculator() {
  const [day, setDay] = useState<number>();
  const [month, setMonth] = useState<number>();
  const [year, setYear] = useState<number>();
  const [addCore, setAddCore] = useState(false);

  const valid = !!(day && month && year && isValidDate(day, month, year));
  const result = useMemo(() => {
    if (!valid) return null;
    const digits = `${day}${month}${year}`.split("").map(Number);
    const m = mulank(day!);
    const b = bhagyank(day!, month!, year!);
    const all = addCore ? [...digits, m, b] : digits;
    const counts = countDigits(all);
    const missing = Object.entries(counts).filter(([, c]) => c === 0).map(([d]) => Number(d));
    const complete = LO_SHU_LINES.filter((l) => l.combo.split("-").every((d) => counts[Number(d)] > 0));
    return { counts, missing, complete, m, b };
  }, [valid, day, month, year, addCore]);

  return (
    <div className="loshu">
      <div className="loshu-inputs">
        <label className="fn-field">
          <span>Day</span>
          <select value={day ?? ""} onChange={(e) => setDay(Number(e.target.value) || undefined)}>
            <option value="">Day</option>
            {Array.from({ length: 31 }, (_, i) => (
              <option key={i + 1} value={i + 1}>
                {i + 1}
              </option>
            ))}
          </select>
        </label>
        <label className="fn-field">
          <span>Month</span>
          <select value={month ?? ""} onChange={(e) => setMonth(Number(e.target.value) || undefined)}>
            <option value="">Month</option>
            {MONTHS.map((mo, i) => (
              <option key={mo} value={i + 1}>
                {mo}
              </option>
            ))}
          </select>
        </label>
        <label className="fn-field">
          <span>Year</span>
          <select value={year ?? ""} onChange={(e) => setYear(Number(e.target.value) || undefined)}>
            <option value="">Year</option>
            {Array.from({ length: THIS_YEAR - 1929 }, (_, i) => THIS_YEAR - i).map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </label>
      </div>
      <label className="fn-check loshu-check">
        <input type="checkbox" checked={addCore} onChange={(e) => setAddCore(e.target.checked)} />
        <span>Also add my mulank and bhagyank to the grid (some numerologists do this)</span>
      </label>
      {day && month && year && !valid && (
        <p className="fn-error" role="alert">
          That date doesn&apos;t exist. Please check the day and month.
        </p>
      )}

      <div className="loshu-out" aria-live="polite">
        <div className="loshu-grid" role="table" aria-label="Lo Shu grid">
          {LO_SHU.map((row, r) => (
            <div key={r} role="row" className="loshu-row">
              {row.map((d) => {
                const c = result?.counts[d] ?? 0;
                return (
                  <div key={d} role="cell" className={`loshu-cell ${result ? (c ? "is-on" : "is-missing") : ""}`}>
                    <span className="loshu-pos" aria-hidden="true">
                      {d}
                    </span>
                    <span className="loshu-val">{result ? (c ? String(d).repeat(c) : "–") : ""}</span>
                    <span className="sr-only">{result ? (c ? `${d} appears ${c} time${c > 1 ? "s" : ""}` : `${d} missing`) : `${d}`}</span>
                  </div>
                );
              })}
            </div>
          ))}
        </div>

        {result ? (
          <div className="loshu-summary">
            <p>
              <b>Mulank {result.m}</b> · <b>Bhagyank {result.b}</b>
            </p>
            <p>
              <span className="loshu-k">Missing numbers</span>
              {result.missing.length ? result.missing.join(", ") : "None"}
            </p>
            <p>
              <span className="loshu-k">Complete lines</span>
              {result.complete.length ? result.complete.map((l) => l.combo).join(", ") : "None"}
            </p>
          </div>
        ) : (
          <p className="small-note">Choose a date of birth to fill the grid. Nothing is sent anywhere.</p>
        )}
      </div>
    </div>
  );
}
