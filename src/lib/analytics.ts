// Consent-gated analytics. Nothing loads unless (a) an ID is configured via
// NEXT_PUBLIC_GA_ID / NEXT_PUBLIC_META_PIXEL_ID and (b) the visitor accepts.

export const GA_ID = process.env.NEXT_PUBLIC_GA_ID ?? "";
export const META_PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID ?? "";
export const ANALYTICS_ENABLED = !!(GA_ID || META_PIXEL_ID);

export const CONSENT_KEY = "bba-consent-v1";
export type Consent = "accepted" | "rejected";

type W = Window & {
  dataLayer?: unknown[];
  gtag?: (...args: unknown[]) => void;
  fbq?: ((...args: unknown[]) => void) & { callMethod?: unknown; queue?: unknown[]; loaded?: boolean; version?: string; push?: unknown };
  _fbq?: unknown;
  __bbaAnalytics?: boolean;
};

export function readConsent(): Consent | null {
  try {
    const raw = window.localStorage.getItem(CONSENT_KEY);
    if (!raw) return null;
    const v = JSON.parse(raw) as { choice?: Consent };
    return v.choice ?? null;
  } catch {
    return null;
  }
}

export function saveConsent(choice: Consent) {
  try {
    window.localStorage.setItem(CONSENT_KEY, JSON.stringify({ choice, at: new Date().toISOString() }));
  } catch {
    /* storage unavailable: choice applies to this page view only */
  }
}

function addScript(src: string) {
  const s = document.createElement("script");
  s.async = true;
  s.src = src;
  document.head.appendChild(s);
}

/** Load GA4 / Meta Pixel. Call only after the visitor accepts. */
export function loadAnalytics() {
  const w = window as W;
  if (w.__bbaAnalytics || !ANALYTICS_ENABLED) return;
  w.__bbaAnalytics = true;

  if (GA_ID) {
    w.dataLayer = w.dataLayer || [];
    w.gtag = function gtag() {
      // eslint-disable-next-line prefer-rest-params
      (w.dataLayer as unknown[]).push(arguments);
    };
    w.gtag("js", new Date());
    w.gtag("config", GA_ID, { anonymize_ip: true });
    addScript(`https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(GA_ID)}`);
  }

  if (META_PIXEL_ID && !w.fbq) {
    const fbq = function (...args: unknown[]) {
      const f = fbq as unknown as { callMethod?: (...a: unknown[]) => void; queue: unknown[] };
      if (f.callMethod) f.callMethod(...args);
      else f.queue.push(args);
    } as W["fbq"] & { queue: unknown[]; loaded: boolean; version: string; push: unknown };
    fbq.queue = [];
    fbq.loaded = true;
    fbq.version = "2.0";
    fbq.push = fbq;
    w.fbq = fbq;
    w._fbq = fbq;
    addScript("https://connect.facebook.net/en_US/fbevents.js");
    w.fbq!("init", META_PIXEL_ID);
    w.fbq!("track", "PageView");
  }
}

/** Fire an event if analytics has been loaded (no-op otherwise). */
export function track(event: string, params: Record<string, string | number> = {}, metaEvent?: string) {
  if (typeof window === "undefined") return;
  const w = window as W;
  if (!w.__bbaAnalytics) return;
  w.gtag?.("event", event, params);
  if (metaEvent) w.fbq?.("track", metaEvent, params);
}
