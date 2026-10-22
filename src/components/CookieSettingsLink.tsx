"use client";

import { ANALYTICS_ENABLED } from "@/lib/analytics";
import { OPEN_CONSENT_EVENT } from "./ConsentBanner";

/** Footer link to reopen the cookie choice (only when analytics is configured). */
export default function CookieSettingsLink() {
  if (!ANALYTICS_ENABLED) return null;
  return (
    <button type="button" className="ft-cookie" onClick={() => window.dispatchEvent(new Event(OPEN_CONSENT_EVENT))}>
      Cookie settings
    </button>
  );
}
