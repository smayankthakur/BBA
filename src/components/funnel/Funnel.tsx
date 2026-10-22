"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import Medallion from "../Medallion";
import Sphere from "../Sphere";
import ProductVisual from "../ProductVisual";
import { BRACELETS, MULANK, braceletBySlug } from "@/data/pages";
import { LINKS, PRICE, TESTIMONIALS } from "@/data/home";
import { ageFrom, bhagyank, isValidDate, mulank } from "@/lib/numerology";
import { prefilledOrderUrl, WRIST_OPTIONS, type Gender } from "@/lib/orderForm";

/* ------------------------------------------------------------------ */
/* Steps                                                               */
/* ------------------------------------------------------------------ */

const STEPS = ["who", "gender", "intention", "focus", "proof", "name", "dob", "reveal", "wrist", "matching", "result"] as const;
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

export default function Funnel() {
  const [i, setI] = useState(0);
  const [a, setA] = useState<Answers>(EMPTY);
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
  const progress = step === "result" ? 1 : Math.max(0.04, answeredQs / QUESTIONS.length);

  const orderUrl =
    dobValid && a.gender
      ? prefilledOrderUrl({
          firstName: a.firstName,
          lastName: a.lastName,
          day: a.day!,
          month: a.month!,
          year: a.year!,
          gender: a.gender,
          wrist: a.wrist && a.wrist !== "unsure" ? a.wrist : undefined,
          purposeSlug: primary,
        })
      : undefined;

  /* ------------------------------------------------------------------ */

  return (
    <div className="fn">
      <header className="fn-top">
        <div className="fn-top-row">
          {i > 0 && step !== "result" ? (
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
                <ProductVisual cards={rec.cards} rings={rec.rings} label={`Illustration of the ${rec.title} bracelet`} />
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
              <div className="fn-actions is-stack">
                {orderUrl && (
                  <a className="btn btn-lapis" href={orderUrl} target="_blank" rel="noopener noreferrer">
                    Confirm my order
                  </a>
                )}
                <a className="btn btn-line" href={LINKS.whatsapp} target="_blank" rel="noopener noreferrer">
                  Ask Ammit on WhatsApp first
                </a>
              </div>
              <ol className="num-list fn-next">
                <li>The order form opens with these answers filled in. Add a mobile number and delivery address.</li>
                <li>Ammit reads the full numbers and confirms the crystals with you on WhatsApp.</li>
                <li>The bracelet is strung by hand and sent to you.</li>
              </ol>
              {gift && <p className="small-note">The form says &ldquo;your&rdquo; details: keep the wearer&apos;s name and birth date, and add your own mobile number and address.</p>}
              {recSlug === "3-in-1" && <p className="small-note">The form takes one purpose, so we&apos;ve filled in your first choice. Mention &ldquo;3 in 1&rdquo; when the team messages you.</p>}
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
        </div>
      </main>
    </div>
  );
}
