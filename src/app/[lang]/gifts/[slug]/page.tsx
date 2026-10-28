import { getLang, getUI, pageLang } from "@/lib/server/lang";
import { alternatesFor } from "@/lib/i18n/config";
import { tf } from "@/lib/i18n/ui";
import type { Metadata } from "next";
import Link from "@/components/LocaleLink";
import { notFound } from "next/navigation";
import PageShell from "@/components/PageShell";
import PageHero from "@/components/PageHero";
import OrderCta from "@/components/OrderCta";
import GiftVisual from "@/components/GiftVisual";
import SiteTrustBar from "@/components/SiteTrustBar";
import { getGifts, getProduct } from "@/lib/server/catalog";
import { formatINR, getContent, getSite } from "@/lib/server/content";

type Params = { params: Promise<{ lang: string; slug: string }> };

export const dynamicParams = true;

export async function generateStaticParams() {
  return (await getGifts()).map((g) => ({ slug: g.slug }));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  await pageLang(params);
  const g = await getProduct("gift", (await params).slug);
  if (!g) return {};
  const ui = getUI();
  return {
    title: g.seoTitle || tf(ui.gift.metaTitle, { title: g.title }),
    description: g.seoDescription || tf(ui.gift.metaDescription, { blurb: g.blurb, price: formatINR(g.priceInr) }),
    alternates: alternatesFor(getLang(), `/gifts/${g.slug}`),
  };
}

export default async function GiftPage({ params }: Params) {
  await pageLang(params);
  const slug = (await params).slug;
  const [g, all, c, { s }] = await Promise.all([getProduct("gift", slug), getGifts(), getContent("gifts"), getSite()]);
  if (!g) notFound();
  const others = all.filter((o) => o.slug !== g.slug);
  const ui = getUI();

  return (
    <PageShell>
      <div className="product">
        <div className="product-visual">
          <GiftVisual gift={g} refNote={s.refNote} label={tf(ui.common.illustrationOf, { title: g.title })} className="arch gift-hero-arch" sizes="(max-width: 760px) 80vw, 380px" priority />
        </div>
        <div className="product-info">
          <PageHero
            crumbs={[{ label: ui.gift.crumb, href: "/gifts" }, { label: g.title }]}
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
        secondary={{ label: ui.common.allGifts, href: "/gifts" }}
      />
    </PageShell>
  );
}
