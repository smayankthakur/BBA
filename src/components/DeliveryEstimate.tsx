"use client";

import { useEffect, useState } from "react";
import { SHIPPING } from "@/data/home";
import { deliveryWindow } from "@/lib/delivery";

/**
 * Dated delivery estimate. Pages are static, so the dates are worked out in
 * the browser; before that it shows the plain "5–7 days" range.
 */
export default function DeliveryEstimate() {
  const [dates, setDates] = useState<string>();
  useEffect(() => setDates(deliveryWindow()), []);
  return (
    <>
      {SHIPPING.minDays}–{SHIPPING.maxDays} days{dates ? <span className="tb-dates">, {dates}</span> : null}
    </>
  );
}
