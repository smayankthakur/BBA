import { getLang, getUI, pageLang } from "@/lib/server/lang";
import { OG_LOCALE, alternatesFor, lp } from "@/lib/i18n/config";
import { tf } from "@/lib/i18n/ui";
import type { Metadata } from "next";
import Link from "@/components/LocaleLink";
import PageShell from "@/components/PageShell";
import PageHero from "@/components/PageHero";
import NoteFromAmmit from "@/components/NoteFromAmmit";
import OrderCta from "@/components/OrderCta";
import JsonLd from "@/components/JsonLd";
import VideoEmbed from "@/components/VideoEmbed";
import { getContent, getSite } from "@/lib/server/content";
import { SITE_URL } from "@/lib/site";

type Params = { params: Promise<{ lang: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  await pageLang(params);
  const [c, { s }] = await Promise.all([getContent("about"), getSite()]);
  return {
    title: c.seoTitle || c.title,
    description: c.seoDescription,
    alternates: alternatesFor(getLang(), "/about-ammit"),
    openGraph: {
      type: "profile",
      siteName: s.brand,
      locale: OG_LOCALE[getLang()],
      url: lp(getLang(), "/about-ammit"),
      title: `${c.seoTitle || c.title} | ${s.brand}`,
      description: c.seoDescription,
      ...(s.ammitPhoto ? { images: [{ url: s.ammitPhoto, alt: s.ammitPhotoAlt }] } : {}),
    },
  };
}

export default async function AboutPage({ params }: Params) {
  await pageLang(params);
  const [c, { s }] = await Promise.all([getContent("about"), getSite()]);
  const abs = (p: string) => (p.startsWith("http") ? p : `${SITE_URL}${p}`);
  return (
    <PageShell>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Person",
          name: s.ammitName,
          jobTitle: getUI().aboutPage.jobTitle,
          ...(s.ammitPhoto ? { image: abs(s.ammitPhoto) } : {}),
          worksFor: { "@type": "Organization", name: s.brand, url: SITE_URL },
          sameAs: [s.instagram, s.youtube].filter(Boolean),
        }}
      />
      <PageHero crumbs={[{ label: getUI().aboutPage.crumb }]} eyebrow={c.eyebrow} title={c.title} lede={<p>{c.lede}</p>} />
      <NoteFromAmmit />
      {c.videoId && (
        <section className="section-narrow video-section" aria-labelledby="avideo-title">
          <h2 id="avideo-title" className="h3">
            {c.videoTitle}
          </h2>
          <VideoEmbed video={{ id: c.videoId, title: c.videoTitle }} />
        </section>
      )}
      {c.work.length > 0 && (
        <section className="section-wide grid-section" aria-labelledby="work-title">
          <h2 id="work-title" className="h2 grid-title">
            {c.workTitle}
          </h2>
          <div className="info-grid">
            {c.work.map((w, i) => (
              <div key={i} className="info-card">
                <h3>{w.title}</h3>
                <p>{w.text}</p>
                {w.href &&
                  (w.href.startsWith("/") ? (
                    <Link href={w.href}>{w.cta} →</Link>
                  ) : (
                    <a href={w.href} target="_blank" rel="noopener noreferrer">
                      {w.cta} →
                    </a>
                  ))}
              </div>
            ))}
          </div>
        </section>
      )}
      <OrderCta title={c.ctaTitle} secondary={{ label: getUI().common.reviewsLink, href: "/reviews" }} />
    </PageShell>
  );
}
