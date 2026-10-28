"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "../LocaleLink";
import RichText from "../RichText";
import Sphere from "../Sphere";
import { useLang } from "../LangProvider";
import { tf } from "@/lib/i18n/ui";
import { INTL_LOCALE } from "@/lib/i18n/config";
import { formatINR } from "@/lib/format";
import { INDIAN_STATES } from "@/lib/checkoutSchema";
import { deliveryWindow } from "@/lib/delivery";
import { ageFrom, bhagyank, isValidDate, mulank } from "@/lib/numerology";
import { track } from "@/lib/analytics";
import { MAX_PURPOSES, extraFor, priceFor } from "@/lib/pricing";
import { PurposeAdd, loadRazorpay, type RzpResponse } from "../funnel/parts";
import { ORDER_EVENT } from "./open";
import type { QuickData } from "./types";

const THIS_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: THIS_YEAR - 1929 }, (_, i) => THIS_YEAR - i);
const WRISTS = ["14cm", "15cm", "16cm", "17cm", "18cm"];

type Form = {
  mobile: string;
  gift: boolean;
  name: string;
  day: string;
  month: string;
  year: string;
  guardian: boolean;
  wrist: string;
  deliverTo: string;
  pincode: string;
  house: string;
  area: string;
  city: string;
  state: string;
  marketing: boolean;
};
const EMPTY: Form = {
  mobile: "",
  gift: false,
  name: "",
  day: "",
  month: "",
  year: "",
  guardian: false,
  wrist: "unsure",
  deliverTo: "",
  pincode: "",
  house: "",
  area: "",
  city: "",
  state: "",
  marketing: false,
};
type Field = "purpose" | "mobile" | "name" | "dob" | "guardian" | "deliverTo" | "pincode" | "house" | "city" | "state";

type Paid = { ref: string; rzpOrderId: string; purposes: string[] };

/**
 * The one-screen order: purpose → a short form → Razorpay. The reading
 * questions (gender, what they want help with, a note) come after payment.
 */
export default function QuickOrder({ data }: { data: QuickData }) {
  const { ui, lang } = useLang();
  const q = ui.quick;
  const u = ui.funnel;
  const c = ui.common;

  const [open, setOpen] = useState(false);
  const [slug, setSlug] = useState<string>("");
  const [picking, setPicking] = useState(false);
  const [f, setF] = useState<Form>(EMPTY);
  const [errorsOn, setErrorsOn] = useState(false);
  const [extras, setExtras] = useState<string[]>([]);
  const [showExtras, setShowExtras] = useState(false);
  const [pin, setPin] = useState<{ status: "idle" | "loading" | "found" | "failed"; edit?: boolean }>({ status: "idle" });
  const [pay, setPay] = useState<{ status: "idle" | "working" | "error"; message?: string }>({ status: "idle" });
  const [whatsAppOnly, setWhatsAppOnly] = useState(!data.payEnabled);
  // Coupon: the server decides the discount; this only shows it.
  const [couponOpen, setCouponOpen] = useState(false);
  const [couponInput, setCouponInput] = useState("");
  const [coupon, setCoupon] = useState<{ code: string; discountInr: number; totalInr: number } | null>(null);
  const [couponMsg, setCouponMsg] = useState<{ busy?: boolean; error?: string } | null>(null);
  const urlCoupon = useRef("");
  const utm = useRef<Record<string, string>>({});
  // After payment
  const [paid, setPaid] = useState<Paid | null>(null);
  const [stage, setStage] = useState<"details" | "numbers">("details");
  const [gender, setGender] = useState<"female" | "male" | "other" | "">("");
  const [focus, setFocus] = useState("");
  const [note, setNote] = useState("");
  const [detailsState, setDetailsState] = useState<{ status: "idle" | "working" | "error" | "saved"; message?: string }>({ status: "idle" });
  const [topUp, setTopUp] = useState<string[]>([]);
  const [topUpState, setTopUpState] = useState<{ status: "idle" | "working" | "error" | "done"; message?: string }>({ status: "idle" });

  const panel = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const busy = useRef(false);
  busy.current = pay.status === "working" || topUpState.status === "working";
  const pushed = useRef(false);

  const products = data.products;
  const product = products.find((p) => p.slug === slug);
  const bySlug = useCallback((s: string) => products.find((p) => p.slug === s), [products]);
  const set = <K extends keyof Form>(k: K, v: Form[K]) => setF((s) => ({ ...s, [k]: v }));

  /* ---- opening and closing ---- */
  const show = useCallback((s?: string) => {
    const known = !!s && products.some((p) => p.slug === s);
    if (known) setSlug(s!);
    setPicking((cur) => (known ? false : !slug || cur));
    setOpen(true);
    if (!pushed.current) {
      window.history.pushState({ ...(window.history.state ?? {}), bbaOrder: 1 }, "");
      pushed.current = true;
    }
    track("order_sheet_open", { bracelet: s ?? "" });
  }, [products, slug]);

  const close = useCallback(() => {
    if (busy.current) return;
    setOpen(false);
    if (pushed.current) {
      pushed.current = false;
      if (window.history.state?.bbaOrder) window.history.back();
    }
  }, []);

  useEffect(() => {
    window.__bbaOrderReady = true;
    const onOpen = (e: Event) => show((e as CustomEvent<{ slug?: string }>).detail?.slug);
    // Browser / phone back button closes the sheet (not while paying).
    const onPop = () => {
      if (!pushed.current) return;
      if (busy.current) {
        window.history.pushState({ ...(window.history.state ?? {}), bbaOrder: 1 }, "");
        return;
      }
      pushed.current = false;
      setOpen(false);
    };
    window.addEventListener(ORDER_EVENT, onOpen);
    window.addEventListener("popstate", onPop);
    return () => {
      window.__bbaOrderReady = false;
      window.removeEventListener(ORDER_EVENT, onOpen);
      window.removeEventListener("popstate", onPop);
    };
  }, [show]);

  // Links can carry ?order=<purpose> (opens the sheet), ?coupon=CODE and utm_*.
  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    p.forEach((v, k) => {
      if (k.startsWith("utm_") && Object.keys(utm.current).length < 8) utm.current[k] = v.slice(0, 100);
    });
    const cq = (p.get("coupon") ?? "").trim().toUpperCase().replace(/[^A-Z0-9_-]/g, "").slice(0, 24);
    if (cq) {
      urlCoupon.current = cq;
      setCouponInput(cq);
      setCouponOpen(true);
    }
    const o = p.get("order");
    if (o !== null) {
      p.delete("order");
      const rest = p.toString();
      window.history.replaceState(window.history.state, "", `${window.location.pathname}${rest ? `?${rest}` : ""}${window.location.hash}`);
      window.setTimeout(() => show(o), 50);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Modal behaviour: lock page scroll, Esc closes, Tab stays inside.
  useEffect(() => {
    if (!open) return;
    document.documentElement.classList.add("qo-open");
    titleRef.current?.focus({ preventScroll: true });
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        close();
      } else if (e.key === "Tab") {
        const els = Array.from(panel.current?.querySelectorAll<HTMLElement>("a[href], button:not([disabled]), input, select, textarea") ?? []).filter(
          (el) => el.offsetParent !== null,
        );
        if (!els.length) return;
        const first = els[0];
        const last = els[els.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.documentElement.classList.remove("qo-open");
      document.removeEventListener("keydown", onKey);
    };
  }, [open, close]);

  // Focus the heading when the view inside the sheet changes.
  useEffect(() => {
    if (open) titleRef.current?.focus({ preventScroll: true });
    panel.current?.querySelector(".qo-body")?.scrollTo({ top: 0 });
  }, [picking, paid, stage, open]);

  /* ---- PIN code → city and state ---- */
  useEffect(() => {
    if (!/^[1-9]\d{5}$/.test(f.pincode)) {
      setPin((p) => (p.status === "idle" ? p : { status: "idle" }));
      return;
    }
    let live = true;
    setPin({ status: "loading" });
    fetch(`/api/pincode?pin=${f.pincode}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d: { city?: string; state?: string } | null) => {
        if (!live) return;
        if (d?.city && d.state) {
          setF((s) => ({ ...s, city: d.city!, state: d.state! }));
          setPin({ status: "found" });
        } else setPin({ status: "failed" });
      })
      .catch(() => live && setPin({ status: "failed" }));
    return () => {
      live = false;
    };
  }, [f.pincode]);

  /* ---- prices ---- */
  const listTotal = product ? priceFor(product.priceInr, 1 + extras.length, data.tiers) : 0;
  const total = coupon ? coupon.totalInr : listTotal;
  const nextExtra = product && extras.length < MAX_PURPOSES - 1 ? extraFor(product.priceInr, 1 + extras.length, 2 + extras.length, data.tiers) : null;

  // A different bracelet or purposes: drop extras / re-check the coupon.
  useEffect(() => {
    setExtras([]);
    setCoupon(null);
  }, [slug]);

  const applyCoupon = useCallback(
    async (raw: string) => {
      if (!product) return;
      const code = raw.trim().toUpperCase();
      if (!code) return setCouponMsg({ error: u.couponEmpty });
      setCouponMsg({ busy: true });
      const res = await fetch("/api/checkout/coupon", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lang, code, bracelet: product.slug, extras, mobile: /^[6-9]\d{9}$/.test(f.mobile) ? f.mobile : "" }),
      }).catch(() => null);
      const d = res ? await res.json().catch(() => ({})) : {};
      if (res?.ok && d.ok) {
        setCoupon({ code: d.code, discountInr: d.discountInr, totalInr: d.totalInr });
        setCouponMsg(null);
      } else {
        setCoupon(null);
        setCouponMsg({ error: d.error ?? u.couponFailed });
      }
    },
    [product, extras, f.mobile, lang, u.couponEmpty, u.couponFailed],
  );
  useEffect(() => {
    if (open && product && urlCoupon.current && !coupon) applyCoupon(urlCoupon.current);
    else if (coupon) applyCoupon(coupon.code);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, product?.slug, extras]);

  /* ---- validation ---- */
  const day = Number(f.day), month = Number(f.month), year = Number(f.year);
  const dobValid = !!(day && month && year && isValidDate(day, month, year) && new Date(year, month - 1, day) <= new Date());
  const minor = dobValid && ageFrom(day, month, year) < 18;
  const errors = useMemo(() => {
    const e: Partial<Record<Field, string>> = {};
    if (!product) e.purpose = q.errors.purpose;
    if (!/^[6-9]\d{9}$/.test(f.mobile)) e.mobile = u.errors.mobile;
    if (!f.name.trim()) e.name = q.errors.name;
    if (!dobValid) e.dob = f.day && f.month && f.year ? c.badDate : q.errors.dob;
    if (minor && !f.guardian) e.guardian = q.errors.guardian;
    if (f.gift && !f.deliverTo.trim()) e.deliverTo = u.errors.deliveryName;
    if (!/^[1-9]\d{5}$/.test(f.pincode)) e.pincode = u.errors.pincode;
    if (!f.house.trim()) e.house = u.errors.line1;
    if (!f.city.trim()) e.city = u.errors.city;
    if (!f.state) e.state = u.errors.state;
    return e;
  }, [product, f, dobValid, minor, q, u, c.badDate]);
  const err = (k: Field) => (errorsOn ? errors[k] : undefined);
  const errProps = (k: Field) => ({ "aria-invalid": !!err(k), "aria-describedby": err(k) ? `qo-err-${k}` : undefined });
  const ErrMsg = ({ k }: { k: Field }) =>
    err(k) ? (
      <em className="fn-err" id={`qo-err-${k}`}>
        {err(k)}
      </em>
    ) : null;

  const [firstName, ...rest] = f.name.trim().split(/\s+/);
  const lastName = rest.join(" ");
  const deliverName = f.gift ? f.deliverTo.trim() : f.name.trim();
  const showCityState = pin.status === "failed" || pin.edit || (pin.status !== "found" && pin.status !== "loading" && (f.city || f.state)) || (errorsOn && (errors.city || errors.state));

  /* ---- WhatsApp order (before online payment is switched on) ---- */
  const whatsAppText = () =>
    [
      tf(q.waOrder, { title: [product?.title, ...extras.map((x) => bySlug(x)?.title ?? x)].join(" + "), amount: formatINR(total) }),
      tf(q.waLines, {
        name: f.name.trim(),
        dob: `${f.day}/${f.month}/${f.year}`,
        wrist: f.wrist === "unsure" ? q.wristUnsure : f.wrist,
        deliverTo: deliverName,
        address: [f.house, f.area, f.city, f.state, f.pincode].filter(Boolean).join(", "),
        mobile: f.mobile,
      }),
      coupon ? `${u.coupon}: ${coupon.code}` : "",
    ]
      .filter(Boolean)
      .join("\n");

  /* ---- pay ---- */
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (Object.keys(errors).length) {
      setErrorsOn(true);
      window.setTimeout(() => panel.current?.querySelector<HTMLElement>("[aria-invalid='true']")?.focus(), 30);
      return;
    }
    if (!product) return;
    if (whatsAppOnly) {
      track("order_whatsapp", { bracelet: product.slug, value: total, currency: "INR" });
      window.open(`https://wa.me/${data.waPhone}?text=${encodeURIComponent(whatsAppText())}`, "_blank", "noopener,noreferrer");
      return;
    }
    setPay({ status: "working" });
    track("begin_checkout", { bracelet: product.slug, value: total, currency: "INR", ...(coupon ? { coupon: coupon.code } : {}) }, "InitiateCheckout");
    try {
      const res = await fetch("/api/checkout/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lang,
          source: "quick",
          bracelet: product.slug,
          wearer: { firstName, lastName, day, month, year, wrist: f.wrist || "unsure" },
          intentions: [product.slug, ...extras],
          focus: "",
          isGift: f.gift,
          giftNote: "",
          contact: { deliveryName: deliverName, mobile: f.mobile, email: "" },
          address: { line1: f.house.trim(), line2: f.area.trim(), landmark: "", city: f.city.trim(), state: f.state, pincode: f.pincode },
          consent: true,
          marketing: f.marketing,
          utm: utm.current,
          ...(coupon ? { coupon: coupon.code } : {}),
          extras,
        }),
      });
      const d = await res.json().catch(() => ({}));
      if (res.status === 503) {
        // Payments not switched on yet: send the order on WhatsApp instead.
        setWhatsAppOnly(true);
        setPay({ status: "error", message: q.noPayYet });
        return;
      }
      if (!res.ok) {
        if (d.field === "coupon") {
          setCoupon(null);
          setCouponMsg({ error: d.error });
        }
        setPay({ status: "error", message: d.error ?? u.payGeneric });
        return;
      }
      if (!(await loadRazorpay()) || !window.Razorpay) {
        setPay({ status: "error", message: u.payLoad });
        return;
      }
      const purposes = [product.slug, ...extras];
      const rzp = new window.Razorpay({
        key: d.keyId,
        order_id: d.orderId,
        amount: d.amount,
        currency: d.currency,
        name: "Bracelet By Ammit",
        description: tf(u.rzpDescription, { title: purposes.map((x) => bySlug(x)?.title ?? x).join(" + ") }),
        image: `${window.location.origin}/brand/emblem.png`,
        prefill: { name: deliverName, contact: `+91${f.mobile}` },
        notes: { ref: d.ref },
        theme: { color: "#050E8F" },
        modal: { ondismiss: () => setPay({ status: "error", message: u.payDismissed }) },
        handler: async (r: RzpResponse) => {
          setPay({ status: "working", message: u.confirming });
          const v = await fetch("/api/checkout/verify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(r),
          }).catch(() => null);
          const vd = v ? await v.json().catch(() => ({})) : {};
          if (v?.ok) {
            setPaid({ ref: d.ref, rzpOrderId: d.orderId, purposes });
            setStage("details");
            setPay({ status: "idle" });
            track("purchase", { transaction_id: d.ref, value: d.amount / 100, currency: "INR", ...(coupon ? { coupon: coupon.code } : {}) }, "Purchase");
          } else {
            setPay({ status: "error", message: vd.error ?? tf(u.payUnconfirmed, { ref: d.ref }) });
          }
        },
      });
      rzp.on("payment.failed", (r) => setPay({ status: "error", message: r.error?.description ?? u.payFailed }));
      rzp.open();
    } catch {
      setPay({ status: "error", message: u.payGeneric });
    }
  };

  /* ---- after payment: details for Ammit ---- */
  const saveDetails = async (skip = false) => {
    if (!paid) return;
    if (skip || (!gender && !focus && !note.trim())) {
      setStage("numbers");
      return;
    }
    setDetailsState({ status: "working" });
    const res = await fetch("/api/order/details", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderId: paid.rzpOrderId, lang, ...(gender ? { gender } : {}), focus, note: note.trim() }),
    }).catch(() => null);
    const d = res ? await res.json().catch(() => ({})) : {};
    if (res?.ok) {
      setDetailsState({ status: "saved", message: q.saved });
      setStage("numbers");
    } else setDetailsState({ status: "error", message: d.error ?? ui.server.detailsFailed });
  };

  const startTopUp = async () => {
    if (!paid || !product) return;
    setTopUpState({ status: "working" });
    try {
      const res = await fetch("/api/checkout/upgrade", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lang, orderId: paid.rzpOrderId, add: topUp }),
      });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) return setTopUpState({ status: "error", message: d.error ?? u.payGeneric });
      if (!(await loadRazorpay()) || !window.Razorpay) return setTopUpState({ status: "error", message: u.payLoad });
      const added = topUp.map((x) => bySlug(x)?.title ?? x);
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
            setPaid((p) => (p ? { ...p, purposes: [...p.purposes, ...topUp] } : p));
            setTopUp([]);
            setTopUpState({ status: "done", message: tf(u.topUpDone, { titles: added.join(u.and) }) });
            track("purchase", { transaction_id: `${d.ref}-up`, value: d.amount / 100, currency: "INR", upgrade: 1 }, "Purchase");
          } else setTopUpState({ status: "error", message: tf(u.topUpUnconfirmed, { ref: d.ref }) });
        },
      });
      rzp.on("payment.failed", (r) => setTopUpState({ status: "error", message: r.error?.description ?? u.payFailed }));
      rzp.open();
    } catch {
      setTopUpState({ status: "error", message: u.payGeneric });
    }
  };

  const finish = () => {
    // Start fresh next time.
    setPaid(null);
    setF(EMPTY);
    setErrorsOn(false);
    setExtras([]);
    setCoupon(null);
    setGender("");
    setFocus("");
    setNote("");
    setDetailsState({ status: "idle" });
    setTopUp([]);
    setTopUpState({ status: "idle" });
    setStage("details");
    close();
  };

  if (!open) return null;

  const win = deliveryWindow(data.minDays, data.maxDays, new Date(), INTL_LOCALE[lang]);
  const wearer = firstName || "";
  const m = dobValid ? mulank(day) : undefined;
  const bh = dobValid ? bhagyank(day, month, year) : undefined;
  const mInfo = data.mulank.find((x) => x.number === m);
  const paidProduct = paid ? bySlug(paid.purposes[0]) : undefined;

  return (
    <>
      <div className="qo-scrim" onClick={close} aria-hidden="true" />
      <div ref={panel} className="qo" role="dialog" aria-modal="true" aria-labelledby="qo-title">
        <div className="qo-head">
          <h2 id="qo-title" ref={titleRef} tabIndex={-1} className="qo-title">
            {paid ? (firstName && !f.gift ? tf(q.paidTitleName, { name: firstName }) : q.paidTitle) : picking ? q.choosePurpose : q.dialog}
          </h2>
          <button type="button" className="qo-close" onClick={paid ? finish : close} aria-label={q.close} disabled={pay.status === "working"}>
            <span />
            <span />
          </button>
        </div>

        {/* Purpose picker */}
        {!paid && picking && (
          <div className="qo-body">
            <ul className="qo-purposes">
              {products.map((p) => (
                <li key={p.slug}>
                  <button
                    type="button"
                    className={`qo-purpose${p.slug === slug ? " is-on" : ""}`}
                    aria-pressed={p.slug === slug}
                    onClick={() => {
                      setSlug(p.slug);
                      setPicking(false);
                    }}
                  >
                    <Sphere color={p.sphere.color} shade={p.sphere.shade} gloss={p.sphere.gloss} size={34} />
                    <span className="qo-purpose-t">
                      <b>{p.title}</b>
                      <small>{p.blurb}</small>
                    </span>
                    <span className="qo-purpose-p">{formatINR(p.priceInr)}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* The order form */}
        {!paid && !picking && product && (
          <form className="qo-form" noValidate onSubmit={submit}>
            <div className="qo-body">
              <div className="qo-product">
                <span className="qo-thumb">
                  {product.photo ? (
                    <Image src={product.photo} alt="" fill sizes="72px" loading="eager" />
                  ) : (
                    <Sphere color={product.sphere.color} shade={product.sphere.shade} gloss={product.sphere.gloss} size={48} />
                  )}
                </span>
                <span className="qo-product-t">
                  <b>{[product.title, ...extras.map((x) => bySlug(x)?.title ?? x)].join(" + ")}</b>
                  <small>{q.made}</small>
                  <span className="qo-product-links">
                    <button type="button" className="fn-link" onClick={() => setPicking(true)}>
                      {q.change}
                    </button>
                    <Link
                      href={`/bracelets/${product.slug}`}
                      onClick={() => {
                        // Leaving for the bracelet page: close without stepping back in history.
                        pushed.current = false;
                        setOpen(false);
                      }}
                    >
                      {q.about}
                    </Link>
                  </span>
                </span>
                <span className="qo-product-p">{formatINR(listTotal)}</span>
              </div>

              {nextExtra !== null && !showExtras && extras.length === 0 && (
                <button type="button" className="fn-link qo-more" onClick={() => setShowExtras(true)}>
                  {tf(q.addPurpose, { amount: formatINR(nextExtra) })}
                </button>
              )}
              {(showExtras || extras.length > 0) && (
                <PurposeAdd
                  idBase="qo-add"
                  title={f.gift ? u.addTitleGift : u.addTitle}
                  text={u.addText}
                  labels={{ second: u.addSecond, third: u.addThird, youChose: u.youChose }}
                  choices={products.map((p) => ({ slug: p.slug, title: p.title }))}
                  suggested={[]}
                  locked={[product.slug]}
                  selected={extras}
                  onChange={setExtras}
                  nextPrice={nextExtra}
                />
              )}

              <label className="fn-field">
                <span>{q.mobile}</span>
                <span className="qo-tel">
                  <span aria-hidden="true">+91</span>
                  <input
                    value={f.mobile}
                    onChange={(e) => set("mobile", e.target.value.replace(/\D/g, "").replace(/^91(?=\d{10})/, "").slice(0, 10))}
                    inputMode="numeric"
                    autoComplete="tel-national"
                    placeholder={u.mobilePlaceholder}
                    {...errProps("mobile")}
                  />
                </span>
                {err("mobile") ? <ErrMsg k="mobile" /> : <small className="qo-help">{q.mobileHelp}</small>}
              </label>

              <label className="fn-check qo-gift">
                <input type="checkbox" checked={f.gift} onChange={(e) => set("gift", e.target.checked)} />
                <span>{q.gift}</span>
              </label>

              <label className="fn-field">
                <span>{f.gift ? q.nameGift : q.name}</span>
                <input
                  value={f.name}
                  onChange={(e) => set("name", e.target.value)}
                  autoComplete={f.gift ? "off" : "name"}
                  maxLength={100}
                  {...errProps("name")}
                />
                <ErrMsg k="name" />
              </label>

              <fieldset className="qo-dob">
                <legend>{f.gift ? q.dobGift : q.dob}</legend>
                <div className="fn-fields cols-dob">
                  <select value={f.day} onChange={(e) => set("day", e.target.value)} aria-label={c.day} {...errProps("dob")}>
                    <option value="">{c.day}</option>
                    {Array.from({ length: 31 }, (_, d) => (
                      <option key={d + 1} value={d + 1}>
                        {d + 1}
                      </option>
                    ))}
                  </select>
                  <select value={f.month} onChange={(e) => set("month", e.target.value)} aria-label={c.month} {...errProps("dob")}>
                    <option value="">{c.month}</option>
                    {c.months.map((mo, i) => (
                      <option key={mo} value={i + 1}>
                        {mo}
                      </option>
                    ))}
                  </select>
                  <select value={f.year} onChange={(e) => set("year", e.target.value)} aria-label={c.year} {...errProps("dob")}>
                    <option value="">{c.year}</option>
                    {YEARS.map((y) => (
                      <option key={y} value={y}>
                        {y}
                      </option>
                    ))}
                  </select>
                </div>
                {err("dob") ? <ErrMsg k="dob" /> : <small className="qo-help">{q.dobHelp}</small>}
              </fieldset>
              {minor && (
                <label className="fn-check">
                  <input type="checkbox" checked={f.guardian} onChange={(e) => set("guardian", e.target.checked)} {...errProps("guardian")} />
                  <span>{u.minor}</span>
                </label>
              )}
              <ErrMsg k="guardian" />

              <fieldset className="qo-wrist">
                <legend>{q.wrist}</legend>
                <div className="qo-chips">
                  {[...WRISTS, "unsure"].map((w) => (
                    <button key={w} type="button" className={`qo-chip${f.wrist === w ? " is-on" : ""}`} aria-pressed={f.wrist === w} onClick={() => set("wrist", w)}>
                      {w === "unsure" ? q.wristUnsure : w.replace("cm", " cm")}
                    </button>
                  ))}
                </div>
                <small className="qo-help">
                  <RichText text={q.wristHelp} newTab />
                </small>
              </fieldset>

              <fieldset className="qo-address">
                <legend>{u.address}</legend>
                {f.gift && (
                  <label className="fn-field">
                    <span>{q.deliverTo}</span>
                    <input value={f.deliverTo} onChange={(e) => set("deliverTo", e.target.value)} autoComplete="name" maxLength={80} {...errProps("deliverTo")} />
                    <ErrMsg k="deliverTo" />
                  </label>
                )}
                <label className="fn-field qo-pin">
                  <span>{q.pincode}</span>
                  <input
                    value={f.pincode}
                    onChange={(e) => set("pincode", e.target.value.replace(/\D/g, "").slice(0, 6))}
                    inputMode="numeric"
                    autoComplete="postal-code"
                    {...errProps("pincode")}
                  />
                  <ErrMsg k="pincode" />
                  {pin.status === "loading" && <small className="qo-help" aria-live="polite">{q.pinFinding}</small>}
                  {pin.status === "found" && !pin.edit && (
                    <small className="qo-found" aria-live="polite">
                      ✓ {f.city}, {f.state}{" "}
                      <button type="button" className="fn-link" onClick={() => setPin((p) => ({ ...p, edit: true }))}>
                        {q.change}
                      </button>
                    </small>
                  )}
                </label>
                <label className="fn-field">
                  <span>{q.house}</span>
                  <input value={f.house} onChange={(e) => set("house", e.target.value)} autoComplete="address-line1" maxLength={120} {...errProps("house")} />
                  <ErrMsg k="house" />
                </label>
                <label className="fn-field">
                  <span>{q.area}</span>
                  <input value={f.area} onChange={(e) => set("area", e.target.value)} autoComplete="address-line2" maxLength={120} />
                </label>
                {showCityState && (
                  <div className="fn-fields cols-2">
                    <label className="fn-field">
                      <span>{q.city}</span>
                      <input value={f.city} onChange={(e) => set("city", e.target.value)} autoComplete="address-level2" maxLength={60} {...errProps("city")} />
                      <ErrMsg k="city" />
                    </label>
                    <label className="fn-field">
                      <span>{q.state}</span>
                      <select value={f.state} onChange={(e) => set("state", e.target.value)} autoComplete="address-level1" {...errProps("state")}>
                        <option value="">{u.chooseState}</option>
                        {INDIAN_STATES.map((st) => (
                          <option key={st} value={st}>
                            {st}
                          </option>
                        ))}
                      </select>
                      <ErrMsg k="state" />
                    </label>
                  </div>
                )}
              </fieldset>

              <div className="qo-coupon">
                {coupon ? (
                  <p className="qo-coupon-on">
                    {u.coupon} <b className="fn-coupon-code">{coupon.code}</b> −{formatINR(coupon.discountInr)}{" "}
                    <button
                      type="button"
                      className="fn-link"
                      onClick={() => {
                        setCoupon(null);
                        urlCoupon.current = "";
                      }}
                    >
                      {u.remove}
                    </button>
                  </p>
                ) : couponOpen ? (
                  <div className="fn-coupon">
                    <label className="sr-only" htmlFor="qo-coupon">
                      {u.couponLabel}
                    </label>
                    <input
                      id="qo-coupon"
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
                    />
                    <button type="button" className="btn btn-line" onClick={() => applyCoupon(couponInput)} disabled={!!couponMsg?.busy}>
                      {couponMsg?.busy ? u.checking : u.apply}
                    </button>
                    {couponMsg?.error && (
                      <em className="fn-err" role="alert">
                        {couponMsg.error}
                      </em>
                    )}
                  </div>
                ) : (
                  <button type="button" className="fn-link" onClick={() => setCouponOpen(true)}>
                    {u.haveCoupon}
                  </button>
                )}
              </div>

              <label className="fn-check is-light">
                <input type="checkbox" checked={f.marketing} onChange={(e) => set("marketing", e.target.checked)} />
                <span>{u.marketing}</span>
              </label>
              <p className="qo-eta">
                {data.trust.shipping} · {tf(u.eta, { dates: win })}
              </p>
            </div>

            <div className="qo-foot">
              {pay.status === "error" && (
                <p className="fn-error" role="alert">
                  {pay.message}
                </p>
              )}
              {errorsOn && Object.keys(errors).length > 0 && pay.status !== "error" && (
                <p className="fn-error" role="alert">
                  {q.fixErrors}
                </p>
              )}
              <button type="submit" className={`btn ${whatsAppOnly ? "btn-gold" : "btn-lapis"} qo-pay`} disabled={pay.status === "working"}>
                {pay.status === "working" ? (pay.message ?? u.opening) : whatsAppOnly ? q.sendWhatsApp : tf(q.pay, { amount: formatINR(total) })}
              </button>
              <p className="qo-agree">
                {whatsAppOnly ? q.noPayYet : <RichText text={q.agree} newTab />}
              </p>
            </div>
          </form>
        )}

        {/* After payment: details, then the numbers */}
        {paid && paidProduct && (
          <div className="qo-body qo-after">
            <p className="fn-kicker">
              <span aria-hidden="true">◆</span> {tf(q.paidKicker, { ref: paid.ref })}
            </p>

            {stage === "details" && (
              <div className="qo-details">
                <h3 className="qo-h3">{q.detailsTitle}</h3>
                <p className="qo-help">{f.gift ? tf(q.detailsTextGift, { name: wearer || u.theWearer }) : q.detailsText}</p>
                <fieldset>
                  <legend>{q.genderLabel}</legend>
                  <div className="qo-chips">
                    {(
                      [
                        ["female", u.woman],
                        ["male", u.man],
                        ["other", u.preferNot],
                      ] as const
                    ).map(([g, label]) => (
                      <button key={g} type="button" className={`qo-chip${gender === g ? " is-on" : ""}`} aria-pressed={gender === g} onClick={() => setGender(g)}>
                        {label}
                      </button>
                    ))}
                  </div>
                </fieldset>
                {paidProduct.listA.length > 0 && (
                  <fieldset>
                    <legend>{q.focusLabel}</legend>
                    <div className="qo-chips is-list">
                      {[...paidProduct.listA, u.somethingElse].map((x) => (
                        <button key={x} type="button" className={`qo-chip${focus === x ? " is-on" : ""}`} aria-pressed={focus === x} onClick={() => setFocus(focus === x ? "" : x)}>
                          {x}
                        </button>
                      ))}
                    </div>
                  </fieldset>
                )}
                <label className="fn-field">
                  <span>{q.noteLabel}</span>
                  <textarea rows={2} value={note} onChange={(e) => setNote(e.target.value)} maxLength={500} placeholder={q.notePlaceholder} />
                </label>
                {detailsState.status === "error" && (
                  <p className="fn-error" role="alert">
                    {detailsState.message}
                  </p>
                )}
                <div className="qo-actions">
                  <button type="button" className="btn btn-lapis" onClick={() => saveDetails()} disabled={detailsState.status === "working"}>
                    {detailsState.status === "working" ? q.saving : q.showNumbers}
                  </button>
                  <button type="button" className="fn-link" onClick={() => saveDetails(true)}>
                    {q.skip}
                  </button>
                </div>
              </div>
            )}

            {stage === "numbers" && (
              <div className="qo-numbers">
                {detailsState.status === "saved" && (
                  <p className="fn-topup-done" role="status">
                    {detailsState.message}
                  </p>
                )}
                {mInfo && (
                  <>
                    <h3 className="qo-h3">{f.gift ? tf(q.numbersTitleGift, { name: wearer || u.theWearer }) : q.numbersTitle}</h3>
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
                    <p className="qo-reveal">
                      <b>{tf(u.revealTitle, { m, planet: mInfo.planet })}</b>{" "}
                      {tf(u.revealText, {
                        day,
                        m,
                        b: bh,
                        planet: `${mInfo.planet}${mInfo.planetHindi && mInfo.planetHindi !== mInfo.planet ? `, ${mInfo.planetHindi}` : ""}`,
                      })}
                    </p>
                    <ul className="fn-traits">
                      {mInfo.traits.map((t) => (
                        <li key={t}>{t}</li>
                      ))}
                    </ul>
                  </>
                )}

                {paid.purposes.length < MAX_PURPOSES && topUpState.status !== "done" && (
                  <div className="fn-topup">
                    <PurposeAdd
                      idBase="qo-topup"
                      title={u.topUpTitle}
                      text={paid.purposes.length === 1 ? u.topUpText2 : u.topUpText3}
                      labels={{ second: u.addSecond, third: u.addThird, youChose: u.youChose }}
                      choices={products.map((p) => ({ slug: p.slug, title: p.title }))}
                      suggested={[]}
                      locked={paid.purposes}
                      selected={topUp}
                      onChange={setTopUp}
                      nextPrice={
                        paid.purposes.length + topUp.length < MAX_PURPOSES
                          ? extraFor(paidProduct.priceInr, paid.purposes.length + topUp.length, paid.purposes.length + topUp.length + 1, data.tiers)
                          : null
                      }
                    />
                    {topUp.length > 0 && (
                      <button type="button" className="btn btn-gold" disabled={topUpState.status === "working"} onClick={startTopUp}>
                        {topUpState.status === "working"
                          ? (topUpState.message ?? u.opening)
                          : tf(u.topUpButton, { amount: formatINR(extraFor(paidProduct.priceInr, paid.purposes.length, paid.purposes.length + topUp.length, data.tiers)) })}
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
                  <li>{f.gift ? tf(u.nextThem, { name: wearer }) : u.nextYou}</li>
                  <li>{tf(u.nextWhatsApp, { mobile: f.mobile })}</li>
                  <li>{tf(u.nextDelivery, { dates: win })}</li>
                </ol>
                <div className="qo-actions">
                  <button type="button" className="btn btn-lapis" onClick={finish}>
                    {q.done}
                  </button>
                </div>
                <p className="small-note">{tf(u.questions, { ref: paid.ref })}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}
