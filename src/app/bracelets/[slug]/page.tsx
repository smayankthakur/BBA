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
import VideoEmbed from "@/components/VideoEmbed";
import { BRACELET_VIDEOS } from "@/data/videos";
import TrustBar from "@/components/TrustBar";
import { productPhotos } from "@/lib/server/photos";
import { BRACELETS, braceletBySlug } from "@/data/pages";
import { PRICE, SHIPPING } from "@/data/home";
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
  const faqs = [
    {
      q: `How is the ${b.title} bracelet made for me?`,
      a: "Ammit reads the wearer's name and date of birth (mulank and bhagyank), chooses the crystals that suit those numbers for this intention, and the bracelet is strung by hand.",
    },
    {
      q: "Which size should I choose?",
      a: "Measure around the wrist bone with a thread and a ruler. Women's sizes are 14, 15 and 16 cm; men's are 16, 17 and 18 cm. If you're between sizes, choose the larger one. The size guide shows how to measure.",
    },
    {
      q: "What if my bracelet breaks?",
      a: "Collect every bead and message us on WhatsApp with a photo. We'll tell you how to send them back so Ammit can restring the same crystals.",
    },
    {
      q: "How do I look after it?",
      a: "Cleanse it once a week with dry rock salt or incense smoke, recharge it under the full moon, and keep it away from water, perfume and soap.",
    },
    {
      q: "Can a crystal bracelet replace medical or professional advice?",
      a: "No. Crystal and numerology guidance is traditional belief. Please keep following your doctor's or adviser's guidance.",
    },
  ];
  const amount = PRICE.replace(/[^\d]/g, "");
  const photos = productPhotos(b.slug);

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
          ...(photos.length ? { image: photos.map((p) => `${SITE_URL}${p}`) } : {}),
          offers: {
            "@type": "Offer",
            price: amount,
            priceCurrency: "INR",
            url: `${SITE_URL}/bracelets/${b.slug}`,
            shippingDetails: {
              "@type": "OfferShippingDetails",
              shippingRate: { "@type": "MonetaryAmount", value: 0, currency: "INR" },
              shippingDestination: { "@type": "DefinedRegion", addressCountry: "IN" },
              deliveryTime: {
                "@type": "ShippingDeliveryTime",
                handlingTime: { "@type": "QuantitativeValue", minValue: 2, maxValue: 3, unitCode: "DAY" },
                transitTime: { "@type": "QuantitativeValue", minValue: SHIPPING.minDays - 2, maxValue: SHIPPING.maxDays - 3, unitCode: "DAY" },
              },
            },
          },
        }}
      />
      <div className="product">
        <div className="product-visual">
          <ProductVisual cards={b.cards} rings={b.rings} label={`Illustration of the ${b.title} bracelet`} photos={photos} />
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
          <TrustBar />
          <div className="btn-row">
            <Link className="btn btn-lapis" href={`/find-your-bracelet?intention=${b.slug}`}>
              Order this bracelet
            </Link>
            <Link className="btn btn-line" href="/consultation">
              Ask Ammit first
            </Link>
          </div>
          <p className="product-hint">
            A 60-second reading works out your numbers, then takes you to secure checkout.{" "}
            <Link href="/size-guide">Size guide</Link>
          </p>
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

      {BRACELET_VIDEOS[b.slug] && (
        <section className="section-narrow video-section" aria-labelledby="video-title">
          <h2 id="video-title" className="h3">
            Ammit explains this bracelet
          </h2>
          <VideoEmbed video={BRACELET_VIDEOS[b.slug]} />
        </section>
      )}

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

      <section className="section-narrow faq" aria-labelledby="faq-title">
        <JsonLd
          data={{
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: faqs.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
          }}
        />
        <h2 id="faq-title" className="h2">
          Questions
        </h2>
        {faqs.map((f) => (
          <details key={f.q}>
            <summary>{f.q}</summary>
            <p>{f.a}</p>
          </details>
        ))}
      </section>

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
