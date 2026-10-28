"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "../LocaleLink";
import RichText from "../RichText";
import { useLang } from "../LangProvider";
import { tf, type UI } from "@/lib/i18n/ui";
import { INTL_LOCALE } from "@/lib/i18n/config";
import Medallion from "../Medallion";
import Sphere from "../Sphere";
import ProductVisual from "../ProductVisual";
import TrustBar, { type TrustText } from "../TrustBar";
import type { FunnelProduct } from "@/lib/catalog-types";
import type { Content } from "@/lib/content/defaults";
import { fill } from "@/lib/content/fill";
import { formatINR } from "@/lib/format";
import { INDIAN_STATES } from "@/lib/checkoutSchema";
import { deliveryWindow } from "@/lib/delivery";
import { ageFrom, bhagyank, isValidDate, mulank } from "@/lib/numerology";
import { WRIST_OPTIONS, type Gender } from "@/lib/orderForm";
import { track } from "@/lib/analytics";
import { MAX_PURPOSES, extraFor, priceFor, type Tiers } from "@/lib/pricing";
import { PurposeAdd, loadRazorpay, type RzpResponse } from "./parts";

/* ------------------------------------------------------------------ */
/* Steps                                                               */
/* ------------------------------------------------------------------ */

const STEPS = ["who", "gender", "intention", "focus", "proof", "name", "dob", "reveal", "wrist", "matching", "result", "checkout", "confirmed"] as const;
type StepId = (typeof STEPS)[number];
/** Steps that count towards "Question x of y" */
const QUESTIONS: StepId[] = ["who", "gender", "intention", "focus", "name", "dob", "wrist"];


export type FunnelData = {
  products: (FunnelProduct & { listA: string[] })[];
  mulank: { number: number; planet: string; planetHindi: string; traits: string[] }[];
  review: { quote: string; name: string; sourceLabel: string; sourceUrl: string; image?: string } | null;
  copy: Content<"funnel">;
  trust: TrustText;
  refNote: string;
  /** Prices for 1, 2 and 3 purposes in one bracelet */
  tiers: Tiers;
};
const MAX_INTENTIONS = 3;

const THIS_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: THIS_YEAR - 1929 }, (_, i) => THIS_YEAR - i);

type Answers = {
  who?: "me" | "gift";
  gender?: Gender;
  intentions: string[];
  focus?: string;
  firstName: string;
  lastName: string;
  day?: number;
  month?: number;
  year?: number;
  guardian: boolean;
  wrist?: string;
};

const EMPTY: Answers = { intentions: [], firstName: "", lastName: "", guardian: false };


type Contact = {
  deliveryName: string;
  mobile: string;
  email: string;
  line1: string;
  line2: string;
  landmark: string;
  city: string;
  state: string;
  pincode: string;
  giftNote: string;
  consent: boolean;
  marketing: boolean;
};
const EMPTY_CONTACT: Contact = {
  deliveryName: "",
  mobile: "",
  email: "",
  line1: "",
  line2: "",
  landmark: "",
  city: "",
  state: "",
  pincode: "",
  giftNote: "",
  consent: false,
  marketing: false,
};

const contactErrors = (c: Contact, m: UI["funnel"]["errors"]) => {
  const e: Partial<Record<keyof Contact, string>> = {};
  if (!c.deliveryName.trim()) e.deliveryName = m.deliveryName;
  if (!/^[6-9]\d{9}$/.test(c.mobile.trim())) e.mobile = m.mobile;
  if (c.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(c.email.trim())) e.email = m.email;
  if (!c.line1.trim()) e.line1 = m.line1;
  if (!c.city.trim()) e.city = m.city;
  if (!c.state) e.state = m.state;
  if (!/^[1-9]\d{5}$/.test(c.pincode.trim())) e.pincode = m.pincode;
  if (!c.consent) e.consent = m.consent;
  return e;
};

/* ------------------------------------------------------------------ */
/* Small UI pieces                                                     */
/* ------------------------------------------------------------------ */

function Tile({
  selected,
  onClick,
  children,
  badge,
  className = "",
}: {
  selected?: boolean;
  onClick: () => void;
  children: React.ReactNode;
  badge?: React.ReactNode;
  className?: string;
}) {
  return (
    <button type="button" className={`fn-tile ${selected ? "is-selected" : ""} ${className}`.trim()} aria-pressed={selected} onClick={onClick}>
      {children}
      {badge && <span className="fn-badge">{badge}</span>}
    </button>
  );
}

function Glyph({ children }: { children: React.ReactNode }) {
  return (
    <span className="fn-glyph" aria-hidden="true">
      {children}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/* Funnel                                                              */
/* ------------------------------------------------------------------ */

export default function Funnel({ data }: { data: FunnelData }) {
  const { copy, trust } = data;
  const { ui, lang } = useLang();
  const u = ui.funnel;
  const MONTHS = ui.common.months;
  const addLabels = { second: u.addSecond, third: u.addThird, youChose: u.youChose };
  const INTENTION_CHOICES = useMemo(() => data.products.filter((b) => b.inList), [data.products]);
  const MULANK = data.mulank;
  const braceletBySlug = useCallback((slug: string) => data.products.find((b) => b.slug === slug), [data.products]);
  const win = () => deliveryWindow(trust.minDays, trust.maxDays, new Date(), INTL_LOCALE[lang]);
  const [i, setI] = useState(0);
  const [a, setA] = useState<Answers>(EMPTY);
  const [co, setCo] = useState<Contact>(EMPTY_CONTACT);
  const [showErrors, setShowErrors] = useState(false);
  const [payState, setPayState] = useState<{ status: "idle" | "working" | "error"; message?: string }>({ status: "idle" });
  const [orderRef, setOrderRef] = useState("");
  // Extra purposes in the same bracelet (offered at checkout, and after payment).
  const [extras, setExtras] = useState<string[]>([]);
  const [paidPurposes, setPaidPurposes] = useState<string[]>([]);
  const [mainRzpOrder, setMainRzpOrder] = useState("");
  const [topUp, setTopUp] = useState<string[]>([]);
  const [topUpState, setTopUpState] = useState<{ status: "idle" | "working" | "error" | "done"; message?: string }>({ status: "idle" });
  // Coupon: the server decides the discount; this only shows it.
  const [couponOpen, setCouponOpen] = useState(false);
  const [couponInput, setCouponInput] = useState("");
  const [coupon, setCoupon] = useState<{ code: string; discountInr: number; totalInr: number } | null>(null);
  const [couponMsg, setCouponMsg] = useState<{ busy?: boolean; error?: string } | null>(null);
  const couponAuto = useRef(false);
  const appliedCode = useRef("");
  const urlCoupon = useRef("");
  const utmRef = useRef<Record<string, string>>({});
  const headingRef = useRef<HTMLHeadingElement>(null);
  const step = STEPS[i];
  const gift = a.who === "gift";
  const t = (me: string, them: string) => (gift ? them : me);

  /* ---- browser history: back button walks back through the steps ---- */
  const urlFor = (id: StepId) => {
    const p = new URLSearchParams(window.location.search);
    if (id === "who") p.delete("step");
    else p.set("step", id);
    const q = p.toString();
    return `${window.location.pathname}${q ? `?${q}` : ""}`;
  };

  useEffect(() => {
    // Order buttons link here with ?intention=<slug> or ?for=gift to pre-select answers.
    const q = new URLSearchParams(window.location.search);
    q.forEach((v, k) => {
      if (k.startsWith("utm_") && Object.keys(utmRef.current).length < 8) utmRef.current[k] = v.slice(0, 100);
    });
    // Shared offer links can carry ?coupon=CODE; it is applied at checkout.
    const cq = (q.get("coupon") ?? "").trim().toUpperCase().replace(/[^A-Z0-9_-]/g, "").slice(0, 24);
    if (cq) {
      setCouponInput(cq);
      setCouponOpen(true);
      urlCoupon.current = cq;
    }
    const wanted = q.get("intention");
    const preset = INTENTION_CHOICES.some((b) => b.slug === wanted) ? [wanted as string] : [];
    if (preset.length || q.get("for") === "gift") {
      setA((s) => ({ ...s, intentions: preset, who: q.get("for") === "gift" ? "gift" : s.who }));
    }
    // Always start at the beginning: answers live only in memory.
    window.history.replaceState({ fn: 0 }, "", urlFor("who"));
    const onPop = (e: PopStateEvent) => {
      const n = typeof e.state?.fn === "number" ? e.state.fn : 0;
      setI(n);
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  const goTo = useCallback((n: number) => {
    setI(n);
    window.history.pushState({ fn: n }, "", urlFor(STEPS[n]));
    window.scrollTo({ top: 0 });
  }, []);
  const next = useCallback(() => goTo(Math.min(i + 1, STEPS.length - 1)), [goTo, i]);
  const back = () => (i > 0 ? window.history.back() : undefined);

  // Move focus to the new question for keyboard and screen-reader users.
  useEffect(() => {
    headingRef.current?.focus({ preventScroll: true });
    track("funnel_step", { step: STEPS[i], index: i });
    if (STEPS[i] === "result") track("generate_lead", {}, "Lead");
  }, [i]);

  /** Single-choice tiles advance on their own after a short beat. */
  const pick = <K extends keyof Answers>(key: K, value: Answers[K]) => {
    setA((s) => ({ ...s, [key]: value }));
    window.setTimeout(next, 220);
  };

  /* ---- derived values ---- */
  const dobValid = !!(a.day && a.month && a.year && isValidDate(a.day, a.month, a.year) && new Date(a.year, a.month - 1, a.day) <= new Date());
  const age = dobValid ? ageFrom(a.day!, a.month!, a.year!) : undefined;
  const minor = age !== undefined && age < 18;
  const m = dobValid ? mulank(a.day!) : undefined;
  const bh = dobValid ? bhagyank(a.day!, a.month!, a.year!) : undefined;
  const mInfo = MULANK.find((x) => x.number === m);
  const primary = a.intentions[0];
  const recSlug = primary;
  const rec = recSlug ? braceletBySlug(recSlug) : undefined;
  const tiers = data.tiers;
  const listTotal = rec ? priceFor(rec.priceInr, 1 + extras.length, tiers) : 0;
  const total = rec ? (coupon ? coupon.totalInr : listTotal) : 0;
  const nextExtra = rec && extras.length < MAX_PURPOSES - 1 ? extraFor(rec.priceInr, 1 + extras.length, 2 + extras.length, tiers) : null;

  const applyCoupon = useCallback(
    async (raw: string) => {
      if (!rec) return;
      const code = raw.trim().toUpperCase();
      if (!code) {
        setCouponMsg({ error: u.couponEmpty });
        return;
      }
      setCouponMsg({ busy: true });
      const res = await fetch("/api/checkout/coupon", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lang, code, bracelet: rec.slug, extras, mobile: /^[6-9]\d{9}$/.test(co.mobile.trim()) ? co.mobile.trim() : "" }),
      }).catch(() => null);
      const data = res ? await res.json().catch(() => ({})) : {};
      if (res?.ok && data.ok) {
        setCoupon({ code: data.code, discountInr: data.discountInr, totalInr: data.totalInr });
        appliedCode.current = data.code;
        setCouponMsg(null);
        track("apply_coupon", { coupon: data.code, bracelet: rec.slug });
      } else {
        setCoupon(null);
        setCouponMsg({ error: data.error ?? u.couponFailed });
      }
    },
    [rec, co.mobile, extras],
  );

  // A different bracelet means the coupon has to be checked again.
  useEffect(() => {
    setCoupon(null);
    setExtras([]);
    couponAuto.current = false;
  }, [rec?.slug]);
  // Adding or removing a purpose changes the price, so re-check an applied coupon.
  useEffect(() => {
    if (appliedCode.current && step === "checkout") applyCoupon(appliedCode.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [extras]);
  // Apply a code from an offer link once the customer reaches checkout.
  useEffect(() => {
    if (step === "checkout" && urlCoupon.current && !coupon && !couponAuto.current) {
      couponAuto.current = true;
      applyCoupon(urlCoupon.current);
    }
  }, [step, coupon, applyCoupon]);
  const primaryDetail = primary ? braceletBySlug(primary) : undefined;
  const wristChoices =
    a.gender === "female" ? WRIST_OPTIONS.female : a.gender === "male" ? WRIST_OPTIONS.male : [...WRIST_OPTIONS.female, ...WRIST_OPTIONS.male];

  /* ---- matching screen: reveal checklist, then show result ---- */
  const [checks, setChecks] = useState(0);
  useEffect(() => {
    if (step !== "matching") return;
    setChecks(0);
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const gap = reduced ? 120 : 650;
    const timers = [1, 2, 3, 4].map((n) => window.setTimeout(() => setChecks(n), gap * n));
    timers.push(window.setTimeout(() => goTo(STEPS.indexOf("result")), gap * 5));
    return () => timers.forEach(clearTimeout);
  }, [step, goTo]);

  const qIndex = QUESTIONS.indexOf(step);
  const answeredQs = QUESTIONS.filter((q) => STEPS.indexOf(q) < i).length;
  const progress = STEPS.indexOf(step) >= STEPS.indexOf("result") ? 1 : Math.max(0.04, answeredQs / QUESTIONS.length);


  /* ------------------------------------------------------------------ */

  return (
    <div className="fn">
      <header className="fn-top">
        <div className="fn-top-row">
          {i > 0 && step !== "result" && step !== "confirmed" ? (
            <button type="button" className="fn-back" onClick={back} aria-label={u.prevQuestion}>
              ←
            </button>
          ) : (
            <span className="fn-back-spacer" />
          )}
          <Link href="/" className="fn-brand" aria-label={ui.common.homeAria}>
            <Medallion width={26} height={29} />
            <span>Bracelet By Ammit</span>
          </Link>
          <span className="fn-count" aria-live="polite">
            {qIndex >= 0 ? `${qIndex + 1}/${QUESTIONS.length}` : ""}
          </span>
        </div>
        <div
          className="fn-progress"
          role="progressbar"
          aria-label={u.progress}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(progress * 100)}
        >
          <span style={{ width: `${progress * 100}%` }} />
        </div>
      </header>

      <main id="main" className="fn-main">
        <div className="fn-step" key={step}>
          {/* 1 — who */}
          {step === "who" && (
            <>
              <p className="fn-kicker">
                <span aria-hidden="true">◆</span> {copy.introKicker}
              </p>
              <h1 ref={headingRef} tabIndex={-1} className="fn-title is-hero">
                {copy.introTitle}
              </h1>
              <p className="fn-sub">{copy.introText}</p>
              <p className="fn-label">{u.whoLabel}</p>
              <div className="fn-tiles cols-2">
                <Tile selected={a.who === "me"} onClick={() => pick("who", "me")}>
                  <Glyph>◎</Glyph>
                  <span className="fn-tile-title">{u.forMe}</span>
                </Tile>
                <Tile selected={a.who === "gift"} onClick={() => pick("who", "gift")}>
                  <Glyph>❖</Glyph>
                  <span className="fn-tile-title">{u.forGift}</span>
                </Tile>
              </div>
              <p className="fn-fine">{copy.introFine}</p>
            </>
          )}

          {/* 2 — gender */}
          {step === "gender" && (
            <>
              <h1 ref={headingRef} tabIndex={-1} className="fn-title">
                {copy.genderTitle}
              </h1>
              <p className="fn-sub">{copy.genderText}</p>
              <div className="fn-tiles cols-3">
                <Tile selected={a.gender === "female"} onClick={() => pick("gender", "female")}>
                  <Glyph>♀</Glyph>
                  <span className="fn-tile-title">{u.woman}</span>
                </Tile>
                <Tile selected={a.gender === "male"} onClick={() => pick("gender", "male")}>
                  <Glyph>♂</Glyph>
                  <span className="fn-tile-title">{u.man}</span>
                </Tile>
                <Tile selected={a.gender === "other"} onClick={() => pick("gender", "other")}>
                  <Glyph>◇</Glyph>
                  <span className="fn-tile-title">{u.preferNot}</span>
                </Tile>
              </div>
            </>
          )}

          {/* 3 — intentions (pick up to 3, in order) */}
          {step === "intention" && (
            <>
              <h1 ref={headingRef} tabIndex={-1} className="fn-title">
                {t(copy.intentionTitle, copy.intentionTitleGift)}
              </h1>
              <p className="fn-sub">{tf(u.pickUpTo, { n: MAX_INTENTIONS })}</p>
              <div className="fn-tiles is-list">
                {INTENTION_CHOICES.map((b) => {
                  const pos = a.intentions.indexOf(b.slug);
                  const selected = pos >= 0;
                  const full = !selected && a.intentions.length >= MAX_INTENTIONS;
                  return (
                    <Tile
                      key={b.slug}
                      selected={selected}
                      className={full ? "is-dim" : ""}
                      badge={selected ? pos + 1 : undefined}
                      onClick={() =>
                        setA((s) => ({
                          ...s,
                          intentions: selected
                            ? s.intentions.filter((x) => x !== b.slug)
                            : full
                              ? s.intentions
                              : [...s.intentions, b.slug],
                          focus: undefined,
                        }))
                      }
                    >
                      <Sphere color={b.visual.sphere} shade={b.visual.sphereShade} gloss={b.visual.sphereGloss} size={40} />
                      <span className="fn-tile-text">
                        <span className="fn-tile-title">{b.title}</span>
                        <span className="fn-tile-desc">{b.blurb}</span>
                      </span>
                    </Tile>
                  );
                })}
              </div>
              <div className="fn-actions">
                <button type="button" className="btn btn-lapis" disabled={!a.intentions.length} onClick={next}>
                  {ui.common.continue}
                </button>
              </div>
            </>
          )}

          {/* 4 — focus within the first intention */}
          {step === "focus" && primaryDetail && (
            <>
              <h1 ref={headingRef} tabIndex={-1} className="fn-title">
                {t(u.focusTitle, u.focusTitleGift)}
              </h1>
              <p className="fn-sub">{tf(u.focusAbout, { title: lang === "en" ? primaryDetail.title.toLowerCase() : primaryDetail.title })}</p>
              <div className="fn-tiles is-list">
                {[...primaryDetail.listA, u.somethingElse].map((f) => (
                  <Tile key={f} selected={a.focus === f} onClick={() => pick("focus", f)}>
                    <span className="fn-tile-title is-plain">{f}</span>
                  </Tile>
                ))}
              </div>
            </>
          )}

          {/* 5 — social proof (real review) */}
          {step === "proof" && (
            <>
              <h1 ref={headingRef} tabIndex={-1} className="fn-title">
                {copy.proofTitle}
              </h1>
              <p className="fn-sub">{copy.proofText}</p>
              {data.review?.image && (
                <figure className="fn-shot">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={data.review.image}
                    alt={data.review.quote ? `${ui.common.instagramReview}: ${data.review.quote}` : ui.common.instagramScreenshot}
                    loading="lazy"
                  />
                  {data.review.sourceUrl && (
                    <figcaption>
                      <a href={data.review.sourceUrl} target="_blank" rel="noopener noreferrer">
                        {data.review.sourceLabel}
                      </a>
                    </figcaption>
                  )}
                </figure>
              )}
              {data.review && !data.review.image && (
                <figure className="fn-quote">
                  <span className="review-mark" aria-hidden="true">
                    &ldquo;
                  </span>
                  <blockquote>
                    <p>{data.review.quote}</p>
                  </blockquote>
                  <figcaption>
                    {data.review.name}
                    {data.review.sourceUrl && (
                      <>
                        {" · "}
                        <a href={data.review.sourceUrl} target="_blank" rel="noopener noreferrer">
                          {data.review.sourceLabel || ui.common.source}
                        </a>
                      </>
                    )}
                  </figcaption>
                </figure>
              )}
              <div className="fn-actions">
                <button type="button" className="btn btn-lapis" onClick={next}>
                  {ui.common.continue}
                </button>
              </div>
            </>
          )}

          {/* 6 — name */}
          {step === "name" && (
            <form
              className="fn-form"
              onSubmit={(e) => {
                e.preventDefault();
                if (a.firstName.trim()) next();
              }}
            >
              <h1 ref={headingRef} tabIndex={-1} className="fn-title">
                {t(copy.nameTitle, copy.nameTitleGift)}
              </h1>
              <p className="fn-sub">{copy.nameText}</p>
              <div className="fn-fields cols-2">
                <label className="fn-field">
                  <span>{u.firstName}</span>
                  <input
                    value={a.firstName}
                    onChange={(e) => setA((s) => ({ ...s, firstName: e.target.value }))}
                    autoComplete={gift ? "off" : "given-name"}
                    required
                    maxLength={60}
                  />
                </label>
                <label className="fn-field">
                  <span>{u.lastName}</span>
                  <input
                    value={a.lastName}
                    onChange={(e) => setA((s) => ({ ...s, lastName: e.target.value }))}
                    autoComplete={gift ? "off" : "family-name"}
                    maxLength={60}
                  />
                </label>
              </div>
              <div className="fn-actions">
                <button type="submit" className="btn btn-lapis" disabled={!a.firstName.trim()}>
                  {ui.common.continue}
                </button>
              </div>
            </form>
          )}

          {/* 7 — date of birth */}
          {step === "dob" && (
            <form
              className="fn-form"
              onSubmit={(e) => {
                e.preventDefault();
                if (dobValid && (!minor || a.guardian)) next();
              }}
            >
              <h1 ref={headingRef} tabIndex={-1} className="fn-title">
                {t(u.dobTitle, tf(u.dobTitleGift, { name: a.firstName.trim() || u.theWearer }))}
              </h1>
              <p className="fn-sub">{copy.dobText}</p>
              <div className="fn-fields cols-dob">
                <label className="fn-field">
                  <span>{ui.common.day}</span>
                  <select value={a.day ?? ""} onChange={(e) => setA((s) => ({ ...s, day: Number(e.target.value) || undefined }))} required>
                    <option value="">{ui.common.day}</option>
                    {Array.from({ length: 31 }, (_, d) => (
                      <option key={d + 1} value={d + 1}>
                        {d + 1}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="fn-field">
                  <span>{ui.common.month}</span>
                  <select value={a.month ?? ""} onChange={(e) => setA((s) => ({ ...s, month: Number(e.target.value) || undefined }))} required>
                    <option value="">{ui.common.month}</option>
                    {MONTHS.map((mo, idx) => (
                      <option key={mo} value={idx + 1}>
                        {mo}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="fn-field">
                  <span>{ui.common.year}</span>
                  <select value={a.year ?? ""} onChange={(e) => setA((s) => ({ ...s, year: Number(e.target.value) || undefined }))} required>
                    <option value="">{ui.common.year}</option>
                    {YEARS.map((y) => (
                      <option key={y} value={y}>
                        {y}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              {a.day && a.month && a.year && !dobValid && (
                <p className="fn-error" role="alert">
                  {ui.common.badDate}
                </p>
              )}
              {minor && (
                <label className="fn-check">
                  <input type="checkbox" checked={a.guardian} onChange={(e) => setA((s) => ({ ...s, guardian: e.target.checked }))} />
                  <span>{u.minor}</span>
                </label>
              )}
              <div className="fn-actions">
                <button type="submit" className="btn btn-lapis" disabled={!dobValid || (minor && !a.guardian)}>
                  {u.showNumbers}
                </button>
              </div>
            </form>
          )}

          {/* 8 — number reveal (real calculation) */}
          {step === "reveal" && mInfo && (
            <>
              <p className="fn-kicker">
                <span aria-hidden="true">◆</span> {t(u.yourNumbers, a.firstName.trim() ? tf(u.theirNumbers, { name: a.firstName.trim() }) : u.theirNumbersNoName)}
              </p>
              <h1 ref={headingRef} tabIndex={-1} className="fn-title">
                {tf(u.revealTitle, { m, planet: mInfo.planet })}
              </h1>
              <div className="fn-medals" aria-hidden="true">
                <span className="fn-medal">
                  <b>{m}</b>
                  <small>{u.mulank}</small>
                </span>
                <span className="fn-medal is-alt">
                  <b>{bh}</b>
                  <small>{u.bhagyank}</small>
                </span>
              </div>
              <p className="fn-sub">
                {tf(u.revealText, {
                  day: a.day,
                  m,
                  b: bh,
                  planet: `${mInfo.planet}${mInfo.planetHindi && mInfo.planetHindi !== mInfo.planet ? `, ${mInfo.planetHindi}` : ""}`,
                })}
              </p>
              <ul className="fn-traits">
                {mInfo.traits.map((tr) => (
                  <li key={tr}>{tr}</li>
                ))}
              </ul>
              <div className="fn-actions">
                <button type="button" className="btn btn-lapis" onClick={next}>
                  {ui.common.continue}
                </button>
              </div>
            </>
          )}

          {/* 9 — wrist size */}
          {step === "wrist" && (
            <>
              <h1 ref={headingRef} tabIndex={-1} className="fn-title">
                {t(copy.wristTitle, copy.wristTitleGift)}
              </h1>
              <p className="fn-sub">{copy.wristText}</p>
              <div className="fn-tiles cols-3">
                {wristChoices.map((w) => {
                  const [label0, cm] = w.split("-");
                  const label = u.wristLabels[label0] ?? label0;
                  return (
                    <Tile key={w} selected={a.wrist === w} onClick={() => pick("wrist", w)}>
                      <span className="fn-tile-big">{cm}</span>
                      <span className="fn-tile-title">{label}</span>
                    </Tile>
                  );
                })}
              </div>
              <button type="button" className="fn-link" onClick={() => pick("wrist", "unsure")}>
                {u.wristSkip}
              </button>
              <Link className="fn-link" href="/size-guide" target="_blank" rel="noopener noreferrer">
                {u.wristHow}
              </Link>
            </>
          )}

          {/* 10 — matching (honest: these steps really ran) */}
          {step === "matching" && (
            <>
              <h1 ref={headingRef} tabIndex={-1} className="fn-title">
                {copy.matchingTitle}
              </h1>
              <div className="fn-spinner" aria-hidden="true">
                <Medallion width={58} height={64} />
              </div>
              <ul className="fn-checks" aria-live="polite">
                {u.checks.map((c) => tf(c, { m, b: bh })).map((c, n) => (
                  <li key={c} className={checks > n ? "is-done" : ""}>
                    {c}
                  </li>
                ))}
              </ul>
            </>
          )}

          {/* 11 — result */}
          {step === "result" && rec && mInfo && (
            <div className="fn-result">
              <p className="fn-kicker">
                <span aria-hidden="true">◆</span> {gift ? tf(u.forName, { name: a.firstName.trim() }) : tf(u.yourMatch, { name: a.firstName.trim() })}
              </p>
              <h1 ref={headingRef} tabIndex={-1} className="fn-title is-hero">
                {rec.title}
              </h1>
              <div className="fn-result-visual">
                <ProductVisual
                  cards={rec.visual.cards}
                  rings={rec.visual.rings}
                  label={tf(ui.common.illustrationOf, { title: rec.title })}
                  photosLabel={tf(ui.common.photosOf, { title: rec.title })}
                  photos={rec.photos}
                  refNote={data.refNote}
                />
              </div>
              <ul className="fn-chips">
                <li>{tf(u.chipMulank, { m, planet: mInfo.planet })}</li>
                <li>{tf(u.chipBhagyank, { b: bh })}</li>
                {a.focus && a.focus !== u.somethingElse && <li>{a.focus}</li>}
              </ul>
              <p className="fn-sub">
                {rec.blurb}
              </p>
              <div className="fn-crystals">
                <p className="fn-label">{u.crystalsLabel}</p>
                <ul className="chip-list">
                  {rec.crystals.map((c) => (
                    <li key={c}>{c}</li>
                  ))}
                </ul>
                <p className="small-note">{u.crystalsNote}</p>
              </div>
              <p className="fn-price">
                {formatINR(rec.priceInr)} <span>{u.priceNote}</span>
              </p>
              <TrustBar compact text={trust} />
              <div className="fn-actions is-stack">
                <button
                  type="button"
                  className="btn btn-lapis"
                  onClick={() => {
                    setCo((c) => ({ ...c, deliveryName: c.deliveryName || (gift ? "" : `${a.firstName} ${a.lastName}`.trim()) }));
                    goTo(STEPS.indexOf("checkout"));
                  }}
                >
                  {u.confirm}
                </button>
              </div>
              <ol className="num-list fn-next">
                {copy.nextSteps.map((x, i) => (
                  <li key={i}>{fill(x, { minDays: trust.minDays, maxDays: trust.maxDays, price: formatINR(rec.priceInr) })}</li>
                ))}
              </ol>
              <p className="small-note">
                <RichText text={u.agree} newTab />
              </p>
              <div className="fn-result-links">
                <Link href={`/bracelets/${rec.slug}`}>{u.aboutBracelet}</Link>
                <button
                  type="button"
                  className="fn-link"
                  onClick={() => {
                    setA(EMPTY);
                    goTo(0);
                  }}
                >
                  {u.startAgain}
                </button>
              </div>
            </div>
          )}

          {/* 12 — checkout (Razorpay) */}
          {step === "checkout" && rec && dobValid && (
            <form
              className="fn-form fn-checkout"
              noValidate
              onSubmit={async (e) => {
                e.preventDefault();
                const errs = contactErrors(co, u.errors);
                if (Object.keys(errs).length) {
                  setShowErrors(true);
                  return;
                }
                setPayState({ status: "working" });
                track("begin_checkout", { bracelet: rec.slug, value: total, currency: "INR", ...(coupon ? { coupon: coupon.code } : {}) }, "InitiateCheckout");
                try {
                  const res = await fetch("/api/checkout/create", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      lang,
                      bracelet: rec.slug,
                      wearer: {
                        firstName: a.firstName.trim(),
                        lastName: a.lastName.trim(),
                        day: a.day,
                        month: a.month,
                        year: a.year,
                        gender: a.gender,
                        wrist: a.wrist ?? "unsure",
                      },
                      intentions: a.intentions,
                      focus: a.focus ?? "",
                      isGift: gift,
                      giftNote: gift ? co.giftNote : "",
                      contact: { deliveryName: co.deliveryName, mobile: co.mobile.trim(), email: co.email.trim() },
                      address: {
                        line1: co.line1,
                        line2: co.line2,
                        landmark: co.landmark,
                        city: co.city,
                        state: co.state,
                        pincode: co.pincode.trim(),
                      },
                      consent: co.consent,
                      marketing: co.marketing,
                      utm: utmRef.current,
                      ...(coupon ? { coupon: coupon.code } : {}),
                      extras,
                    }),
                  });
                  const data = await res.json().catch(() => ({}));
                  if (!res.ok) {
                    if (data.field === "coupon") {
                      setCoupon(null);
                      setCouponMsg({ error: data.error });
                    }
                    setPayState({ status: "error", message: data.error ?? u.payGeneric });
                    return;
                  }
                  if (!(await loadRazorpay()) || !window.Razorpay) {
                    setPayState({ status: "error", message: u.payLoad });
                    return;
                  }
                  const rzp = new window.Razorpay({
                    key: data.keyId,
                    order_id: data.orderId,
                    amount: data.amount,
                    currency: data.currency,
                    name: "Bracelet By Ammit",
                    description: tf(u.rzpDescription, { title: [rec.title, ...extras.map((x) => braceletBySlug(x)?.title ?? x)].join(" + ") }),
                    image: `${window.location.origin}/brand/emblem.png`,
                    prefill: { name: co.deliveryName, email: co.email.trim() || undefined, contact: `+91${co.mobile.trim()}` },
                    notes: { ref: data.ref },
                    theme: { color: "#050E8F" },
                    modal: {
                      ondismiss: () => setPayState({ status: "error", message: u.payDismissed }),
                    },
                    handler: async (r: RzpResponse) => {
                      setPayState({ status: "working", message: u.confirming });
                      const v = await fetch("/api/checkout/verify", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify(r),
                      }).catch(() => null);
                      const vd = v ? await v.json().catch(() => ({})) : {};
                      if (v && v.ok) {
                        setOrderRef(data.ref);
                        setMainRzpOrder(data.orderId);
                        setPaidPurposes([rec.slug, ...extras]);
                        setPayState({ status: "idle" });
                        track("purchase", { transaction_id: data.ref, value: data.amount / 100, currency: "INR", ...(coupon ? { coupon: coupon.code } : {}) }, "Purchase");
                        goTo(STEPS.indexOf("confirmed"));
                      } else {
                        setPayState({
                          status: "error",
                          message: vd.error ?? tf(u.payUnconfirmed, { ref: data.ref }),
                        });
                      }
                    },
                  });
                  rzp.on("payment.failed", (r) =>
                    setPayState({ status: "error", message: r.error?.description ?? u.payFailed }),
                  );
                  rzp.open();
                } catch {
                  setPayState({ status: "error", message: u.payGeneric });
                }
              }}
            >
              <h1 ref={headingRef} tabIndex={-1} className="fn-title">
                {copy.checkoutTitle}
              </h1>

              <div className="fn-summary" aria-label={u.summary}>
                <div className="fn-summary-row">
                  <span>
                    <b>{rec.title}</b>
                    <small>
                      {tf(u.summaryFor, { name: a.firstName.trim(), m, b: bh })}
                      {a.wrist && a.wrist !== "unsure" ? ` · ${a.wrist}` : ""}
                    </small>
                  </span>
                  <span>{formatINR(rec.priceInr)}</span>
                </div>
                {extras.map((x, n) => (
                  <div className="fn-summary-row is-extra" key={x}>
                    <span>
                      + {braceletBySlug(x)?.title ?? x}
                      <small>{n === 0 ? u.second : u.third}</small>
                    </span>
                    <span>+{formatINR(extraFor(rec.priceInr, 1 + n, 2 + n, tiers))}</span>
                  </div>
                ))}
                {coupon && (
                  <div className="fn-summary-row is-discount">
                    <span>
                      {u.coupon} <b className="fn-coupon-code">{coupon.code}</b>{" "}
                      <button
                        type="button"
                        className="fn-link"
                        onClick={() => {
                          setCoupon(null);
                          setCouponMsg(null);
                          appliedCode.current = "";
                        }}
                      >
                        {u.remove}
                      </button>
                    </span>
                    <span>−{formatINR(coupon.discountInr)}</span>
                  </div>
                )}
                <div className="fn-summary-row">
                  <span>{u.shipping}</span>
                  <span>{u.free}</span>
                </div>
                <div className="fn-summary-row is-total">
                  <span>{u.total}</span>
                  <span>{formatINR(total)}</span>
                </div>
                {!coupon &&
                  (couponOpen ? (
                    <div className="fn-coupon">
                      <label className="sr-only" htmlFor="fn-coupon-input">
                        {u.couponLabel}
                      </label>
                      <input
                        id="fn-coupon-input"
                        value={couponInput}
                        onChange={(e) => {
                          setCouponInput(e.target.value.toUpperCase().replace(/\s+/g, "").slice(0, 24));
                          setCouponMsg(null);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            applyCoupon(couponInput);
                          }
                        }}
                        placeholder={u.couponPlaceholder}
                        autoComplete="off"
                        autoCapitalize="characters"
                        spellCheck={false}
                        aria-invalid={!!couponMsg?.error}
                        aria-describedby={couponMsg?.error ? "fn-coupon-err" : undefined}
                      />
                      <button type="button" className="btn btn-line" onClick={() => applyCoupon(couponInput)} disabled={!!couponMsg?.busy}>
                        {couponMsg?.busy ? u.checking : u.apply}
                      </button>
                      {couponMsg?.error && (
                        <em className="fn-err" id="fn-coupon-err" role="alert">
                          {couponMsg.error}
                        </em>
                      )}
                    </div>
                  ) : (
                    <button type="button" className="fn-link fn-coupon-open" onClick={() => setCouponOpen(true)}>
                      {u.haveCoupon}
                    </button>
                  ))}
                <p className="fn-summary-eta">{tf(u.eta, { dates: win() })}</p>
              </div>

              <PurposeAdd
                idBase="fn-add"
                title={gift ? u.addTitleGift : u.addTitle}
                text={u.addText}
                labels={addLabels}
                choices={INTENTION_CHOICES.map((b) => ({ slug: b.slug, title: b.title }))}
                suggested={a.intentions.filter((x) => x !== rec.slug)}
                locked={[rec.slug]}
                selected={extras}
                onChange={setExtras}
                nextPrice={nextExtra}
              />

              <fieldset className="fn-fieldset">
                <legend>{u.contact}</legend>
                <div className="fn-fields cols-2">
                  <label className="fn-field">
                    <span>{u.deliveryName}</span>
                    <input value={co.deliveryName} onChange={(e) => setCo({ ...co, deliveryName: e.target.value })} autoComplete="name" maxLength={80} aria-invalid={showErrors && !!contactErrors(co, u.errors).deliveryName} />
                    {showErrors && contactErrors(co, u.errors).deliveryName && <em className="fn-err">{contactErrors(co, u.errors).deliveryName}</em>}
                  </label>
                  <label className="fn-field">
                    <span>{u.mobile}</span>
                    <input value={co.mobile} onChange={(e) => setCo({ ...co, mobile: e.target.value.replace(/[^\d]/g, "").slice(0, 10) })} inputMode="numeric" autoComplete="tel-national" placeholder={u.mobilePlaceholder} aria-invalid={showErrors && !!contactErrors(co, u.errors).mobile} />
                    {showErrors && contactErrors(co, u.errors).mobile && <em className="fn-err">{contactErrors(co, u.errors).mobile}</em>}
                  </label>
                </div>
                <label className="fn-field">
                  <span>{u.email}</span>
                  <input type="email" value={co.email} onChange={(e) => setCo({ ...co, email: e.target.value })} autoComplete="email" maxLength={120} aria-invalid={showErrors && !!contactErrors(co, u.errors).email} />
                  {showErrors && contactErrors(co, u.errors).email && <em className="fn-err">{contactErrors(co, u.errors).email}</em>}
                </label>
              </fieldset>

              <fieldset className="fn-fieldset">
                <legend>{u.address}</legend>
                <label className="fn-field">
                  <span>{u.line1}</span>
                  <input value={co.line1} onChange={(e) => setCo({ ...co, line1: e.target.value })} autoComplete="address-line1" maxLength={120} aria-invalid={showErrors && !!contactErrors(co, u.errors).line1} />
                  {showErrors && contactErrors(co, u.errors).line1 && <em className="fn-err">{contactErrors(co, u.errors).line1}</em>}
                </label>
                <label className="fn-field">
                  <span>{u.line2}</span>
                  <input value={co.line2} onChange={(e) => setCo({ ...co, line2: e.target.value })} autoComplete="address-line2" maxLength={120} />
                </label>
                <label className="fn-field">
                  <span>{u.landmark}</span>
                  <input value={co.landmark} onChange={(e) => setCo({ ...co, landmark: e.target.value })} maxLength={80} />
                </label>
                <div className="fn-fields cols-3-addr">
                  <label className="fn-field">
                    <span>{u.city}</span>
                    <input value={co.city} onChange={(e) => setCo({ ...co, city: e.target.value })} autoComplete="address-level2" maxLength={60} aria-invalid={showErrors && !!contactErrors(co, u.errors).city} />
                    {showErrors && contactErrors(co, u.errors).city && <em className="fn-err">{contactErrors(co, u.errors).city}</em>}
                  </label>
                  <label className="fn-field">
                    <span>{u.state}</span>
                    <select value={co.state} onChange={(e) => setCo({ ...co, state: e.target.value })} autoComplete="address-level1" aria-invalid={showErrors && !!contactErrors(co, u.errors).state}>
                      <option value="">{u.chooseState}</option>
                      {INDIAN_STATES.map((st) => (
                        <option key={st} value={st}>
                          {st}
                        </option>
                      ))}
                    </select>
                    {showErrors && contactErrors(co, u.errors).state && <em className="fn-err">{contactErrors(co, u.errors).state}</em>}
                  </label>
                  <label className="fn-field">
                    <span>{u.pincode}</span>
                    <input value={co.pincode} onChange={(e) => setCo({ ...co, pincode: e.target.value.replace(/[^\d]/g, "").slice(0, 6) })} inputMode="numeric" autoComplete="postal-code" aria-invalid={showErrors && !!contactErrors(co, u.errors).pincode} />
                    {showErrors && contactErrors(co, u.errors).pincode && <em className="fn-err">{contactErrors(co, u.errors).pincode}</em>}
                  </label>
                </div>
              </fieldset>

              {gift && (
                <label className="fn-field">
                  <span>{u.giftNote}</span>
                  <textarea rows={2} value={co.giftNote} onChange={(e) => setCo({ ...co, giftNote: e.target.value })} maxLength={240} />
                </label>
              )}

              <label className="fn-check">
                <input type="checkbox" checked={co.consent} onChange={(e) => setCo({ ...co, consent: e.target.checked })} />
                <span>
                  <RichText text={u.consent} newTab />
                </span>
              </label>
              {showErrors && contactErrors(co, u.errors).consent && <em className="fn-err">{contactErrors(co, u.errors).consent}</em>}
              <label className="fn-check is-light">
                <input type="checkbox" checked={co.marketing} onChange={(e) => setCo({ ...co, marketing: e.target.checked })} />
                <span>{u.marketing}</span>
              </label>

              {payState.status === "error" && (
                <p className="fn-error" role="alert">
                  {payState.message}
                </p>
              )}
              <div className="fn-actions is-stack">
                <button type="submit" className="btn btn-lapis" disabled={payState.status === "working"}>
                  {payState.status === "working" ? payState.message ?? u.opening : tf(u.pay, { amount: formatINR(total) })}
                </button>
              </div>
              <TrustBar compact text={trust} />
              <p className="small-note">{u.razorpayNote}</p>
            </form>
          )}

          {/* 13 — confirmed */}
          {step === "confirmed" && rec && (
            <div className="fn-result">
              <p className="fn-kicker">
                <span aria-hidden="true">◆</span> {tf(u.order, { ref: orderRef })}
              </p>
              <h1 ref={headingRef} tabIndex={-1} className="fn-title is-hero">
                {a.firstName.trim() && !gift ? tf(u.thankYouName, { name: a.firstName.trim() }) : u.thankYou}
              </h1>
              <p className="fn-sub">
                {fill(copy.confirmedText, { title: rec.title, ref: orderRef })}
              </p>
              {paidPurposes.length > 0 && paidPurposes.length < MAX_PURPOSES && mainRzpOrder && topUpState.status !== "done" && (
                <div className="fn-topup">
                  <PurposeAdd
                    idBase="fn-topup"
                    title={u.topUpTitle}
                    text={paidPurposes.length === 1 ? u.topUpText2 : u.topUpText3}
                    labels={addLabels}
                    choices={INTENTION_CHOICES.map((b) => ({ slug: b.slug, title: b.title }))}
                    suggested={a.intentions.filter((x) => !paidPurposes.includes(x))}
                    locked={paidPurposes}
                    selected={topUp}
                    onChange={setTopUp}
                    nextPrice={
                      paidPurposes.length + topUp.length < MAX_PURPOSES
                        ? extraFor(rec.priceInr, paidPurposes.length + topUp.length, paidPurposes.length + topUp.length + 1, tiers)
                        : null
                    }
                  />
                  {topUp.length > 0 && (
                    <button
                      type="button"
                      className="btn btn-gold"
                      disabled={topUpState.status === "working"}
                      onClick={async () => {
                        setTopUpState({ status: "working" });
                        try {
                          const res = await fetch("/api/checkout/upgrade", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ lang, orderId: mainRzpOrder, add: topUp }),
                          });
                          const d = await res.json().catch(() => ({}));
                          if (!res.ok) return setTopUpState({ status: "error", message: d.error ?? u.payGeneric });
                          if (!(await loadRazorpay()) || !window.Razorpay) return setTopUpState({ status: "error", message: u.payLoad });
                          const added = topUp.map((x) => braceletBySlug(x)?.title ?? x);
                          const rzp = new window.Razorpay({
                            key: d.keyId,
                            order_id: d.orderId,
                            amount: d.amount,
                            currency: d.currency,
                            name: "Bracelet By Ammit",
                            description: tf(u.rzpTopUp, { title: added.join(" + "), ref: d.ref }),
                            image: `${window.location.origin}/brand/emblem.png`,
                            prefill: d.prefill,
                            notes: { ref: d.ref },
                            theme: { color: "#050E8F" },
                            modal: { ondismiss: () => setTopUpState({ status: "idle" }) },
                            handler: async (r: RzpResponse) => {
                              setTopUpState({ status: "working", message: u.confirming });
                              const v = await fetch("/api/checkout/verify", {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify(r),
                              }).catch(() => null);
                              if (v?.ok) {
                                setPaidPurposes((p) => [...p, ...topUp]);
                                setTopUp([]);
                                setTopUpState({ status: "done", message: tf(u.topUpDone, { titles: added.join(u.and) }) });
                                track("purchase", { transaction_id: `${d.ref}-up`, value: d.amount / 100, currency: "INR", upgrade: 1 }, "Purchase");
                              } else {
                                setTopUpState({ status: "error", message: tf(u.topUpUnconfirmed, { ref: d.ref }) });
                              }
                            },
                          });
                          rzp.on("payment.failed", (r) => setTopUpState({ status: "error", message: r.error?.description ?? u.payFailed }));
                          rzp.open();
                        } catch {
                          setTopUpState({ status: "error", message: u.payGeneric });
                        }
                      }}
                    >
                      {topUpState.status === "working"
                        ? topUpState.message ?? u.opening
                        : tf(u.topUpButton, { amount: formatINR(extraFor(rec.priceInr, paidPurposes.length, paidPurposes.length + topUp.length, tiers)) })}
                    </button>
                  )}
                  {topUpState.status === "error" && (
                    <p className="fn-error" role="alert">
                      {topUpState.message}
                    </p>
                  )}
                </div>
              )}
              {topUpState.status === "done" && (
                <p className="fn-topup-done" role="status">
                  {topUpState.message}
                </p>
              )}
              <ol className="num-list fn-next">
                <li>{gift ? tf(u.nextThem, { name: a.firstName.trim() }) : u.nextYou}</li>
                <li>{tf(u.nextWhatsApp, { mobile: co.mobile })}</li>
                <li>{tf(u.nextDelivery, { dates: win() })}</li>
              </ol>
              <div className="fn-actions is-stack">
                <Link className="btn btn-lapis" href="/">
                  {u.backHome}
                </Link>
              </div>
              <p className="small-note">{tf(u.questions, { ref: orderRef })}</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
