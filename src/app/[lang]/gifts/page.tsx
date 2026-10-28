import { getLang, getUI, pageLang } from "@/lib/server/lang";
import { alternatesFor } from "@/lib/i18n/config";
import { tf } from "@/lib/i18n/ui";
import type { Metadata } from "next";
import Link from "@/components/LocaleLink";
import PageShell from "@/components/PageShell";
import PageHero from "@/components/PageHero";
import HowItWorks from "@/components/HowItWorks";
import OrderCta from "@/components/OrderCta";
import GiftVisual from "@/components/GiftVisual";
import { getGifts } from "@/lib/server/catalog";
import { getContent, getSite } from "@/lib/server/content";
import { fill } from "@/lib/content/render";

type Params = { params: Promise<{ lang: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  await pageLang(params);
  const [c, { vars }] = await Promise.all([getContent("gifts"), getSite()]);
  return { title: c.seoTitle || c.title, description: fill(c.seoDescription, vars), alternates: alternatesFor(getLang(), "/gifts") };
}

export default async function GiftsIndex({ params }: Params) {
  await pageLang(params);
  const [c, { s, vars }, gifts] = await Promise.all([getContent("gifts"), getSite(), getGifts()]);
  const ui = getUI();
  return (
    <PageShell>
      <PageHero crumbs={[{ label: ui.giftsPage.crumb }]} eyebrow={c.eyebrow} title={c.title} align="center" lede={<p>{fill(c.lede, vars)}</p>} />
      <section className="section-wide gifts gifts-page" aria-label={ui.giftsPage.crumb}>
        <div className="gifts-grid">
          {gifts.map((g) => (
            <Link key={g.slug} href={`/gifts/${g.slug}`} className="gift">
              <GiftVisual gift={g} refNote={s.refNote} label={tf(ui.common.illustrationOf, { title: g.title })} className="arch" />
              <span className="gift-title">{g.title}</span>
              <span className="gift-blurb">{g.blurb}</span>
            </Link>
          ))}
        </div>
      </section>
      <HowItWorks title={c.howTitle} />
      <OrderCta title={c.ctaTitle} text={c.ctaText} primary={{ label: c.ctaButton, href: "/find-your-bracelet?for=gift" }} />
    </PageShell>
  );
}
