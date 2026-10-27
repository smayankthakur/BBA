import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import PageShell from "@/components/PageShell";
import PageHero from "@/components/PageHero";
import OrderCta from "@/components/OrderCta";
import GiftVisual from "@/components/GiftVisual";
import SiteTrustBar from "@/components/SiteTrustBar";
import { getGifts, getProduct } from "@/lib/server/catalog";
import { formatINR, getContent, getSite } from "@/lib/server/content";

type Params = { params: Promise<{ slug: string }> };

export const dynamicParams = true;

export async function generateStaticParams() {
  return (await getGifts()).map((g) => ({ slug: g.slug }));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const g = await getProduct("gift", (await params).slug);
  if (!g) return {};
  return {
    title: g.seoTitle || `${g.title}: crystal bracelet gift`,
    description: g.seoDescription || `${g.blurb} ${formatINR(g.priceInr)} per bracelet, read for the wearer's date of birth.`,
    alternates: { canonical: `/gifts/${g.slug}` },
  };
}

export default async function GiftPage({ params }: Params) {
  const slug = (await params).slug;
  const [g, all, c, { s }] = await Promise.all([getProduct("gift", slug), getGifts(), getContent("gifts"), getSite()]);
  if (!g) notFound();
  const others = all.filter((o) => o.slug !== g.slug);

  return (
    <PageShell>
      <div className="product">
        <div className="product-visual">
          <GiftVisual gift={g} refNote={s.refNote} className="arch gift-hero-arch" sizes="(max-width: 760px) 80vw, 380px" priority />
        </div>
        <div className="product-info">
          <PageHero
            crumbs={[{ label: "Gifts", href: "/gifts" }, { label: g.title }]}
            eyebrow={c.detailEyebrow}
            title={g.title}
            lede={(g.intro.length ? g.intro : [g.blurb]).map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          />
          <p className="product-price">
            {formatINR(g.priceInr)} <span>{c.priceNote}</span>
          </p>
          <SiteTrustBar />
          <div className="btn-row">
            <Link className="btn btn-lapis" href="/find-your-bracelet?for=gift">
              {c.orderButton}
            </Link>
          </div>
        </div>
      </div>

      {(g.listA.length > 0 || g.listB.length > 0) && (
        <section className="section-narrow split-lists">
          {g.listA.length > 0 && (
            <div>
              <h2 className="h3">{c.sendTitle}</h2>
              <ul className="tick-list">
                {g.listA.map((x, i) => (
                  <li key={i}>{x}</li>
                ))}
              </ul>
            </div>
          )}
          {g.listB.length > 0 && (
            <div>
              <h2 className="h3">{c.ideasTitle}</h2>
              <ul className="tick-list">
                {g.listB.map((x, i) => (
                  <li key={i}>{x}</li>
                ))}
              </ul>
            </div>
          )}
        </section>
      )}

      {others.length > 0 && (
        <nav className="section-narrow pager" aria-label={c.othersLabel}>
          {others.map((o) => (
            <Link key={o.slug} href={`/gifts/${o.slug}`}>
              {o.title} →
            </Link>
          ))}
        </nav>
      )}

      <OrderCta
        title={c.ctaTitle}
        text={c.ctaText}
        primary={{ label: c.orderButton, href: "/find-your-bracelet?for=gift" }}
        secondary={{ label: "All gifts", href: "/gifts" }}
      />
    </PageShell>
  );
}
