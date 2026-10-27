"use client";

import { useEffect, useState } from "react";
import { deliveryWindow } from "@/lib/delivery";

/**
 * Dated delivery estimate. Pages are static, so the dates are worked out in
 * the browser; before that it shows the plain day range.
 */
export default function DeliveryEstimate({ minDays, maxDays }: { minDays: number; maxDays: number }) {
  const [dates, setDates] = useState<string>();
  useEffect(() => setDates(deliveryWindow(minDays, maxDays)), [minDays, maxDays]);
  return (
    <>
      {minDays}–{maxDays} days{dates ? <span className="tb-dates">, {dates}</span> : null}
    </>
  );
}
