import { getLang, getUI, pageLang } from "@/lib/server/lang";
import { alternatesFor } from "@/lib/i18n/config";
import { tf } from "@/lib/i18n/ui";
import type { Metadata } from "next";
import PageShell from "@/components/PageShell";
import PageHero from "@/components/PageHero";
import Testimonials from "@/components/Testimonials";
import OrderCta from "@/components/OrderCta";
import { getContent } from "@/lib/server/content";

type Params = { params: Promise<{ lang: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  await pageLang(params);
  const c = await getContent("reviews");
  return { title: c.seoTitle || c.title, description: c.seoDescription, alternates: alternatesFor(getLang(), "/reviews") };
}

export default async function ReviewsPage({ params }: Params) {
  await pageLang(params);
  const c = await getContent("reviews");
  return (
    <PageShell>
      <PageHero crumbs={[{ label: getUI().reviewsPage.crumb }]} eyebrow={c.eyebrow} title={c.title} lede={<p>{c.lede}</p>} />
      <Testimonials />
      <OrderCta title={c.ctaTitle} text={c.ctaText} />
    </PageShell>
  );
}
