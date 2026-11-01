import type { Metadata } from "next";
import { getLang, getUI, pageLang } from "@/lib/server/lang";
import { alternatesFor } from "@/lib/i18n/config";
import PageShell from "@/components/PageShell";
import PageHero from "@/components/PageHero";
import TrackOrder from "@/components/TrackOrder";
import { getSite } from "@/lib/server/content";

type Params = { params: Promise<{ lang: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  await pageLang(params);
  const t = getUI().track;
  // Personal lookups: keep the page itself out of search results' snippets but allow the link.
  return { title: t.title, description: t.seoDescription, alternates: alternatesFor(getLang(), "/track") };
}

export default async function TrackPage({ params }: Params) {
  await pageLang(params);
  const t = getUI().track;
  const { s } = await getSite();
  const waPhone = s.phone.replace(/\D/g, "").replace(/^0/, "").replace(/^(\d{10})$/, "91$1");
  return (
    <PageShell>
      <PageHero crumbs={[{ label: t.title }]} eyebrow={t.eyebrow} title={t.title} lede={<p>{t.lede}</p>} />
      <TrackOrder waPhone={waPhone} />
    </PageShell>
  );
}
