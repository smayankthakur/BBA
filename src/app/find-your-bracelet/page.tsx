import type { Metadata } from "next";
import Funnel, { type FunnelData } from "@/components/funnel/Funnel";
import { getBracelets } from "@/lib/server/catalog";
import { getContent, getSite } from "@/lib/server/content";

export async function generateMetadata(): Promise<Metadata> {
  const c = await getContent("funnel");
  return { title: c.seoTitle || c.introTitle, description: c.seoDescription, alternates: { canonical: "/find-your-bracelet" } };
}

export default async function FindYourBraceletPage() {
  const [bracelets, copy, mulank, reviews, shared, { s }] = await Promise.all([
    getBracelets(),
    getContent("funnel"),
    getContent("mulank"),
    getContent("reviews"),
    getContent("shared"),
    getSite(),
  ]);
  const shot = (reviews.shots ?? []).find((x) => x.image);
  const written = reviews.items.find((r) => r.quote.trim());
  const data: FunnelData = {
    products: bracelets.map((b) => ({
      slug: b.slug,
      title: b.title,
      blurb: b.blurb,
      crystals: b.crystals,
      priceInr: b.priceInr,
      photos: b.photos,
      inList: b.inList,
      visual: b.visual,
      listA: b.listA,
    })),
    mulank: mulank.numbers.map((m) => ({ number: m.number, planet: m.planet, planetHindi: m.planetHindi, traits: m.traits })),
    // An Instagram screenshot when there is one, otherwise a written review.
    review: shot
      ? { quote: shot.text, name: shot.name, sourceLabel: "View on Instagram", sourceUrl: shot.link, image: shot.image }
      : written
        ? { quote: written.quote, name: written.name, sourceLabel: written.sourceLabel, sourceUrl: written.sourceUrl }
        : null,
    copy,
    trust: { shipping: shared.trustShipping, payment: shared.trustPayment, minDays: s.shippingMinDays, maxDays: s.shippingMaxDays },
    refNote: s.refNote,
    tiers: [s.defaultPrice, s.price2, s.price3],
  };
  return <Funnel data={data} />;
}
