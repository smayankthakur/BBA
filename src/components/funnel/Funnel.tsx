"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import Medallion from "../Medallion";
import Sphere from "../Sphere";
import ProductVisual from "../ProductVisual";
import { BRACELETS, MULANK, braceletBySlug } from "@/data/pages";
import { PRICE, PRICE_INR, SHIPPING, TESTIMONIALS } from "@/data/home";
import TrustBar from "../TrustBar";
import { INDIAN_STATES } from "@/lib/checkoutSchema";
import { deliveryWindow } from "@/lib/delivery";
import { ageFrom, bhagyank, isValidDate, mulank } from "@/lib/numerology";
import { WRIST_OPTIONS, type Gender } from "@/lib/orderForm";
import { track } from "@/lib/analytics";

/* ------------------------------------------------------------------ */
/* Steps                                                               */
/* ------------------------------------------------------------------ */

const STEPS = ["who", "gender", "intention", "focus", "proof", "name", "dob", "reveal", "wrist", "matching", "result", "checkout", "confirmed"] as const;
type StepId = (typeof STEPS)[number];
/** Steps that count towards "Question x of y" */
const QUESTIONS: StepId[] = ["who", "gender", "intention", "focus", "name", "dob", "wrist"];

/** Intentions that the 3 in 1 (love · protection · prosperity) covers */
const THREE_IN_ONE = new Set(["better-married-life", "love-and-relationships", "buri-nazar-protection", "career-and-money"]);
const INTENTION_CHOICES = BRACELETS.filter((b) => b.slug !== "3-in-1");
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

/* ------------------------------------------------------------------ */
/* Funnel                                                              */
/* ------------------------------------------------------------------ */

export default function Funnel({ photos = {} }: { photos?: Record<string, string[]> }) {
  const [i, setI] = useState(0);
  const [a, setA] = useState<Answers>(EMPTY);
  const [co, setCo] = useState<Contact>(EMPTY_CONTACT);
  const [showErrors, setShowErrors] = useState(false);
  const [payState, setPayState] = useState<{ status: "idle" | "working" | "error"; message?: string }>({ status: "idle" });
  const [orderRef, setOrderRef] = useState("");
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
    const wanted = q.get("intention");
    const preset =
      wanted === "3-in-1"
        ? ["love-and-relationships", "buri-nazar-protection", "career-and-money"]
        : INTENTION_CHOICES.some((b) => b.slug === wanted)
          ? [wanted as string]
          : [];
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
  const recSlug = useMemo(() => {
    if (a.intentions.length >= 2 && a.intentions.every((s) => THREE_IN_ONE.has(s))) return "3-in-1";
    return primary;
  }, [a.intentions, primary]);
  const rec = recSlug ? braceletBySlug(recSlug) : undefined;
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
                <span aria-hidden="true">◆</span> 60-second crystal reading
              </p>
              <h1 ref={headingRef} tabIndex={-1} className="fn-title is-hero">
                Find the bracelet that suits your numbers
              </h1>
              <p className="fn-sub">
                Answer 7 quick questions. We&apos;ll work out your mulank and bhagyank and suggest the bracelet Ammit would
                start with for you.
              </p>
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
              <p className="fn-fine">
                Your answers stay in this browser. Nothing is sent anywhere unless you choose to open the order form or
                WhatsApp at the end. Crystal and numerology guidance is traditional belief, not medical, legal or
                financial advice.
              </p>
            </>
          )}

          {/* 2 — gender */}
          {step === "gender" && (
            <>
              <h1 ref={headingRef} tabIndex={-1} className="fn-title">
                {t("Who will wear it?", "Who will wear it?")}
              </h1>
              <p className="fn-sub">This sets the wrist sizes we show later.</p>
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
                {t("What are you asking of life right now?", "What would you like the bracelet to help them with?")}
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
                      <Sphere color={b.sphere} shade={b.sphereShade} gloss={b.sphereGloss} size={40} />
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
                {[...primaryDetail.forWhom, "Something else"].map((f) => (
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
                Every bracelet starts with a reading
              </h1>
              <p className="fn-sub">
                Ammit reads the wearer&apos;s name and date of birth before he chooses a single crystal. Here&apos;s what
                one customer wrote to him:
              </p>
              {TESTIMONIALS[0] && (
                <figure className="fn-quote">
                  <span className="review-mark" aria-hidden="true">
                    &ldquo;
                  </span>
                  <blockquote>
                    <p>{TESTIMONIALS[0].quote}</p>
                  </blockquote>
                  <figcaption>
                    {TESTIMONIALS[0].name}
                    {TESTIMONIALS[0].source && (
                      <>
                        {" · "}
                        <a href={TESTIMONIALS[0].source.href} target="_blank" rel="noopener noreferrer">
                          {TESTIMONIALS[0].source.label}
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
                {t("What's your name?", "What's the wearer's name?")}
              </h1>
              <p className="fn-sub">In numerology your name carries a number too. Use the name you go by every day.</p>
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
              <p className="fn-sub">Your mulank comes from the day; your bhagyank from the full date.</p>
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
                {t("What's your wrist size?", "What's their wrist size?")}
              </h1>
              <p className="fn-sub">Wrap a thread around the wrist bone and measure it in centimetres.</p>
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
                Matching crystals to your answers
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
                <ProductVisual cards={rec.cards} rings={rec.rings} label={`Illustration of the ${rec.title} bracelet`} photos={photos[rec.slug] ?? []} />
              </div>
              <ul className="fn-chips">
                <li>
                  Mulank {m} · {mInfo.planet}
                </li>
                <li>Bhagyank {bh}</li>
                {a.focus && a.focus !== "Something else" && <li>{a.focus}</li>}
              </ul>
              <p className="fn-sub">
                {recSlug === "3-in-1"
                  ? "You picked more than one intention, so the 3 in 1 puts love, protection and prosperity on a single strand, balanced for your numbers."
                  : rec.blurb}
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
                {PRICE} <span>read for your numbers · strung by hand</span>
              </p>
              <TrustBar compact />
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
                <li>Add a delivery address and pay securely: UPI, cards or net banking.</li>
                <li>Ammit reads the full numbers and confirms the crystals with you on WhatsApp.</li>
                <li>The bracelet is strung by hand and delivered free in {SHIPPING.minDays}–{SHIPPING.maxDays} days.</li>
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
                track("begin_checkout", { bracelet: rec.slug, value: PRICE_INR, currency: "INR" }, "InitiateCheckout");
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
                    }),
                  });
                  const data = await res.json().catch(() => ({}));
                  if (!res.ok) {
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
                    description: `${rec.title} bracelet`,
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
                        setPayState({ status: "idle" });
                        track("purchase", { transaction_id: data.ref, value: PRICE_INR, currency: "INR" }, "Purchase");
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
                Delivery and payment
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
                  <span>{PRICE}</span>
                </div>
                <div className="fn-summary-row">
                  <span>Shipping</span>
                  <span>Free</span>
                </div>
                <div className="fn-summary-row is-total">
                  <span>Total</span>
                  <span>{PRICE}</span>
                </div>
                <p className="fn-summary-eta">Estimated delivery: {deliveryWindow()}</p>
              </div>

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
                  {payState.status === "working" ? payState.message ?? "Opening secure payment…" : `Pay ${PRICE} securely`}
                </button>
              </div>
              <TrustBar compact />
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
                Your {rec.title} bracelet is ordered and paid. Keep your order number <b>{orderRef}</b> handy.
              </p>
              <ol className="num-list fn-next">
                <li>Ammit reads {gift ? `${a.firstName.trim()}'s` : "your"} full name and date of birth and chooses the crystals.</li>
                <li>We&apos;ll message you on WhatsApp at +91 {co.mobile} with any questions and your tracking details.</li>
                <li>Free delivery, estimated {deliveryWindow()}.</li>
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
