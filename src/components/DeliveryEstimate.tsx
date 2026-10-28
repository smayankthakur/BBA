"use client";

import { useEffect, useState } from "react";
import { deliveryWindow } from "@/lib/delivery";
import { useContext } from "react";
import { LangCtx } from "./LangProvider";
import { INTL_LOCALE } from "@/lib/i18n/config";
import { UI_EN } from "@/lib/i18n/ui.en";

/**
 * Dated delivery estimate. Pages are static, so the dates are worked out in
 * the browser; before that it shows the plain day range.
 */
export default function DeliveryEstimate({ minDays, maxDays }: { minDays: number; maxDays: number }) {
  const ctx = useContext(LangCtx);
  const lang = ctx?.lang ?? "en";
  const days = (ctx?.ui ?? UI_EN).trust.days.replace("{min}", String(minDays)).replace("{max}", String(maxDays));
  const [dates, setDates] = useState<string>();
  useEffect(() => setDates(deliveryWindow(minDays, maxDays, new Date(), INTL_LOCALE[lang])), [minDays, maxDays, lang]);
  return (
    <>
      {days}
      {dates ? <span className="tb-dates">, {dates}</span> : null}
    </>
  );
}
