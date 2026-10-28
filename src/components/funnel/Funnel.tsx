"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
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

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
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

type RzpResponse = { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string };
type RzpInstance = { open: () => void; on: (e: string, cb: (r: { error?: { description?: string } }) => void) => void };
declare global {
  interface Window {
    Razorpay?: new (opts: Record<string, unknown>) => RzpInstance;
  }
}

function loadRazorpay(): Promise<boolean> {
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

const contactErrors = (c: Contact) => {
  const e: Partial<Record<keyof Contact, string>> = {};
  if (!c.deliveryName.trim()) e.deliveryName = "Enter the name for delivery";
  if (!/^[6-9]\d{9}$/.test(c.mobile.trim())) e.mobile = "Enter a 10-digit mobile number";
  if (c.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(c.email.trim())) e.email = "Check your email address";
  if (!c.line1.trim()) e.line1 = "Enter flat / house number and building";
  if (!c.city.trim()) e.city = "Enter your city";
  if (!c.state) e.state = "Choose your state";
  if (!/^[1-9]\d{5}$/.test(c.pincode.trim())) e.pincode = "Enter a 6-digit PIN code";
  if (!c.consent) e.consent = "Please accept the terms to continue";
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

/**
 * "Add another purpose to the same bracelet": chips for the other purposes,
 * the ones the customer already picked in the reading first.
 */
function PurposeAdd({
  choices,
  suggested,
  selected,
  locked,
  onChange,
  nextPrice,
  title,
  text,
  idBase,
}: {
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
              {locked.length + selected.length === 1 ? "2nd purpose" : "3rd purpose"}: +{formatINR(nextPrice)}
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
                  {suggested.includes(c.slug) && !on && <small>You chose this</small>}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Funnel                                                              */
/* ------------------------------------------------------------------ */

export default function Funnel({ data }: { data: FunnelData }) {
  const { copy, trust } = data;
  const INTENTION_CHOICES = useMemo(() => data.products.filter((b) => b.inList), [data.products]);
  const MULANK = data.mulank;
  const braceletBySlug = useCallback((slug: string) => data.products.find((b) => b.slug === slug), [data.products]);
  const win = () => deliveryWindow(trust.minDays, trust.maxDays);
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
        setCouponMsg({ error: "Enter a coupon code." });
        return;
      }
      setCouponMsg({ busy: true });
      const res = await fetch("/api/checkout/coupon", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, bracelet: rec.slug, extras, mobile: /^[6-9]\d{9}$/.test(co.mobile.trim()) ? co.mobile.trim() : "" }),
      }).catch(() => null);
      const data = res ? await res.json().catch(() => ({})) : {};
      if (res?.ok && data.ok) {
        setCoupon({ code: data.code, discountInr: data.discountInr, totalInr: data.totalInr });
        appliedCode.current = data.code;
        setCouponMsg(null);
        track("apply_coupon", { coupon: data.code, bracelet: rec.slug });
      } else {
        setCoupon(null);
        setCouponMsg({ error: data.error ?? "Couldn't check the coupon. Please try again." });
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
            <button type="button" className="fn-back" onClick={back} aria-label="Previous question">
              ←
            </button>
          ) : (
            <span className="fn-back-spacer" />
          )}
          <Link href="/" className="fn-brand" aria-label="Bracelet By Ammit home">
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
          aria-label="Quiz progress"
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
              <p className="fn-label">Who is the bracelet for?</p>
              <div className="fn-tiles cols-2">
                <Tile selected={a.who === "me"} onClick={() => pick("who", "me")}>
                  <Glyph>◎</Glyph>
                  <span className="fn-tile-title">For me</span>
                </Tile>
                <Tile selected={a.who === "gift"} onClick={() => pick("who", "gift")}>
                  <Glyph>❖</Glyph>
                  <span className="fn-tile-title">A gift for someone</span>
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
                  <span className="fn-tile-title">Woman</span>
                </Tile>
                <Tile selected={a.gender === "male"} onClick={() => pick("gender", "male")}>
                  <Glyph>♂</Glyph>
                  <span className="fn-tile-title">Man</span>
                </Tile>
                <Tile selected={a.gender === "other"} onClick={() => pick("gender", "other")}>
                  <Glyph>◇</Glyph>
                  <span className="fn-tile-title">Prefer not to say</span>
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
              <p className="fn-sub">Pick up to {MAX_INTENTIONS}, most important first.</p>
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
                  Continue
                </button>
              </div>
            </>
          )}

          {/* 4 — focus within the first intention */}
          {step === "focus" && primaryDetail && (
            <>
              <h1 ref={headingRef} tabIndex={-1} className="fn-title">
                {t("Which of these sounds most like you?", "Which of these sounds most like them?")}
              </h1>
              <p className="fn-sub">About {primaryDetail.title.toLowerCase()}.</p>
              <div className="fn-tiles is-list">
                {[...primaryDetail.listA, "Something else"].map((f) => (
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
                    alt={data.review.quote ? `Instagram review: ${data.review.quote}` : "Instagram review screenshot"}
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
                          {data.review.sourceLabel || "Source"}
                        </a>
                      </>
                    )}
                  </figcaption>
                </figure>
              )}
              <div className="fn-actions">
                <button type="button" className="btn btn-lapis" onClick={next}>
                  Continue
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
                  <span>First name</span>
                  <input
                    value={a.firstName}
                    onChange={(e) => setA((s) => ({ ...s, firstName: e.target.value }))}
                    autoComplete={gift ? "off" : "given-name"}
                    required
                    maxLength={60}
                  />
                </label>
                <label className="fn-field">
                  <span>Last name</span>
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
                  Continue
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
                {t("When were you born?", `When was ${a.firstName.trim() || "the wearer"} born?`)}
              </h1>
              <p className="fn-sub">{copy.dobText}</p>
              <div className="fn-fields cols-dob">
                <label className="fn-field">
                  <span>Day</span>
                  <select value={a.day ?? ""} onChange={(e) => setA((s) => ({ ...s, day: Number(e.target.value) || undefined }))} required>
                    <option value="">Day</option>
                    {Array.from({ length: 31 }, (_, d) => (
                      <option key={d + 1} value={d + 1}>
                        {d + 1}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="fn-field">
                  <span>Month</span>
                  <select value={a.month ?? ""} onChange={(e) => setA((s) => ({ ...s, month: Number(e.target.value) || undefined }))} required>
                    <option value="">Month</option>
                    {MONTHS.map((mo, idx) => (
                      <option key={mo} value={idx + 1}>
                        {mo}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="fn-field">
                  <span>Year</span>
                  <select value={a.year ?? ""} onChange={(e) => setA((s) => ({ ...s, year: Number(e.target.value) || undefined }))} required>
                    <option value="">Year</option>
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
                  That date doesn&apos;t exist. Please check the day and month.
                </p>
              )}
              {minor && (
                <label className="fn-check">
                  <input type="checkbox" checked={a.guardian} onChange={(e) => setA((s) => ({ ...s, guardian: e.target.checked }))} />
                  <span>The wearer is under 18. I&apos;m their parent or guardian and I&apos;m placing this order for them.</span>
                </label>
              )}
              <div className="fn-actions">
                <button type="submit" className="btn btn-lapis" disabled={!dobValid || (minor && !a.guardian)}>
                  Show my numbers
                </button>
              </div>
            </form>
          )}

          {/* 8 — number reveal (real calculation) */}
          {step === "reveal" && mInfo && (
            <>
              <p className="fn-kicker">
                <span aria-hidden="true">◆</span> {t("Your numbers", `${a.firstName.trim() || "Their"}'s numbers`)}
              </p>
              <h1 ref={headingRef} tabIndex={-1} className="fn-title">
                Mulank {m}, ruled by {mInfo.planet}
              </h1>
              <div className="fn-medals" aria-hidden="true">
                <span className="fn-medal">
                  <b>{m}</b>
                  <small>Mulank</small>
                </span>
                <span className="fn-medal is-alt">
                  <b>{bh}</b>
                  <small>Bhagyank</small>
                </span>
              </div>
              <p className="fn-sub">
                Born on the {a.day}
                {a.day === 1 || a.day === 21 || a.day === 31 ? "st" : a.day === 2 || a.day === 22 ? "nd" : a.day === 3 || a.day === 23 ? "rd" : "th"}, so the
                mulank is {m} ({mInfo.planet}{mInfo.planetHindi !== mInfo.planet ? `, ${mInfo.planetHindi}` : ""}). Adding every digit of the full date gives a bhagyank of {bh}.
              </p>
              <ul className="fn-traits">
                {mInfo.traits.map((tr) => (
                  <li key={tr}>{tr}</li>
                ))}
              </ul>
              <div className="fn-actions">
                <button type="button" className="btn btn-lapis" onClick={next}>
                  Continue
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
                  const [label, cm] = w.split("-");
                  return (
                    <Tile key={w} selected={a.wrist === w} onClick={() => pick("wrist", w)}>
                      <span className="fn-tile-big">{cm}</span>
                      <span className="fn-tile-title">{label}</span>
                    </Tile>
                  );
                })}
              </div>
              <button type="button" className="fn-link" onClick={() => pick("wrist", "unsure")}>
                Not sure? Skip, and the team will confirm on WhatsApp
              </button>
              <a className="fn-link" href="/size-guide" target="_blank" rel="noopener noreferrer">
                How to measure (opens the size guide)
              </a>
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
                {[`Mulank ${m} worked out`, `Bhagyank ${bh} worked out`, "Intentions matched", "Crystals shortlisted"].map((c, n) => (
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
                <span aria-hidden="true">◆</span> {gift ? `For ${a.firstName.trim()}` : `${a.firstName.trim()}, your match`}
              </p>
              <h1 ref={headingRef} tabIndex={-1} className="fn-title is-hero">
                {rec.title}
              </h1>
              <div className="fn-result-visual">
                <ProductVisual cards={rec.visual.cards} rings={rec.visual.rings} label={`Illustration of the ${rec.title} bracelet`} photos={rec.photos} refNote={data.refNote} />
              </div>
              <ul className="fn-chips">
                <li>
                  Mulank {m} · {mInfo.planet}
                </li>
                <li>Bhagyank {bh}</li>
                {a.focus && a.focus !== "Something else" && <li>{a.focus}</li>}
              </ul>
              <p className="fn-sub">
                {rec.blurb}
              </p>
              <div className="fn-crystals">
                <p className="fn-label">Crystals often used</p>
                <ul className="chip-list">
                  {rec.crystals.map((c) => (
                    <li key={c}>{c}</li>
                  ))}
                </ul>
                <p className="small-note">Ammit confirms the final stones after reading the full name and date of birth.</p>
              </div>
              <p className="fn-price">
                {formatINR(rec.priceInr)} <span>read for your numbers · strung by hand</span>
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
                  Confirm my order
                </button>
              </div>
              <ol className="num-list fn-next">
                {copy.nextSteps.map((x, i) => (
                  <li key={i}>{fill(x, { minDays: trust.minDays, maxDays: trust.maxDays, price: formatINR(rec.priceInr) })}</li>
                ))}
              </ol>
              <p className="small-note">
                By ordering you agree to our{" "}
                <a href="/terms" target="_blank" rel="noopener noreferrer">
                  terms
                </a>{" "}
                and{" "}
                <a href="/privacy" target="_blank" rel="noopener noreferrer">
                  privacy policy
                </a>
                . See also{" "}
                <a href="/shipping" target="_blank" rel="noopener noreferrer">
                  shipping
                </a>{" "}
                and{" "}
                <a href="/returns" target="_blank" rel="noopener noreferrer">
                  returns
                </a>
                .
              </p>
              <div className="fn-result-links">
                <Link href={`/bracelets/${rec.slug}`}>About this bracelet</Link>
                <button
                  type="button"
                  className="fn-link"
                  onClick={() => {
                    setA(EMPTY);
                    goTo(0);
                  }}
                >
                  Start again
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
                const errs = contactErrors(co);
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
                    setPayState({ status: "error", message: data.error ?? "Something went wrong. Please try again." });
                    return;
                  }
                  if (!(await loadRazorpay()) || !window.Razorpay) {
                    setPayState({ status: "error", message: "The payment window couldn't load. Check your connection and try again." });
                    return;
                  }
                  const rzp = new window.Razorpay({
                    key: data.keyId,
                    order_id: data.orderId,
                    amount: data.amount,
                    currency: data.currency,
                    name: "Bracelet By Ammit",
                    description: `${[rec.title, ...extras.map((x) => braceletBySlug(x)?.title ?? x)].join(" + ")} bracelet`,
                    image: `${window.location.origin}/brand/emblem.png`,
                    prefill: { name: co.deliveryName, email: co.email.trim() || undefined, contact: `+91${co.mobile.trim()}` },
                    notes: { ref: data.ref },
                    theme: { color: "#050E8F" },
                    modal: {
                      ondismiss: () => setPayState({ status: "error", message: "Payment wasn't completed. You can try again." }),
                    },
                    handler: async (r: RzpResponse) => {
                      setPayState({ status: "working", message: "Confirming your payment…" });
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
                          message: vd.error ?? `We couldn't confirm the payment. If money was taken, contact us (details at the bottom of the page) with reference ${data.ref}.`,
                        });
                      }
                    },
                  });
                  rzp.on("payment.failed", (r) =>
                    setPayState({ status: "error", message: r.error?.description ?? "Payment failed. Please try again." }),
                  );
                  rzp.open();
                } catch {
                  setPayState({ status: "error", message: "Something went wrong. Please try again." });
                }
              }}
            >
              <h1 ref={headingRef} tabIndex={-1} className="fn-title">
                {copy.checkoutTitle}
              </h1>

              <div className="fn-summary" aria-label="Order summary">
                <div className="fn-summary-row">
                  <span>
                    <b>{rec.title}</b>
                    <small>
                      For {a.firstName.trim()} · Mulank {m} · Bhagyank {bh}
                      {a.wrist && a.wrist !== "unsure" ? ` · ${a.wrist}` : ""}
                    </small>
                  </span>
                  <span>{formatINR(rec.priceInr)}</span>
                </div>
                {extras.map((x, n) => (
                  <div className="fn-summary-row is-extra" key={x}>
                    <span>
                      + {braceletBySlug(x)?.title ?? x}
                      <small>{n === 0 ? "2nd purpose, same bracelet" : "3rd purpose, same bracelet"}</small>
                    </span>
                    <span>+{formatINR(extraFor(rec.priceInr, 1 + n, 2 + n, tiers))}</span>
                  </div>
                ))}
                {coupon && (
                  <div className="fn-summary-row is-discount">
                    <span>
                      Coupon <b className="fn-coupon-code">{coupon.code}</b>{" "}
                      <button
                        type="button"
                        className="fn-link"
                        onClick={() => {
                          setCoupon(null);
                          setCouponMsg(null);
                          appliedCode.current = "";
                        }}
                      >
                        Remove
                      </button>
                    </span>
                    <span>−{formatINR(coupon.discountInr)}</span>
                  </div>
                )}
                <div className="fn-summary-row">
                  <span>Shipping</span>
                  <span>Free</span>
                </div>
                <div className="fn-summary-row is-total">
                  <span>Total</span>
                  <span>{formatINR(total)}</span>
                </div>
                {!coupon &&
                  (couponOpen ? (
                    <div className="fn-coupon">
                      <label className="sr-only" htmlFor="fn-coupon-input">
                        Coupon code
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
                        placeholder="Coupon code"
                        autoComplete="off"
                        autoCapitalize="characters"
                        spellCheck={false}
                        aria-invalid={!!couponMsg?.error}
                        aria-describedby={couponMsg?.error ? "fn-coupon-err" : undefined}
                      />
                      <button type="button" className="btn btn-line" onClick={() => applyCoupon(couponInput)} disabled={!!couponMsg?.busy}>
                        {couponMsg?.busy ? "Checking…" : "Apply"}
                      </button>
                      {couponMsg?.error && (
                        <em className="fn-err" id="fn-coupon-err" role="alert">
                          {couponMsg.error}
                        </em>
                      )}
                    </div>
                  ) : (
                    <button type="button" className="fn-link fn-coupon-open" onClick={() => setCouponOpen(true)}>
                      Have a coupon code?
                    </button>
                  ))}
                <p className="fn-summary-eta">Estimated delivery: {win()}</p>
              </div>

              <PurposeAdd
                idBase="fn-add"
                title={gift ? "Add another purpose to their bracelet" : "Add another purpose to the same bracelet"}
                text="Ammit can design one bracelet for up to 3 purposes, balancing the crystals for all of them."
                choices={INTENTION_CHOICES.map((b) => ({ slug: b.slug, title: b.title }))}
                suggested={a.intentions.filter((x) => x !== rec.slug)}
                locked={[rec.slug]}
                selected={extras}
                onChange={setExtras}
                nextPrice={nextExtra}
              />

              <fieldset className="fn-fieldset">
                <legend>Contact</legend>
                <div className="fn-fields cols-2">
                  <label className="fn-field">
                    <span>Full name for delivery</span>
                    <input value={co.deliveryName} onChange={(e) => setCo({ ...co, deliveryName: e.target.value })} autoComplete="name" maxLength={80} aria-invalid={showErrors && !!contactErrors(co).deliveryName} />
                    {showErrors && contactErrors(co).deliveryName && <em className="fn-err">{contactErrors(co).deliveryName}</em>}
                  </label>
                  <label className="fn-field">
                    <span>Mobile number (for WhatsApp updates)</span>
                    <input value={co.mobile} onChange={(e) => setCo({ ...co, mobile: e.target.value.replace(/[^\d]/g, "").slice(0, 10) })} inputMode="numeric" autoComplete="tel-national" placeholder="10 digits" aria-invalid={showErrors && !!contactErrors(co).mobile} />
                    {showErrors && contactErrors(co).mobile && <em className="fn-err">{contactErrors(co).mobile}</em>}
                  </label>
                </div>
                <label className="fn-field">
                  <span>Email (optional, for your receipt)</span>
                  <input type="email" value={co.email} onChange={(e) => setCo({ ...co, email: e.target.value })} autoComplete="email" maxLength={120} aria-invalid={showErrors && !!contactErrors(co).email} />
                  {showErrors && contactErrors(co).email && <em className="fn-err">{contactErrors(co).email}</em>}
                </label>
              </fieldset>

              <fieldset className="fn-fieldset">
                <legend>Delivery address</legend>
                <label className="fn-field">
                  <span>Flat / house no. and building</span>
                  <input value={co.line1} onChange={(e) => setCo({ ...co, line1: e.target.value })} autoComplete="address-line1" maxLength={120} aria-invalid={showErrors && !!contactErrors(co).line1} />
                  {showErrors && contactErrors(co).line1 && <em className="fn-err">{contactErrors(co).line1}</em>}
                </label>
                <label className="fn-field">
                  <span>Street and area (optional)</span>
                  <input value={co.line2} onChange={(e) => setCo({ ...co, line2: e.target.value })} autoComplete="address-line2" maxLength={120} />
                </label>
                <label className="fn-field">
                  <span>Landmark (optional)</span>
                  <input value={co.landmark} onChange={(e) => setCo({ ...co, landmark: e.target.value })} maxLength={80} />
                </label>
                <div className="fn-fields cols-3-addr">
                  <label className="fn-field">
                    <span>City</span>
                    <input value={co.city} onChange={(e) => setCo({ ...co, city: e.target.value })} autoComplete="address-level2" maxLength={60} aria-invalid={showErrors && !!contactErrors(co).city} />
                    {showErrors && contactErrors(co).city && <em className="fn-err">{contactErrors(co).city}</em>}
                  </label>
                  <label className="fn-field">
                    <span>State</span>
                    <select value={co.state} onChange={(e) => setCo({ ...co, state: e.target.value })} autoComplete="address-level1" aria-invalid={showErrors && !!contactErrors(co).state}>
                      <option value="">Choose</option>
                      {INDIAN_STATES.map((st) => (
                        <option key={st} value={st}>
                          {st}
                        </option>
                      ))}
                    </select>
                    {showErrors && contactErrors(co).state && <em className="fn-err">{contactErrors(co).state}</em>}
                  </label>
                  <label className="fn-field">
                    <span>PIN code</span>
                    <input value={co.pincode} onChange={(e) => setCo({ ...co, pincode: e.target.value.replace(/[^\d]/g, "").slice(0, 6) })} inputMode="numeric" autoComplete="postal-code" aria-invalid={showErrors && !!contactErrors(co).pincode} />
                    {showErrors && contactErrors(co).pincode && <em className="fn-err">{contactErrors(co).pincode}</em>}
                  </label>
                </div>
              </fieldset>

              {gift && (
                <label className="fn-field">
                  <span>Gift note (optional, written on a card)</span>
                  <textarea rows={2} value={co.giftNote} onChange={(e) => setCo({ ...co, giftNote: e.target.value })} maxLength={240} />
                </label>
              )}

              <label className="fn-check">
                <input type="checkbox" checked={co.consent} onChange={(e) => setCo({ ...co, consent: e.target.checked })} />
                <span>
                  I agree to the{" "}
                  <a href="/terms" target="_blank" rel="noopener noreferrer">
                    terms
                  </a>
                  ,{" "}
                  <a href="/shipping" target="_blank" rel="noopener noreferrer">
                    shipping
                  </a>{" "}
                  and{" "}
                  <a href="/returns" target="_blank" rel="noopener noreferrer">
                    returns
                  </a>{" "}
                  policies, and to my details being used to make and deliver this order as described in the{" "}
                  <a href="/privacy" target="_blank" rel="noopener noreferrer">
                    privacy policy
                  </a>
                  .
                </span>
              </label>
              {showErrors && contactErrors(co).consent && <em className="fn-err">{contactErrors(co).consent}</em>}
              <label className="fn-check is-light">
                <input type="checkbox" checked={co.marketing} onChange={(e) => setCo({ ...co, marketing: e.target.checked })} />
                <span>Send me crystal care reminders and offers on WhatsApp (optional).</span>
              </label>

              {payState.status === "error" && (
                <p className="fn-error" role="alert">
                  {payState.message}
                </p>
              )}
              <div className="fn-actions is-stack">
                <button type="submit" className="btn btn-lapis" disabled={payState.status === "working"}>
                  {payState.status === "working" ? payState.message ?? "Opening secure payment…" : `Pay ${formatINR(total)} securely`}
                </button>
              </div>
              <TrustBar compact text={trust} />
              <p className="small-note">Payments are processed by Razorpay. We never see or store your card or UPI details.</p>
            </form>
          )}

          {/* 13 — confirmed */}
          {step === "confirmed" && rec && (
            <div className="fn-result">
              <p className="fn-kicker">
                <span aria-hidden="true">◆</span> Order {orderRef}
              </p>
              <h1 ref={headingRef} tabIndex={-1} className="fn-title is-hero">
                Thank you{a.firstName.trim() && !gift ? `, ${a.firstName.trim()}` : ""}
              </h1>
              <p className="fn-sub">
                {fill(copy.confirmedText, { title: rec.title, ref: orderRef })}
              </p>
              {paidPurposes.length > 0 && paidPurposes.length < MAX_PURPOSES && mainRzpOrder && topUpState.status !== "done" && (
                <div className="fn-topup">
                  <PurposeAdd
                    idBase="fn-topup"
                    title="Before Ammit starts: add another purpose?"
                    text={`Your bracelet hasn't been designed yet, so Ammit can still build ${paidPurposes.length === 1 ? "a 2nd purpose" : "a 3rd purpose"} into it.`}
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
                            body: JSON.stringify({ orderId: mainRzpOrder, add: topUp }),
                          });
                          const d = await res.json().catch(() => ({}));
                          if (!res.ok) return setTopUpState({ status: "error", message: d.error ?? "Something went wrong. Please try again." });
                          if (!(await loadRazorpay()) || !window.Razorpay) return setTopUpState({ status: "error", message: "The payment window couldn't load. Please try again." });
                          const added = topUp.map((x) => braceletBySlug(x)?.title ?? x);
                          const rzp = new window.Razorpay({
                            key: d.keyId,
                            order_id: d.orderId,
                            amount: d.amount,
                            currency: d.currency,
                            name: "Bracelet By Ammit",
                            description: `Add ${added.join(" + ")} to order ${d.ref}`,
                            image: `${window.location.origin}/brand/emblem.png`,
                            prefill: d.prefill,
                            notes: { ref: d.ref },
                            theme: { color: "#050E8F" },
                            modal: { ondismiss: () => setTopUpState({ status: "idle" }) },
                            handler: async (r: RzpResponse) => {
                              setTopUpState({ status: "working", message: "Confirming your payment…" });
                              const v = await fetch("/api/checkout/verify", {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify(r),
                              }).catch(() => null);
                              if (v?.ok) {
                                setPaidPurposes((p) => [...p, ...topUp]);
                                setTopUp([]);
                                setTopUpState({ status: "done", message: `Added ${added.join(" and ")}. Ammit will design your bracelet for all of them.` });
                                track("purchase", { transaction_id: `${d.ref}-up`, value: d.amount / 100, currency: "INR", upgrade: 1 }, "Purchase");
                              } else {
                                setTopUpState({ status: "error", message: `We couldn't confirm the payment. If money was taken, contact us with reference ${d.ref}.` });
                              }
                            },
                          });
                          rzp.on("payment.failed", (r) => setTopUpState({ status: "error", message: r.error?.description ?? "Payment failed. Please try again." }));
                          rzp.open();
                        } catch {
                          setTopUpState({ status: "error", message: "Something went wrong. Please try again." });
                        }
                      }}
                    >
                      {topUpState.status === "working"
                        ? topUpState.message ?? "Opening secure payment…"
                        : `Add for ${formatINR(extraFor(rec.priceInr, paidPurposes.length, paidPurposes.length + topUp.length, tiers))}`}
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
                <li>Ammit reads {gift ? `${a.firstName.trim()}'s` : "your"} full name and date of birth and chooses the crystals.</li>
                <li>We&apos;ll message you on WhatsApp at +91 {co.mobile} with any questions and your tracking details.</li>
                <li>Free delivery, estimated {win()}.</li>
              </ol>
              <div className="fn-actions is-stack">
                <Link className="btn btn-lapis" href="/">
                  Back to the home page
                </Link>
              </div>
              <p className="small-note">Questions about your order? Mention {orderRef} when you contact us.</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
