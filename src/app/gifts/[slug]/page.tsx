import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import PageShell from "@/components/PageShell";
import PageHero from "@/components/PageHero";
import OrderCta from "@/components/OrderCta";
import { GIFTS, PRICE } from "@/data/home";
import { GIFT_DETAILS } from "@/data/pages";
import TrustBar from "@/components/TrustBar";
import GiftVisual from "@/components/GiftVisual";

type Params = { params: Promise<{ slug: string }> };

export const dynamicParams = false;

export function generateStaticParams() {
  return GIFTS.map((g) => ({ slug: g.slug }));
}

const get = (slug: string) => GIFTS.find((g) => g.slug === slug);

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const g = get((await params).slug);
  if (!g) return {};
  return {
    title: `${g.title}: crystal bracelet gift`,
    description: `${g.blurb} ${PRICE} per bracelet, read for the wearer's date of birth.`,
    alternates: { canonical: `/gifts/${g.slug}` },
  };
}

export default async function GiftPage({ params }: Params) {
  const g = get((await params).slug);
  if (!g) notFound();
  const d = GIFT_DETAILS[g.slug];
  const others = GIFTS.filter((o) => o.slug !== g.slug);

  return (
    <PageShell>
      <div className="product">
        <div className="product-visual">
          <GiftVisual gift={g} className="arch gift-hero-arch" sizes="(max-width: 760px) 80vw, 380px" priority />
        </div>
        <div className="product-info">
          <PageHero
            crumbs={[{ label: "Gifts", href: "/gifts" }, { label: g.title }]}
            eyebrow="Gift"
            title={g.title}
            lede={d.intro.map((p) => (
              <p key={p.slice(0, 20)}>{p}</p>
            ))}
          />
          <p className="product-price">
            {PRICE} <span>per bracelet · read for the wearer</span>
          </p>
          <TrustBar />
          <div className="btn-row">
            <Link className="btn btn-lapis" href="/find-your-bracelet?for=gift">
              Order this gift
            </Link>
          </div>
        </div>
      </div>

      <section className="section-narrow split-lists">
        <div>
          <h2 className="h3">What to send us</h2>
          <ul className="tick-list">
            {d.send.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ul>
        </div>
        <div>
          <h2 className="h3">Gift ideas</h2>
          <ul className="tick-list">
            {d.ideas.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ul>
        </div>
      </section>

      <nav className="section-narrow pager" aria-label="Other gifts">
        {others.map((o) => (
          <Link key={o.slug} href={`/gifts/${o.slug}`}>
            {o.title} →
          </Link>
        ))}
      </nav>

      <OrderCta
        title="Have their date of birth ready?"
        text="Answer a few questions about the wearer and we'll suggest the bracelet that suits their numbers."
        primary={{ label: "Order this gift", href: "/find-your-bracelet?for=gift" }}
        secondary={{ label: "All gifts", href: "/gifts" }}
      />
    </PageShell>
  );
}
