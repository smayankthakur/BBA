import type { Metadata } from "next";
import Link from "next/link";
import PageShell from "@/components/PageShell";
import PageHero from "@/components/PageHero";
import HowItWorks from "@/components/HowItWorks";
import OrderCta from "@/components/OrderCta";
import { GIFTS, PRICE } from "@/data/home";
import GiftVisual from "@/components/GiftVisual";

export const metadata: Metadata = {
  title: "Gifts that mean something",
  description: `Crystal bracelet gifts for Rakhi, your mother or an anniversary, each read for the wearer's date of birth. ${PRICE} per bracelet.`,
  alternates: { canonical: "/gifts" },
};

export default function GiftsIndex() {
  return (
    <PageShell>
      <PageHero
        crumbs={[{ label: "Gifts" }]}
        eyebrow="Gifting"
        title="Gifts that mean something"
        align="center"
        lede={<p>Send their birth date and we&apos;ll make it for them, not just for the occasion. {PRICE} per bracelet.</p>}
      />
      <section className="section-wide gifts gifts-page" aria-label="Gift ideas">
        <div className="gifts-grid">
          {GIFTS.map((g) => (
            <Link key={g.slug} href={`/gifts/${g.slug}`} className="gift">
              <GiftVisual gift={g} className="arch" />
              <span className="gift-title">{g.title}</span>
              <span className="gift-blurb">{g.blurb}</span>
            </Link>
          ))}
        </div>
      </section>
      <HowItWorks title="How a gift is made" />
      <OrderCta
        title="Have their date of birth ready?"
        text="Answer a few questions about the wearer and we'll suggest the bracelet that suits their numbers."
        primary={{ label: "Order a gift", href: "/find-your-bracelet?for=gift" }}
      />
    </PageShell>
  );
}
