import { getBracelets } from "@/lib/server/catalog";
import { getContent, getSite } from "@/lib/server/content";
import QuickOrder from "./QuickOrder";
import type { QuickData } from "./types";

/** Server part of the order sheet: loads the purposes, prices and copy once per page. */
export default async function QuickOrderMount() {
  const [bracelets, shared, mulank, { s }] = await Promise.all([getBracelets(), getContent("shared"), getContent("mulank"), getSite()]);
  const data: QuickData = {
    products: bracelets
      .filter((b) => b.inList)
      .map((b) => ({
        slug: b.slug,
        title: b.title,
        blurb: b.blurb,
        priceInr: b.priceInr,
        photo: b.photos[0] ?? null,
        listA: b.listA.slice(0, 5),
        sphere: { color: b.visual.sphere, shade: b.visual.sphereShade, gloss: b.visual.sphereGloss },
      })),
    tiers: [s.defaultPrice, s.price2, s.price3],
    minDays: s.shippingMinDays,
    maxDays: s.shippingMaxDays,
    trust: { shipping: shared.trustShipping, payment: shared.trustPayment },
    mulank: mulank.numbers.map((m) => ({ number: m.number, planet: m.planet, planetHindi: m.planetHindi, traits: m.traits })),
    waPhone: s.phone.replace(/\D/g, "").replace(/^0/, "").replace(/^(\d{10})$/, "91$1"),
    payEnabled: !!process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
  };
  return <QuickOrder data={data} />;
}
