import { getLang, getUI, pageLang } from "@/lib/server/lang";
import { alternatesFor } from "@/lib/i18n/config";
import { tf } from "@/lib/i18n/ui";
import type { Metadata } from "next";
import Funnel, { type FunnelData } from "@/components/funnel/Funnel";
import { getBracelets } from "@/lib/server/catalog";
import { getContent, getSite } from "@/lib/server/content";

type Params = { params: Promise<{ lang: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  await pageLang(params);
  const c = await getContent("funnel");
  return { title: c.seoTitle || c.introTitle, description: c.seoDescription, alternates: alternatesFor(getLang(), "/find-your-bracelet") };
}

export default async function FindYourBraceletPage({ params }: Params) {
  await pageLang(params);
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
      ? { quote: shot.text, name: shot.name, sourceLabel: getUI().common.viewOnInstagram, sourceUrl: shot.link, image: shot.image }
      : written
        ? { quote: written.quote, name: written.name, sourceLabel: written.sourceLabel, sourceUrl: written.sourceUrl }
        : null,
    copy,
    trust: {
      shipping: shared.trustShipping,
      payment: shared.trustPayment,
      minDays: s.shippingMinDays,
      maxDays: s.shippingMaxDays,
      aria: getUI().trust.aria,
      delivered: getUI().trust.delivered,
    },
    refNote: s.refNote,
    tiers: [s.defaultPrice, s.price2, s.price3],
  };
  return <Funnel data={data} />;
}
