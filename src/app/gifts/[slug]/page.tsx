import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import PageShell from "@/components/PageShell";
import PageHero from "@/components/PageHero";
import OrderCta from "@/components/OrderCta";
import { GIFTS, LINKS, PRICE } from "@/data/home";
import { GIFT_DETAILS } from "@/data/pages";

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
          <div role="img" aria-label={g.alt} className="arch gift-hero-arch" style={{ backgroundImage: g.gradient }}>
            <span
              className="gift-ring"
              style={{
                backgroundImage: `repeating-conic-gradient(${g.beads[0]} 0 15deg,${g.beads[1]} 15deg 30deg,${g.beads[2]} 30deg 45deg)`,
              }}
            />
          </div>
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
          <div className="btn-row">
            <a className="btn btn-lapis" href={LINKS.whatsapp} target="_blank" rel="noopener noreferrer">
              Order this gift on WhatsApp
            </a>
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

      <OrderCta secondary={{ label: "All gifts", href: "/gifts" }} />
    </PageShell>
  );
}
