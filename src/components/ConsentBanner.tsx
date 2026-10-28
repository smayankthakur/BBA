"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import Link from "./LocaleLink";
import { useLang } from "./LangProvider";
import { ANALYTICS_ENABLED, loadAnalytics, readConsent, saveConsent, type Consent } from "@/lib/analytics";

export const OPEN_CONSENT_EVENT = "bba:open-consent";

/**
 * Cookie consent. Renders nothing unless an analytics ID is configured.
 * "Reject" is as prominent as "Accept" (CCPA dark-pattern guidelines).
 */
export default function ConsentBanner() {
  const [open, setOpen] = useState(false);
  const t = useLang().ui.consent;
  const isAdmin = usePathname()?.startsWith("/admin") ?? false;

  useEffect(() => {
    if (!ANALYTICS_ENABLED || isAdmin) return;
    const c = readConsent();
    if (c === "accepted") loadAnalytics();
    if (!c) setOpen(true);
    const reopen = () => setOpen(true);
    window.addEventListener(OPEN_CONSENT_EVENT, reopen);
    return () => window.removeEventListener(OPEN_CONSENT_EVENT, reopen);
  }, [isAdmin]);

  if (!ANALYTICS_ENABLED || !open) return null;

  const choose = (c: Consent) => {
    saveConsent(c);
    if (c === "accepted") loadAnalytics();
    setOpen(false);
  };

  return (
    <div className="consent" role="dialog" aria-modal="false" aria-labelledby="consent-title">
      <p id="consent-title" className="consent-title">
        {t.title}
      </p>
      <p className="consent-text">
        {t.text} <Link href="/privacy">{t.privacy}</Link>
      </p>
      <div className="consent-actions">
        <button type="button" className="btn btn-line" onClick={() => choose("rejected")}>
          {t.reject}
        </button>
        <button type="button" className="btn btn-lapis" onClick={() => choose("accepted")}>
          {t.accept}
        </button>
      </div>
    </div>
  );
}
