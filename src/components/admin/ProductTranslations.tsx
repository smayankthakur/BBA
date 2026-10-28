"use client";

import { useState } from "react";
import type { Product, ProductI18n, ProductText } from "@/lib/catalog-types";

type L = "hi" | "hn";
const NAMES: Record<L, string> = { hi: "हिन्दी (Hindi)", hn: "Hinglish" };

const join = (v: string[] | undefined, sep: string) => (v ?? []).join(sep);
const split = (v: string, para = false) =>
  (para ? v.split(/\n\s*\n/) : v.split("\n")).map((x) => (para ? x.replace(/\s*\n\s*/g, " ") : x).trim()).filter(Boolean);

/**
 * Hindi and Hinglish wording for a product. Empty fields show the English text
 * on the site. Sent with the product form as one JSON field ("i18n").
 */
export default function ProductTranslations({ product, kind }: { product: Product | null; kind: "bracelet" | "gift" }) {
  const [tab, setTab] = useState<L>("hi");
  const [data, setData] = useState<ProductI18n>(product?.i18n ?? {});
  const set = (l: L, k: keyof ProductText, v: unknown) => setData((d) => ({ ...d, [l]: { ...(d[l] ?? {}), [k]: v } }));
  const t = data[tab] ?? {};
  const en = product;
  const isGift = kind === "gift";
  const done = (l: L) => !!data[l]?.title;

  return (
    <details className="ad-box">
      <summary>
        Hindi and Hinglish {done("hi") && done("hn") ? "✓" : <span className="ad-muted">(empty fields show the English text)</span>}
      </summary>
      <input type="hidden" name="i18n" value={JSON.stringify(data)} />
      <div className="ad-box-body">
        <div className="ad-tabs" role="tablist" aria-label="Language">
          {(Object.keys(NAMES) as L[]).map((l) => (
            <button
              key={l}
              type="button"
              role="tab"
              aria-selected={tab === l}
              className={`ad-link-btn${tab === l ? " is-current" : ""}`}
              onClick={() => setTab(l)}
            >
              {NAMES[l]} {done(l) ? "✓" : ""}
            </button>
          ))}
        </div>
        <div role="tabpanel" className="ad-box-body" style={{ padding: 0 }} lang={tab === "hi" ? "hi" : "hi-Latn"}>
          <label className="ad-field">
            <span>Title</span>
            <input value={t.title ?? ""} placeholder={en?.title} onChange={(e) => set(tab, "title", e.target.value)} maxLength={120} />
          </label>
          <label className="ad-field">
            <span>Short description</span>
            <textarea rows={2} value={t.blurb ?? ""} placeholder={en?.blurb} onChange={(e) => set(tab, "blurb", e.target.value)} maxLength={400} />
          </label>
          <label className="ad-field">
            <span>About (leave an empty line between paragraphs)</span>
            <textarea rows={6} value={join(t.intro, "\n\n")} placeholder={join(en?.intro, "\n\n")} onChange={(e) => set(tab, "intro", split(e.target.value, true))} />
          </label>
          <div className="ad-grid-2">
            <label className="ad-field">
              <span>{isGift ? "What to send us" : "This bracelet is for you if…"}</span>
              <textarea rows={4} value={join(t.listA, "\n")} placeholder={join(en?.listA, "\n")} onChange={(e) => set(tab, "listA", split(e.target.value))} />
            </label>
            {isGift ? (
              <label className="ad-field">
                <span>Gift ideas</span>
                <textarea rows={4} value={join(t.listB, "\n")} placeholder={join(en?.listB, "\n")} onChange={(e) => set(tab, "listB", split(e.target.value))} />
              </label>
            ) : (
              <label className="ad-field">
                <span>Crystals</span>
                <textarea rows={4} value={join(t.crystals, "\n")} placeholder={join(en?.crystals, "\n")} onChange={(e) => set(tab, "crystals", split(e.target.value))} />
              </label>
            )}
          </div>
          <label className="ad-field">
            <span>Highlighted note</span>
            <textarea rows={2} value={t.note ?? ""} placeholder={en?.note ?? ""} onChange={(e) => set(tab, "note", e.target.value)} maxLength={600} />
          </label>
          <div className="ad-grid-2">
            <label className="ad-field">
              <span>Photo description</span>
              <input value={t.photoAlt ?? ""} placeholder={en?.photoAlt ?? ""} onChange={(e) => set(tab, "photoAlt", e.target.value)} maxLength={200} />
            </label>
            <label className="ad-field">
              <span>Video title</span>
              <input value={t.videoTitle ?? ""} placeholder={en?.videoTitle ?? ""} onChange={(e) => set(tab, "videoTitle", e.target.value)} maxLength={120} />
            </label>
          </div>
          <div className="ad-grid-2">
            <label className="ad-field">
              <span>Title in Google</span>
              <input value={t.seoTitle ?? ""} placeholder={en?.seoTitle ?? ""} onChange={(e) => set(tab, "seoTitle", e.target.value)} maxLength={120} />
            </label>
            <label className="ad-field">
              <span>Description in Google</span>
              <input value={t.seoDescription ?? ""} placeholder={en?.seoDescription ?? ""} onChange={(e) => set(tab, "seoDescription", e.target.value)} maxLength={300} />
            </label>
          </div>
        </div>
      </div>
    </details>
  );
}
