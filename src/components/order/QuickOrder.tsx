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
/** A paid order whose details haven't been added yet (so a reminder can bring the form back). */
const PENDING_KEY = "bba_pending_order";
const PENDING_DAYS = 14;

type Details = {
  gift: boolean;
  wearerName: string;
  day: string;
  month: string;
  year: string;
  guardian: boolean;
  gender: "female" | "male" | "other" | "";
  wrist: string;
  deliverTo: string;
  pincode: string;
  house: string;
  area: string;
  city: string;
  state: string;
  focus: string;
  note: string;
  marketing: boolean;
};
const EMPTY_DETAILS: Details = {
  gift: false,
  wearerName: "",
  day: "",
  month: "",
  year: "",
  guardian: false,
  gender: "",
  wrist: "unsure",
  deliverTo: "",
  pincode: "",
  house: "",
  area: "",
  city: "",
  state: "",
  focus: "",
  note: "",
  marketing: false,
};
type PreField = "purpose" | "name" | "mobile";
type DetailField = "wearerName" | "dob" | "guardian" | "deliverTo" | "pincode" | "house" | "city" | "state";

type Paid = { ref: string; rzpOrderId: string; purposes: string[]; name: string; mobile: string; at: number };

const readPending = (): Paid | null => {
  try {
    const p = JSON.parse(localStorage.getItem(PENDING_KEY) ?? "null") as Paid | null;
    if (p && p.rzpOrderId && Date.now() - p.at < PENDING_DAYS * 864e5) return p;
    localStorage.removeItem(PENDING_KEY);
  } catch {}
  return null;
};
const writePending = (p: Paid | null) => {
  try {
    if (p) localStorage.setItem(PENDING_KEY, JSON.stringify(p));
    else localStorage.removeItem(PENDING_KEY);
  } catch {}
};

/**
 * Ordering in two steps:
 *  1. before paying, only the name and WhatsApp number (plus purpose, coupon);
 *  2. right after paying, the details form: who it's for, birth date,
 *     wrist, address, gender, what they want help with, a note.
 * If the second form is closed, a reminder brings it back.
 */
export default function QuickOrder({ data }: { data: QuickData }) {
  const { ui, lang } = useLang();
  const q = ui.quick;
  const u = ui.funnel;
  const c = ui.common;

  const [open, setOpen] = useState(false);
  const [slug, setSlug] = useState<string>("");
  const [picking, setPicking] = useState(false);
  // Step 1
  const [name, setName] = useState("");
  const [mobile, setMobile] = useState("");
  const [preErrorsOn, setPreErrorsOn] = useState(false);
  const [extras, setExtras] = useState<string[]>([]);
  const [showExtras, setShowExtras] = useState(false);
  const [pay, setPay] = useState<{ status: "idle" | "working" | "error"; message?: string }>({ status: "idle" });
  const [whatsAppOnly, setWhatsAppOnly] = useState(!data.payEnabled);
  const [couponOpen, setCouponOpen] = useState(false);
  const [couponInput, setCouponInput] = useState("");
  const [coupon, setCoupon] = useState<{ code: string; discountInr: number; totalInr: number } | null>(null);
  const [couponMsg, setCouponMsg] = useState<{ busy?: boolean; error?: string } | null>(null);
  const urlCoupon = useRef("");
  const utm = useRef<Record<string, string>>({});
  // Step 2 (after payment)
  const [paid, setPaid] = useState<Paid | null>(null);
  const [pending, setPending] = useState<Paid | null>(null);
  const [remindHidden, setRemindHidden] = useState(false);
  const [stage, setStage] = useState<"details" | "numbers">("details");
  const [d, setD] = useState<Details>(EMPTY_DETAILS);
  const [detErrorsOn, setDetErrorsOn] = useState(false);
  const [pin, setPin] = useState<{ status: "idle" | "loading" | "found" | "failed"; edit?: boolean }>({ status: "idle" });
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
  const setDet = <K extends keyof Details>(k: K, v: Details[K]) => setD((s) => ({ ...s, [k]: v }));

  /* ---- opening and closing ---- */
  const pushHistory = () => {
    if (pushed.current) return;
    window.history.pushState({ ...(window.history.state ?? {}), bbaOrder: 1 }, "");
    pushed.current = true;
  };
  const show = useCallback(
    (s?: string) => {
      const known = !!s && products.some((p) => p.slug === s);
      if (known) setSlug(s!);
      setPicking((cur) => (known ? false : !slug || cur));
      setOpen(true);
      pushHistory();
      track("order_sheet_open", { bracelet: s ?? "" });
    },
    [products, slug],
  );

  /** Reminder: reopen the details form for a paid order. */
  const showDetails = (p: Paid) => {
    setPaid(p);
    setStage("details");
    setD((s) => ({ ...s, wearerName: s.wearerName || p.name, deliverTo: s.deliverTo || p.name }));
    setOpen(true);
    pushHistory();
  };

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
    setPending(readPending());
    try {
      setRemindHidden(sessionStorage.getItem("bba_remind_hidden") === "1");
    } catch {}
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
    if (!/^[1-9]\d{5}$/.test(d.pincode)) {
      setPin((p) => (p.status === "idle" ? p : { status: "idle" }));
      return;
    }
    let live = true;
    setPin({ status: "loading" });
    fetch(`/api/pincode?pin=${d.pincode}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((x: { city?: string; state?: string } | null) => {
        if (!live) return;
        if (x?.city && x.state) {
          setD((s) => ({ ...s, city: x.city!, state: x.state! }));
          setPin({ status: "found" });
        } else setPin({ status: "failed" });
      })
      .catch(() => live && setPin({ status: "failed" }));
    return () => {
      live = false;
    };
  }, [d.pincode]);

  /* ---- prices ---- */
  const listTotal = product ? priceFor(product.priceInr, 1 + extras.length, data.tiers) : 0;
  const total = coupon ? coupon.totalInr : listTotal;
  const nextExtra = product && extras.length < MAX_PURPOSES - 1 ? extraFor(product.priceInr, 1 + extras.length, 2 + extras.length, data.tiers) : null;

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
        body: JSON.stringify({ lang, code, bracelet: product.slug, extras, mobile: /^[6-9]\d{9}$/.test(mobile) ? mobile : "" }),
      }).catch(() => null);
      const x = res ? await res.json().catch(() => ({})) : {};
      if (res?.ok && x.ok) {
        setCoupon({ code: x.code, discountInr: x.discountInr, totalInr: x.totalInr });
        setCouponMsg(null);
      } else {
        setCoupon(null);
        setCouponMsg({ error: x.error ?? u.couponFailed });
      }
    },
    [product, extras, mobile, lang, u.couponEmpty, u.couponFailed],
  );
  useEffect(() => {
    if (open && product && urlCoupon.current && !coupon) applyCoupon(urlCoupon.current);
    else if (coupon) applyCoupon(coupon.code);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, product?.slug, extras]);

  /* ---- step 1: validation ---- */
  const preErrors = useMemo(() => {
    const e: Partial<Record<PreField, string>> = {};
    if (!product) e.purpose = q.errors.purpose;
    if (!name.trim()) e.name = q.errors.name;
    if (!/^[6-9]\d{9}$/.test(mobile)) e.mobile = u.errors.mobile;
    return e;
  }, [product, name, mobile, q, u]);

  /* ---- step 2: validation ---- */
  const day = Number(d.day), month = Number(d.month), year = Number(d.year);
  const dobValid = !!(day && month && year && isValidDate(day, month, year) && new Date(year, month - 1, day) <= new Date());
  const minor = dobValid && ageFrom(day, month, year) < 18;
  const detErrors = useMemo(() => {
    const e: Partial<Record<DetailField, string>> = {};
    if (!d.wearerName.trim()) e.wearerName = q.errors.name;
    if (!dobValid) e.dob = d.day && d.month && d.year ? c.badDate : q.errors.dob;
    if (minor && !d.guardian) e.guardian = q.errors.guardian;
    if (d.gift && !d.deliverTo.trim()) e.deliverTo = u.errors.deliveryName;
    if (!/^[1-9]\d{5}$/.test(d.pincode)) e.pincode = u.errors.pincode;
    if (!d.house.trim()) e.house = u.errors.line1;
    if (!d.city.trim()) e.city = u.errors.city;
    if (!d.state) e.state = u.errors.state;
    return e;
  }, [d, dobValid, minor, q, u, c.badDate]);

  type AnyField = PreField | DetailField;
  const errOf = (k: AnyField): string | undefined =>
    (preErrorsOn && (preErrors as Record<string, string>)[k]) || (detErrorsOn && (detErrors as Record<string, string>)[k]) || undefined;
  const errProps = (k: AnyField) => ({ "aria-invalid": !!errOf(k), "aria-describedby": errOf(k) ? `qo-err-${k}` : undefined });
  const errMsg = (k: AnyField) =>
    errOf(k) ? (
      <em className="fn-err" id={`qo-err-${k}`}>
        {errOf(k)}
      </em>
    ) : null;
  const focusFirstError = () => window.setTimeout(() => panel.current?.querySelector<HTMLElement>("[aria-invalid='true']")?.focus(), 40);

  const [firstName, ...rest] = name.trim().split(/\s+/);
  const lastName = rest.join(" ");
  const titles = (list: string[]) => list.map((x) => bySlug(x)?.title ?? x).join(" + ");

  /* ---- step 1: pay ---- */
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (Object.keys(preErrors).length) {
      setPreErrorsOn(true);
      focusFirstError();
      return;
    }
    if (!product) return;
    const purposes = [product.slug, ...extras];
    if (whatsAppOnly) {
      track("order_whatsapp", { bracelet: product.slug, value: total, currency: "INR" });
      const text = [
        tf(q.waOrder, { title: titles(purposes), amount: formatINR(total) }),
        tf(q.waShort, { name: name.trim(), mobile }),
        coupon ? `${u.coupon}: ${coupon.code}` : "",
      ]
        .filter(Boolean)
        .join("\n");
      window.open(`https://wa.me/${data.waPhone}?text=${encodeURIComponent(text)}`, "_blank", "noopener,noreferrer");
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
          wearer: { firstName, lastName, wrist: "unsure" },
          intentions: purposes,
          focus: "",
          isGift: false,
          giftNote: "",
          contact: { deliveryName: name.trim(), mobile, email: "" },
          consent: true,
          marketing: false,
          utm: utm.current,
          ...(coupon ? { coupon: coupon.code } : {}),
          extras,
        }),
      });
      const x = await res.json().catch(() => ({}));
      if (res.status === 503) {
        setWhatsAppOnly(true);
        setPay({ status: "error", message: q.noPayYet });
        return;
      }
      if (!res.ok) {
        if (x.field === "coupon") {
          setCoupon(null);
          setCouponMsg({ error: x.error });
        }
        setPay({ status: "error", message: x.error ?? u.payGeneric });
        return;
      }
      if (!(await loadRazorpay()) || !window.Razorpay) {
        setPay({ status: "error", message: u.payLoad });
        return;
      }
      const rzp = new window.Razorpay({
        key: x.keyId,
        order_id: x.orderId,
        amount: x.amount,
        currency: x.currency,
        name: "Bracelet By Ammit",
        description: tf(u.rzpDescription, { title: titles(purposes) }),
        image: `${window.location.origin}/brand/emblem.png`,
        prefill: { name: name.trim(), contact: `+91${mobile}` },
        notes: { ref: x.ref },
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
            const p: Paid = { ref: x.ref, rzpOrderId: x.orderId, purposes, name: name.trim(), mobile, at: Date.now() };
            writePending(p);
            setPending(p);
            setPaid(p);
            setStage("details");
            setD({ ...EMPTY_DETAILS, wearerName: name.trim(), deliverTo: name.trim() });
            setPay({ status: "idle" });
            track("purchase", { transaction_id: x.ref, value: x.amount / 100, currency: "INR", ...(coupon ? { coupon: coupon.code } : {}) }, "Purchase");
          } else {
            setPay({ status: "error", message: vd.error ?? tf(u.payUnconfirmed, { ref: x.ref }) });
          }
        },
      });
      rzp.on("payment.failed", (r) => setPay({ status: "error", message: r.error?.description ?? u.payFailed }));
      rzp.open();
    } catch {
      setPay({ status: "error", message: u.payGeneric });
    }
  };

  /* ---- step 2: save the details ---- */
  const saveDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!paid) return;
    if (Object.keys(detErrors).length) {
      setDetErrorsOn(true);
      focusFirstError();
      return;
    }
    const [wFirst, ...wRest] = d.wearerName.trim().split(/\s+/);
    setDetailsState({ status: "working" });
    const res = await fetch("/api/order/details", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        orderId: paid.rzpOrderId,
        lang,
        isGift: d.gift,
        wearer: { firstName: wFirst, lastName: wRest.join(" "), day, month, year },
        ...(d.gender ? { gender: d.gender } : {}),
        wrist: d.wrist || "unsure",
        deliveryName: d.gift ? d.deliverTo.trim() : d.wearerName.trim(),
        address: { line1: d.house.trim(), line2: d.area.trim(), city: d.city.trim(), state: d.state, pincode: d.pincode },
        focus: d.focus,
        note: d.note.trim(),
        marketing: d.marketing,
      }),
    }).catch(() => null);
    const x = res ? await res.json().catch(() => ({})) : {};
    if (res?.ok) {
      writePending(null);
      setPending(null);
      setDetailsState({ status: "saved", message: q.detailsSaved });
      setStage("numbers");
      track("order_details", { ref: paid.ref });
    } else setDetailsState({ status: "error", message: x.error ?? ui.server.detailsFailed });
  };

  const startTopUp = async () => {
    const base = paid ? bySlug(paid.purposes[0]) : undefined;
    if (!paid || !base) return;
    setTopUpState({ status: "working" });
    try {
      const res = await fetch("/api/checkout/upgrade", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lang, orderId: paid.rzpOrderId, add: topUp }),
      });
      const x = await res.json().catch(() => ({}));
      if (!res.ok) return setTopUpState({ status: "error", message: x.error ?? u.payGeneric });
      if (!(await loadRazorpay()) || !window.Razorpay) return setTopUpState({ status: "error", message: u.payLoad });
      const added = topUp.map((t) => bySlug(t)?.title ?? t);
      const rzp = new window.Razorpay({
        key: x.keyId,
        order_id: x.orderId,
        amount: x.amount,
        currency: x.currency,
        name: "Bracelet By Ammit",
        description: tf(u.rzpTopUp, { title: added.join(" + "), ref: x.ref }),
        image: `${window.location.origin}/brand/emblem.png`,
        prefill: x.prefill,
        notes: { ref: x.ref },
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
            track("purchase", { transaction_id: `${x.ref}-up`, value: x.amount / 100, currency: "INR", upgrade: 1 }, "Purchase");
          } else setTopUpState({ status: "error", message: tf(u.topUpUnconfirmed, { ref: x.ref }) });
        },
      });
      rzp.on("payment.failed", (r) => setTopUpState({ status: "error", message: r.error?.description ?? u.payFailed }));
      rzp.open();
    } catch {
      setTopUpState({ status: "error", message: u.payGeneric });
    }
  };

  const finish = () => {
    setPaid(null);
    setName("");
    setMobile("");
    setPreErrorsOn(false);
    setDetErrorsOn(false);
    setExtras([]);
    setCoupon(null);
    setD(EMPTY_DETAILS);
    setDetailsState({ status: "idle" });
    setTopUp([]);
    setTopUpState({ status: "idle" });
    setStage("details");
    close();
  };

  /* ---- reminder for a paid order without details ---- */
  const reminder =
    pending && !open && !remindHidden ? (
      <div className="qo-remind" role="status">
        <p>{tf(q.remind, { ref: pending.ref })}</p>
        <button type="button" className="btn btn-gold" onClick={() => showDetails(pending)}>
          {q.remindButton}
        </button>
        <button
          type="button"
          className="qo-remind-x"
          aria-label={q.remindHide}
          onClick={() => {
            setRemindHidden(true);
            try {
              sessionStorage.setItem("bba_remind_hidden", "1");
            } catch {}
          }}
        >
          ×
        </button>
      </div>
    ) : null;

  if (!open) return reminder;

  const win = deliveryWindow(data.minDays, data.maxDays, new Date(), INTL_LOCALE[lang]);
  const wearer = (d.wearerName.trim() || paid?.name || "").split(/\s+/)[0];
  const m = dobValid ? mulank(day) : undefined;
  const bh = dobValid ? bhagyank(day, month, year) : undefined;
  const mInfo = data.mulank.find((x) => x.number === m);
  const paidProduct = paid ? bySlug(paid.purposes[0]) : undefined;
  const showCityState =
    pin.status === "failed" || pin.edit || (pin.status === "idle" && !!(d.city || d.state)) || (detErrorsOn && !!(detErrors.city || detErrors.state));
  const waHelp = paid ? `https://wa.me/${data.waPhone}?text=${encodeURIComponent(tf(q.waDetails, { ref: paid.ref }))}` : "";

  return (
    <>
      <div className="qo-scrim" onClick={close} aria-hidden="true" />
      <div ref={panel} className="qo" role="dialog" aria-modal="true" aria-labelledby="qo-title">
        <div className="qo-head">
          <h2 id="qo-title" ref={titleRef} tabIndex={-1} className="qo-title">
            {paid ? (paid.name ? tf(q.paidTitleName, { name: paid.name.split(/\s+/)[0] }) : q.paidTitle) : picking ? q.choosePurpose : q.dialog}
          </h2>
          <button type="button" className="qo-close" onClick={paid && stage === "numbers" ? finish : close} aria-label={q.close} disabled={pay.status === "working"}>
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
                    {p.photo ? (
                      <span className="qo-purpose-img">
                        <Image src={p.photo} alt="" fill sizes="48px" />
                      </span>
                    ) : (
                      <Sphere color={p.sphere.color} shade={p.sphere.shade} gloss={p.sphere.gloss} size={34} />
                    )}
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

        {/* Step 1: name + WhatsApp, then pay */}
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
                  <b>{titles([product.slug, ...extras])}</b>
                  <small>{q.made}</small>
                  <span className="qo-product-links">
                    <button type="button" className="fn-link" onClick={() => setPicking(true)}>
                      {q.change}
                    </button>
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
                  title={u.addTitle}
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

              <p className="qo-lead">{q.prePay}</p>

              <label className="fn-field">
                <span>{q.yourName}</span>
                <input value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" maxLength={100} {...errProps("name")} />
                {errMsg("name")}
              </label>

              <label className="fn-field">
                <span>{q.mobile}</span>
                <span className="qo-tel">
                  <span aria-hidden="true">+91</span>
                  <input
                    value={mobile}
                    onChange={(e) => setMobile(e.target.value.replace(/\D/g, "").replace(/^91(?=\d{10})/, "").slice(0, 10))}
                    inputMode="numeric"
                    autoComplete="tel-national"
                    placeholder={u.mobilePlaceholder}
                    {...errProps("mobile")}
                  />
                </span>
                {errOf("mobile") ? errMsg("mobile") : <small className="qo-help">{q.mobileHelp}</small>}
              </label>

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
              {preErrorsOn && Object.keys(preErrors).length > 0 && pay.status !== "error" && (
                <p className="fn-error" role="alert">
                  {q.fixErrors}
                </p>
              )}
              <button type="submit" className={`btn ${whatsAppOnly ? "btn-gold" : "btn-lapis"} qo-pay`} disabled={pay.status === "working"}>
                {pay.status === "working" ? (pay.message ?? u.opening) : whatsAppOnly ? q.sendWhatsApp : tf(q.pay, { amount: formatINR(total) })}
              </button>
              <p className="qo-agree">{whatsAppOnly ? q.noPayYet : <RichText text={q.agree} newTab />}</p>
            </div>
          </form>
        )}

        {/* Step 2: the details form */}
        {paid && stage === "details" && (
          <form className="qo-form" noValidate onSubmit={saveDetails}>
            <div className="qo-body qo-after">
              <p className="fn-kicker">
                <span aria-hidden="true">◆</span> {tf(q.paidKicker, { ref: paid.ref })}
              </p>
              <div>
                <h3 className="qo-h3">{q.detailsTitle}</h3>
                <p className="qo-help">{q.detailsNeed}</p>
              </div>

              <fieldset>
                <legend>{q.forWhom}</legend>
                <div className="qo-chips">
                  {(
                    [
                      [false, u.forMe],
                      [true, u.forGift],
                    ] as const
                  ).map(([g, label]) => (
                    <button
                      key={String(g)}
                      type="button"
                      className={`qo-chip${d.gift === g ? " is-on" : ""}`}
                      aria-pressed={d.gift === g}
                      onClick={() =>
                        setD((s) => ({
                          ...s,
                          gift: g,
                          // The buyer's name fits "for me"; for a gift, ask the wearer's.
                          wearerName: g ? (s.wearerName === paid.name ? "" : s.wearerName) : s.wearerName || paid.name,
                        }))
                      }
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </fieldset>

              <label className="fn-field">
                <span>{d.gift ? q.wearerName : q.name}</span>
                <input value={d.wearerName} onChange={(e) => setDet("wearerName", e.target.value)} autoComplete={d.gift ? "off" : "name"} maxLength={100} {...errProps("wearerName")} />
                {errMsg("wearerName")}
              </label>

              <fieldset className="qo-dob">
                <legend>{d.gift ? q.dobGift : q.dob}</legend>
                <div className="fn-fields cols-dob">
                  <select value={d.day} onChange={(e) => setDet("day", e.target.value)} aria-label={c.day} {...errProps("dob")}>
                    <option value="">{c.day}</option>
                    {Array.from({ length: 31 }, (_, i) => (
                      <option key={i + 1} value={i + 1}>
                        {i + 1}
                      </option>
                    ))}
                  </select>
                  <select value={d.month} onChange={(e) => setDet("month", e.target.value)} aria-label={c.month} {...errProps("dob")}>
                    <option value="">{c.month}</option>
                    {c.months.map((mo, i) => (
                      <option key={mo} value={i + 1}>
                        {mo}
                      </option>
                    ))}
                  </select>
                  <select value={d.year} onChange={(e) => setDet("year", e.target.value)} aria-label={c.year} {...errProps("dob")}>
                    <option value="">{c.year}</option>
                    {YEARS.map((y) => (
                      <option key={y} value={y}>
                        {y}
                      </option>
                    ))}
                  </select>
                </div>
                {errOf("dob") ? errMsg("dob") : <small className="qo-help">{q.dobHelp}</small>}
              </fieldset>
              {minor && (
                <label className="fn-check">
                  <input type="checkbox" checked={d.guardian} onChange={(e) => setDet("guardian", e.target.checked)} {...errProps("guardian")} />
                  <span>{u.minor}</span>
                </label>
              )}
              {errMsg("guardian")}

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
                    <button key={g} type="button" className={`qo-chip${d.gender === g ? " is-on" : ""}`} aria-pressed={d.gender === g} onClick={() => setDet("gender", g)}>
                      {label}
                    </button>
                  ))}
                </div>
              </fieldset>

              <fieldset className="qo-wrist">
                <legend>{q.wrist}</legend>
                <div className="qo-chips">
                  {[...WRISTS, "unsure"].map((w) => (
                    <button key={w} type="button" className={`qo-chip${d.wrist === w ? " is-on" : ""}`} aria-pressed={d.wrist === w} onClick={() => setDet("wrist", w)}>
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
                {d.gift && (
                  <label className="fn-field">
                    <span>{q.deliverTo}</span>
                    <input value={d.deliverTo} onChange={(e) => setDet("deliverTo", e.target.value)} autoComplete="name" maxLength={80} {...errProps("deliverTo")} />
                    {errMsg("deliverTo")}
                  </label>
                )}
                <label className="fn-field qo-pin">
                  <span>{q.pincode}</span>
                  <input
                    value={d.pincode}
                    onChange={(e) => setDet("pincode", e.target.value.replace(/\D/g, "").slice(0, 6))}
                    inputMode="numeric"
                    autoComplete="postal-code"
                    {...errProps("pincode")}
                  />
                  {errMsg("pincode")}
                  {pin.status === "loading" && (
                    <small className="qo-help" aria-live="polite">
                      {q.pinFinding}
                    </small>
                  )}
                  {pin.status === "found" && !pin.edit && (
                    <small className="qo-found" aria-live="polite">
                      ✓ {d.city}, {d.state}{" "}
                      <button type="button" className="fn-link" onClick={() => setPin((p) => ({ ...p, edit: true }))}>
                        {q.change}
                      </button>
                    </small>
                  )}
                </label>
                <label className="fn-field">
                  <span>{q.house}</span>
                  <input value={d.house} onChange={(e) => setDet("house", e.target.value)} autoComplete="address-line1" maxLength={120} {...errProps("house")} />
                  {errMsg("house")}
                </label>
                <label className="fn-field">
                  <span>{q.area}</span>
                  <input value={d.area} onChange={(e) => setDet("area", e.target.value)} autoComplete="address-line2" maxLength={120} />
                </label>
                {showCityState && (
                  <div className="fn-fields cols-2">
                    <label className="fn-field">
                      <span>{q.city}</span>
                      <input value={d.city} onChange={(e) => setDet("city", e.target.value)} autoComplete="address-level2" maxLength={60} {...errProps("city")} />
                      {errMsg("city")}
                    </label>
                    <label className="fn-field">
                      <span>{q.state}</span>
                      <select value={d.state} onChange={(e) => setDet("state", e.target.value)} autoComplete="address-level1" {...errProps("state")}>
                        <option value="">{u.chooseState}</option>
                        {INDIAN_STATES.map((st) => (
                          <option key={st} value={st}>
                            {st}
                          </option>
                        ))}
                      </select>
                      {errMsg("state")}
                    </label>
                  </div>
                )}
              </fieldset>

              {paidProduct && paidProduct.listA.length > 0 && (
                <fieldset>
                  <legend>{q.focusLabel}</legend>
                  <div className="qo-chips is-list">
                    {[...paidProduct.listA, u.somethingElse].map((x) => (
                      <button key={x} type="button" className={`qo-chip${d.focus === x ? " is-on" : ""}`} aria-pressed={d.focus === x} onClick={() => setDet("focus", d.focus === x ? "" : x)}>
                        {x}
                      </button>
                    ))}
                  </div>
                </fieldset>
              )}
              <label className="fn-field">
                <span>{q.noteLabel}</span>
                <textarea rows={2} value={d.note} onChange={(e) => setDet("note", e.target.value)} maxLength={500} placeholder={q.notePlaceholder} />
              </label>
              <label className="fn-check is-light">
                <input type="checkbox" checked={d.marketing} onChange={(e) => setDet("marketing", e.target.checked)} />
                <span>{u.marketing}</span>
              </label>
            </div>
            <div className="qo-foot">
              {detailsState.status === "error" && (
                <p className="fn-error" role="alert">
                  {detailsState.message}
                </p>
              )}
              {detErrorsOn && Object.keys(detErrors).length > 0 && detailsState.status !== "error" && (
                <p className="fn-error" role="alert">
                  {q.fixErrors}
                </p>
              )}
              <button type="submit" className="btn btn-lapis qo-pay" disabled={detailsState.status === "working"}>
                {detailsState.status === "working" ? q.saving : q.saveDetails}
              </button>
              <p className="qo-agree">
                <RichText text={tf(q.viaWhatsApp, { url: waHelp })} />
              </p>
            </div>
          </form>
        )}

        {/* After the details: numbers, add a purpose, what happens next */}
        {paid && stage === "numbers" && paidProduct && (
          <div className="qo-body qo-after">
            <p className="fn-kicker">
              <span aria-hidden="true">◆</span> {tf(q.paidKicker, { ref: paid.ref })}
            </p>
            <div className="qo-numbers">
              {detailsState.status === "saved" && (
                <p className="fn-topup-done" role="status">
                  {detailsState.message}
                </p>
              )}
              {mInfo && (
                <>
                  <h3 className="qo-h3">{d.gift ? tf(q.numbersTitleGift, { name: wearer || u.theWearer }) : q.numbersTitle}</h3>
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
                <li>{d.gift ? tf(u.nextThem, { name: wearer }) : u.nextYou}</li>
                <li>{tf(u.nextWhatsApp, { mobile: paid.mobile })}</li>
                <li>{tf(u.nextDelivery, { dates: win })}</li>
              </ol>
              <div className="qo-actions">
                <button type="button" className="btn btn-lapis" onClick={finish}>
                  {q.done}
                </button>
              </div>
              <p className="small-note">{tf(u.questions, { ref: paid.ref })}</p>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
