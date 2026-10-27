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
  const review = reviews.items.find((r) => r.quote.trim()) ?? null;
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
    review: review ? { quote: review.quote, name: review.name, sourceLabel: review.sourceLabel, sourceUrl: review.sourceUrl } : null,
    copy,
    trust: { shipping: shared.trustShipping, payment: shared.trustPayment, minDays: s.shippingMinDays, maxDays: s.shippingMaxDays },
    refNote: s.refNote,
  };
  return <Funnel data={data} />;
}
