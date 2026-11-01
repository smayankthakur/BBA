"use client";

import { useEffect, useState } from "react";
import RichText from "./RichText";
import { useLang } from "./LangProvider";
import { tf } from "@/lib/i18n/ui";
import { INTL_LOCALE } from "@/lib/i18n/config";

type Result = {
  ref: string;
  purposes: string[];
  status: string;
  paidAt: string | null;
  readingAt: string | null;
  makingAt: string | null;
  shippedAt: string | null;
  deliveredAt: string | null;
  courier: string | null;
  trackingNumber: string | null;
  trackingUrl: string | null;
  detailsMissing: boolean;
};

/** Order number + mobile → progress timeline with the courier link. */
export default function TrackOrder({ waPhone }: { waPhone: string }) {
  const { ui, lang } = useLang();
  const t = ui.track;
  const [ref, setRef] = useState("");
  const [mobile, setMobile] = useState("");
  const [state, setState] = useState<{ status: "idle" | "working" | "error"; message?: string }>({ status: "idle" });
  const [res, setRes] = useState<Result | null>(null);

  // Links in messages carry ?no=BBA-… (not ?ref=, which is the partner code)
  useEffect(() => {
    const r = new URLSearchParams(window.location.search).get("no");
    if (r && /^BBA-[A-Fa-f0-9]{8}$/.test(r)) setRef(r.toUpperCase());
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const r = ref.trim().toUpperCase();
    if (!/^BBA-[A-F0-9]{8}$/.test(r) || !/^[6-9]\d{9}$/.test(mobile)) {
      setState({ status: "error", message: t.check });
      return;
    }
    setState({ status: "working" });
    setRes(null);
    const x = await fetch("/api/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ref: r, mobile }),
    }).catch(() => null);
    const d = x ? await x.json().catch(() => ({})) : {};
    if (x?.ok) {
      setRes(d as Result);
      setState({ status: "idle" });
    } else setState({ status: "error", message: d.error ?? t.notFound });
  };

  const fmt = (iso: string | null) =>
    iso ? new Date(iso).toLocaleDateString(INTL_LOCALE[lang], { day: "numeric", month: "short", year: "numeric" }) : "";
  const wa = (text: string) => `https://wa.me/${waPhone}?text=${encodeURIComponent(text)}`;
  const steps = res
    ? ([
        ["paid", res.paidAt],
        ["reading", res.readingAt],
        ["making", res.makingAt],
        ["shipped", res.shippedAt],
        ["delivered", res.deliveredAt],
      ] as const)
    : [];
  const reached = steps.filter(([, at]) => at).length;

  return (
    <section className="section-narrow track">
      <form className="track-form" onSubmit={submit} noValidate>
        <label className="fn-field">
          <span>{t.ref}</span>
          <input
            value={ref}
            onChange={(e) => setRef(e.target.value.toUpperCase().replace(/\s/g, "").slice(0, 12))}
            placeholder="BBA-1A2B3C4D"
            autoComplete="off"
            autoCapitalize="characters"
            spellCheck={false}
          />
        </label>
        <label className="fn-field">
          <span>{t.mobile}</span>
          <span className="qo-tel">
            <span aria-hidden="true">+91</span>
            <input
              value={mobile}
              onChange={(e) => setMobile(e.target.value.replace(/\D/g, "").replace(/^91(?=\d{10})/, "").slice(0, 10))}
              inputMode="numeric"
              autoComplete="tel-national"
            />
          </span>
        </label>
        <button type="submit" className="btn btn-lapis" disabled={state.status === "working"}>
          {state.status === "working" ? t.checking : t.submit}
        </button>
        {state.status === "error" && (
          <p className="fn-error" role="alert">
            {state.message}
          </p>
        )}
      </form>

      {res && (
        <div className="track-result" aria-live="polite">
          <p className="fn-kicker">
            <span aria-hidden="true">◆</span> {tf(ui.funnel.order, { ref: res.ref })}
          </p>
          <p className="track-bracelet">
            <span>{t.bracelet}:</span> <b>{res.purposes.join(" + ")}</b>
          </p>
          {res.detailsMissing && (
            <p className="track-note">
              <RichText text={tf(t.detailsMissing, { url: wa(tf(ui.quick.waDetails, { ref: res.ref })) })} />
            </p>
          )}
          {res.status === "cancelled" ? (
            <p className="track-note">{t.cancelled}</p>
          ) : (
            <ol className="track-steps">
              {steps.map(([k, at], i) => (
                <li key={k} className={at ? "is-done" : i === reached ? "is-next" : ""} aria-current={i === reached - 1 ? "step" : undefined}>
                  <span className="track-dot" aria-hidden="true">
                    {at ? "✓" : ""}
                  </span>
                  <span className="track-step">
                    <b>{t.steps[k]}</b>
                    {at && <small>{fmt(at)}</small>}
                    {k === "shipped" && at && (res.courier || res.trackingNumber) && (
                      <small className="track-ship">
                        {res.courier && (
                          <>
                            {t.courier}: {res.courier}
                            <br />
                          </>
                        )}
                        {res.trackingNumber && (
                          <>
                            {t.trackNo}: <span className="track-awb">{res.trackingNumber}</span>
                          </>
                        )}
                      </small>
                    )}
                    {k === "shipped" && at && res.trackingUrl && (
                      <a className="btn btn-gold track-link" href={res.trackingUrl} target="_blank" rel="noopener noreferrer">
                        {t.trackLink} ↗
                      </a>
                    )}
                  </span>
                </li>
              ))}
            </ol>
          )}
          <p className="small-note">
            <RichText text={tf(t.help, { url: wa(tf(t.waText, { ref: res.ref })) })} />
          </p>
        </div>
      )}
    </section>
  );
}
