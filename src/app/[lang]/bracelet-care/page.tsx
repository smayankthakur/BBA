import { getLang, getUI, pageLang } from "@/lib/server/lang";
import { alternatesFor } from "@/lib/i18n/config";
import { tf } from "@/lib/i18n/ui";
import type { Metadata } from "next";
import PageShell from "@/components/PageShell";
import PageHero from "@/components/PageHero";
import OrderCta from "@/components/OrderCta";
import VideoEmbed from "@/components/VideoEmbed";
import { getContent, getSite } from "@/lib/server/content";
import { fill, Markdown } from "@/lib/content/render";

type Params = { params: Promise<{ lang: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  await pageLang(params);
  const c = await getContent("care");
  return { title: c.seoTitle || c.title, description: c.seoDescription, alternates: alternatesFor(getLang(), "/bracelet-care") };
}

export default async function CarePage({ params }: Params) {
  await pageLang(params);
  const [c, { vars }] = await Promise.all([getContent("care"), getSite()]);
  return (
    <PageShell>
      <PageHero crumbs={[{ label: getUI().carePage.crumb }]} eyebrow={c.eyebrow} title={c.title} lede={<p>{c.lede}</p>} />
      {c.items.length > 0 && (
        <section className="section-wide grid-section" aria-label="Care steps">
          <div className="info-grid" tabIndex={0} role="region" aria-label="Care basics">
            {c.items.map((x, i) => (
              <div key={i} className="info-card">
                <h2 className="h3">{x.term}</h2>
                <p>{x.detail}</p>
              </div>
            ))}
          </div>
        </section>
      )}
      <section className="section-narrow split-lists">
        <div>
          <h2 className="h3">{c.dosTitle}</h2>
          <ul className="tick-list">
            {c.dos.map((d, i) => (
              <li key={i}>{d}</li>
            ))}
          </ul>
        </div>
        <div>
          <h2 className="h3">{c.dontsTitle}</h2>
          <ul className="cross-list">
            {c.donts.map((d, i) => (
              <li key={i}>{d}</li>
            ))}
          </ul>
        </div>
      </section>
      <section className="section-narrow prose-section">
        <h2 className="h2">{c.breakTitle}</h2>
        <Markdown text={fill(c.breakText, vars)} />
        {c.videoId && <VideoEmbed video={{ id: c.videoId, title: c.breakTitle }} />}
      </section>
      <OrderCta title={c.ctaTitle} text={c.ctaText} secondary={{ label: getUI().common.orderNew, href: "/find-your-bracelet" }} />
    </PageShell>
  );
}
