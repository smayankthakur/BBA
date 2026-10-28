import { getLang, getUI, pageLang } from "@/lib/server/lang";
import { alternatesFor } from "@/lib/i18n/config";
import { tf } from "@/lib/i18n/ui";
import type { Metadata } from "next";
import Link from "@/components/LocaleLink";
import { notFound } from "next/navigation";
import PageShell from "@/components/PageShell";
import PageHero from "@/components/PageHero";
import ProductVisual from "@/components/ProductVisual";
import BraceletCard from "@/components/BraceletCard";
import HowItWorks from "@/components/HowItWorks";
import OrderCta from "@/components/OrderCta";
import JsonLd from "@/components/JsonLd";
import VideoEmbed from "@/components/VideoEmbed";
import SiteTrustBar from "@/components/SiteTrustBar";
import { getBracelets, getProduct } from "@/lib/server/catalog";
import { formatINR, getContent, getSite } from "@/lib/server/content";
import { fill } from "@/lib/content/render";
import { SITE_URL } from "@/lib/site";
import { lp } from "@/lib/i18n/config";

type Params = { params: Promise<{ lang: string; slug: string }> };

// New products added in the admin panel get a page on first visit.
export const dynamicParams = true;

export async function generateStaticParams() {
  return (await getBracelets()).map((b) => ({ slug: b.slug }));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  await pageLang(params);
  const b = await getProduct("bracelet", (await params).slug);
  if (!b) return {};
  const ui = getUI();
  return {
    title: b.seoTitle || tf(ui.product.metaTitle, { title: b.title }),
    description: b.seoDescription || tf(ui.product.metaDescription, { blurb: b.blurb, price: formatINR(b.priceInr) }),
    alternates: alternatesFor(getLang(), `/bracelets/${b.slug}`),
  };
}

export default async function BraceletPage({ params }: Params) {
  await pageLang(params);
  const slug = (await params).slug;
  const [b, all, c, { s }] = await Promise.all([getProduct("bracelet", slug), getBracelets(), getContent("product"), getSite()]);
  if (!b) notFound();
  const others = all.filter((o) => o.slug !== b.slug);
  const faqs = c.faqs.filter((f) => f.q.trim()).map((f) => ({ q: fill(f.q, { title: b.title }), a: fill(f.a, { title: b.title }) }));
  const photos = b.photos;
  const abs = (p: string) => (p.startsWith("http") ? p : `${SITE_URL}${p}`);
  const ui = getUI();
  const pageUrl = `${SITE_URL}${lp(getLang(), `/bracelets/${b.slug}`)}`;

  return (
    <PageShell>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Product",
          name: tf(ui.product.schemaName, { title: b.title }),
          description: b.blurb,
          brand: { "@type": "Brand", name: s.brand },
          url: pageUrl,
          ...(photos.length ? { image: photos.map(abs) } : {}),
          offers: {
            "@type": "Offer",
            price: String(b.priceInr),
            priceCurrency: "INR",
            url: pageUrl,
            shippingDetails: {
              "@type": "OfferShippingDetails",
              shippingRate: { "@type": "MonetaryAmount", value: 0, currency: "INR" },
              shippingDestination: { "@type": "DefinedRegion", addressCountry: "IN" },
              deliveryTime: {
                "@type": "ShippingDeliveryTime",
                handlingTime: { "@type": "QuantitativeValue", minValue: 2, maxValue: 3, unitCode: "DAY" },
                transitTime: {
                  "@type": "QuantitativeValue",
                  minValue: Math.max(1, s.shippingMinDays - 2),
                  maxValue: Math.max(1, s.shippingMaxDays - 3),
                  unitCode: "DAY",
                },
              },
            },
          },
        }}
      />
      <div className="product">
        <div className="product-visual">
          <ProductVisual cards={b.visual.cards} rings={b.visual.rings} label={tf(ui.common.illustrationOf, { title: b.title })} photosLabel={tf(ui.common.photosOf, { title: b.title })} photos={photos} refNote={s.refNote} />
        </div>
        <div className="product-info">
          <PageHero
            crumbs={[{ label: ui.header.nav.purposes, href: "/#edit" }, { label: b.title }]}
            eyebrow={c.eyebrow}
            title={b.title}
            lede={<p>{b.blurb}</p>}
          />
          <p className="product-price">
            {formatINR(b.priceInr)} <span>{c.priceNote}</span>
          </p>
          <SiteTrustBar />
          <div className="btn-row">
            <Link className="btn btn-lapis" href={`/find-your-bracelet?intention=${b.slug}`}>
              {c.orderButton}
            </Link>
            <Link className="btn btn-line" href="/consultation">
              {c.askButton}
            </Link>
          </div>
          <p className="product-hint">
            {c.hint} <Link href="/size-guide">{ui.common.sizeGuide}</Link>
          </p>
        </div>
      </div>

      {(b.intro.length > 0 || b.note) && (
        <section className="section-narrow prose-section" aria-labelledby="about-title">
          <h2 id="about-title" className="h2">
            {c.aboutTitle}
          </h2>
          {b.intro.map((p, i) => (
            <p key={i}>{p}</p>
          ))}
          {b.note && <p className="callout">{b.note}</p>}
        </section>
      )}

      {b.videoId && (
        <section className="section-narrow video-section" aria-labelledby="video-title">
          <h2 id="video-title" className="h3">
            {c.videoTitle}
          </h2>
          <VideoEmbed video={{ id: b.videoId, title: b.videoTitle || b.title }} />
        </section>
      )}

      {(b.listA.length > 0 || b.crystals.length > 0) && (
        <section className="section-narrow split-lists">
          {b.listA.length > 0 && (
            <div>
              <h2 className="h3">{c.forWhomTitle}</h2>
              <ul className="tick-list">
                {b.listA.map((f, i) => (
                  <li key={i}>{f}</li>
                ))}
              </ul>
            </div>
          )}
          {b.crystals.length > 0 && (
            <div>
              <h2 className="h3">{c.crystalsTitle}</h2>
              <ul className="chip-list">
                {b.crystals.map((x, i) => (
                  <li key={i}>{x}</li>
                ))}
              </ul>
              <p className="small-note">{c.crystalsNote}</p>
            </div>
          )}
        </section>
      )}

      <HowItWorks />

      {faqs.length > 0 && (
        <section className="section-narrow faq" aria-labelledby="faq-title">
          <JsonLd
            data={{
              "@context": "https://schema.org",
              "@type": "FAQPage",
              mainEntity: faqs.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
            }}
          />
          <h2 id="faq-title" className="h2">
            {c.faqTitle}
          </h2>
          {faqs.map((f, i) => (
            <details key={i}>
              <summary>{f.q}</summary>
              <p>{f.a}</p>
            </details>
          ))}
        </section>
      )}

      {others.length > 0 && (
        <section className="section-wide grid-section" aria-labelledby="others-title">
          <h2 id="others-title" className="h2 grid-title">
            {c.othersTitle}
          </h2>
          <div className="b-grid">
            {others.map((o) => (
              <BraceletCard key={o.slug} b={o} viewLabel={ui.common.viewBracelet} />
            ))}
          </div>
        </section>
      )}

      <OrderCta
        primary={{ label: c.orderButton, href: `/find-your-bracelet?intention=${b.slug}` }}
        secondary={{ label: ui.common.reviewsLink, href: "/reviews" }}
      />
    </PageShell>
  );
}
