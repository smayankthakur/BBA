import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import PageShell from "@/components/PageShell";
import PageHero from "@/components/PageHero";
import ProductVisual from "@/components/ProductVisual";
import BraceletCard from "@/components/BraceletCard";
import HowItWorks from "@/components/HowItWorks";
import OrderCta from "@/components/OrderCta";
import JsonLd from "@/components/JsonLd";
import { BRACELETS, braceletBySlug } from "@/data/pages";
import { PRICE } from "@/data/home";
import { SITE_URL } from "@/lib/site";

type Params = { params: Promise<{ slug: string }> };

export const dynamicParams = false;

export function generateStaticParams() {
  return BRACELETS.map((b) => ({ slug: b.slug }));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const b = braceletBySlug((await params).slug);
  if (!b) return {};
  return {
    title: `${b.title} bracelet`,
    description: `${b.blurb} ${PRICE}, crystals chosen for your date of birth by numerologist Ammit Kukreja.`,
    alternates: { canonical: `/bracelets/${b.slug}` },
  };
}

export default async function BraceletPage({ params }: Params) {
  const b = braceletBySlug((await params).slug);
  if (!b) notFound();
  const others = BRACELETS.filter((o) => o.slug !== b.slug);
  const amount = PRICE.replace(/[^\d]/g, "");

  return (
    <PageShell>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Product",
          name: `${b.title} crystal bracelet`,
          description: b.blurb,
          brand: { "@type": "Brand", name: "Bracelet By Ammit" },
          url: `${SITE_URL}/bracelets/${b.slug}`,
          offers: { "@type": "Offer", price: amount, priceCurrency: "INR", url: `${SITE_URL}/bracelets/${b.slug}` },
        }}
      />
      <div className="product">
        <div className="product-visual">
          <ProductVisual cards={b.cards} rings={b.rings} label={`Illustration of the ${b.title} bracelet`} />
        </div>
        <div className="product-info">
          <PageHero
            crumbs={[{ label: "Bracelets", href: "/bracelets" }, { label: b.title }]}
            eyebrow={b.slug === "3-in-1" ? "Three intentions" : "Intention bracelet"}
            title={b.title}
            lede={<p>{b.blurb}</p>}
          />
          <p className="product-price">
            {PRICE} <span>read for your date of birth · strung by hand</span>
          </p>
          <div className="btn-row">
            <Link className="btn btn-lapis" href={`/find-your-bracelet?intention=${b.slug}`}>
              Order this bracelet
            </Link>
            <Link className="btn btn-line" href="/consultation">
              Ask Ammit first
            </Link>
          </div>
          <p className="product-hint">A 60-second reading works out your numbers, then opens the order form with your answers filled in.</p>
        </div>
      </div>

      <section className="section-narrow prose-section" aria-labelledby="about-title">
        <h2 id="about-title" className="h2">
          About this bracelet
        </h2>
        {b.intro.map((p) => (
          <p key={p.slice(0, 24)}>{p}</p>
        ))}
        {b.note && <p className="callout">{b.note}</p>}
      </section>

      <section className="section-narrow split-lists">
        <div>
          <h2 className="h3">This bracelet is for you if…</h2>
          <ul className="tick-list">
            {b.forWhom.map((f) => (
              <li key={f}>{f}</li>
            ))}
          </ul>
        </div>
        <div>
          <h2 className="h3">Crystals often used</h2>
          <ul className="chip-list">
            {b.crystals.map((c) => (
              <li key={c}>{c}</li>
            ))}
          </ul>
          <p className="small-note">
            These stones are traditionally linked with this intention. Ammit chooses your final stones after reading your
            numbers, so yours may differ.
          </p>
        </div>
      </section>

      <HowItWorks />

      <section className="section-wide grid-section" aria-labelledby="others-title">
        <h2 id="others-title" className="h2 grid-title">
          Other intentions
        </h2>
        <div className="b-grid">
          {others.map((o) => (
            <BraceletCard key={o.slug} b={o} />
          ))}
        </div>
      </section>

      <OrderCta
        primary={{ label: "Order this bracelet", href: `/find-your-bracelet?intention=${b.slug}` }}
        secondary={{ label: "Read customer reviews", href: "/reviews" }}
      />
    </PageShell>
  );
}
