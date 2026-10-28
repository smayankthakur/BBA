import TrustBar from "./TrustBar";
import { getContent, getSite } from "@/lib/server/content";
import { getUI } from "@/lib/server/lang";

/** Trust bar with the current shipping settings (server pages). */
export default async function SiteTrustBar({ compact = false, onDark = false }: { compact?: boolean; onDark?: boolean }) {
  const [{ s }, shared] = await Promise.all([getSite(), getContent("shared")]);
  return (
    <TrustBar
      compact={compact}
      onDark={onDark}
      text={{
        shipping: shared.trustShipping,
        payment: shared.trustPayment,
        minDays: s.shippingMinDays,
        maxDays: s.shippingMaxDays,
        aria: getUI().trust.aria,
        delivered: getUI().trust.delivered,
      }}
    />
  );
}
