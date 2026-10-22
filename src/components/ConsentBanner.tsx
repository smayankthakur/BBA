"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ANALYTICS_ENABLED, loadAnalytics, readConsent, saveConsent, type Consent } from "@/lib/analytics";

export const OPEN_CONSENT_EVENT = "bba:open-consent";

/**
 * Cookie consent. Renders nothing unless an analytics ID is configured.
 * "Reject" is as prominent as "Accept" (CCPA dark-pattern guidelines).
 */
export default function ConsentBanner() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!ANALYTICS_ENABLED) return;
    const c = readConsent();
    if (c === "accepted") loadAnalytics();
    if (!c) setOpen(true);
    const reopen = () => setOpen(true);
    window.addEventListener(OPEN_CONSENT_EVENT, reopen);
    return () => window.removeEventListener(OPEN_CONSENT_EVENT, reopen);
  }, []);

  if (!ANALYTICS_ENABLED || !open) return null;

  const choose = (c: Consent) => {
    saveConsent(c);
    if (c === "accepted") loadAnalytics();
    setOpen(false);
  };

  return (
    <div className="consent" role="dialog" aria-modal="false" aria-labelledby="consent-title">
      <p id="consent-title" className="consent-title">
        Cookies, only if you say yes
      </p>
      <p className="consent-text">
        We&apos;d like to use analytics cookies to see which pages help people find their bracelet. Nothing is
        tracked unless you accept. <Link href="/privacy">Privacy policy</Link>
      </p>
      <div className="consent-actions">
        <button type="button" className="btn btn-line" onClick={() => choose("rejected")}>
          Reject
        </button>
        <button type="button" className="btn btn-lapis" onClick={() => choose("accepted")}>
          Accept
        </button>
      </div>
    </div>
  );
}
