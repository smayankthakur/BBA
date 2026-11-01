import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import Link from "@/components/LocaleLink";
import PageShell from "@/components/PageShell";
import PageHero from "@/components/PageHero";
import JsonLd from "@/components/JsonLd";
import OrderLink from "@/components/order/OrderLink";
import { getLang, getUI, pageLang } from "@/lib/server/lang";
import { alternatesFor, INTL_LOCALE, lp } from "@/lib/i18n/config";
import { tf } from "@/lib/i18n/ui";
import { getArticle, listArticles } from "@/lib/server/articles";
import { getBracelets } from "@/lib/server/catalog";
import { formatINR, getSite } from "@/lib/server/content";
import { Markdown } from "@/lib/content/render";
import { SITE_URL } from "@/lib/site";
import { BUILT_IN_ARTICLES } from "@/data/articles";

type Params = { params: Promise<{ lang: string; slug: string }> };

export function generateStaticParams() {
  return BUILT_IN_ARTICLES.map((a) => ({ slug: a.slug }));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  await pageLang(params);
  const a = await getArticle((await params).slug);
  if (!a) return {};
  return {
    title: a.seoTitle || a.title,
    description: a.seoDescription || a.excerpt,
    alternates: alternatesFor(getLang(), `/articles/${a.slug}`),
    openGraph: { type: "article", title: a.seoTitle || a.title, description: a.seoDescription || a.excerpt },
  };
}

export default async function ArticlePage({ params }: Params) {
  await pageLang(params);
  const slug = (await params).slug;
  const [a, all, bracelets, { s }] = await Promise.all([getArticle(slug), listArticles(), getBracelets(), getSite()]);
  if (!a) notFound();
  const ui = getUI();
  const t = ui.articles;
  const lang = getLang();
  const b = a.purpose ? bracelets.find((x) => x.slug === a.purpose && x.inList) : undefined;
  const cover = a.cover || b?.photos[0] || null;
  const others = all.filter((x) => x.slug !== a.slug).slice(0, 3);
  const date = a.publishedAt ? new Date(a.publishedAt).toLocaleDateString(INTL_LOCALE[lang], { day: "numeric", month: "long", year: "numeric" }) : "";
  const url = `${SITE_URL}${lp(lang, `/articles/${a.slug}`)}`;

  return (
    <PageShell>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Article",
          headline: a.title,
          description: a.excerpt,
          inLanguage: lang === "hi" ? "hi-IN" : lang === "hn" ? "hi-Latn" : "en-IN",
          datePublished: a.publishedAt ?? undefined,
          dateModified: a.updatedAt ?? a.publishedAt ?? undefined,
          ...(cover ? { image: cover.startsWith("http") ? cover : `${SITE_URL}${cover}` } : {}),
          author: { "@type": "Organization", name: s.brand, url: SITE_URL },
          publisher: { "@type": "Organization", name: s.brand, logo: { "@type": "ImageObject", url: `${SITE_URL}/brand/emblem.png` } },
          mainEntityOfPage: url,
        }}
      />
      <PageHero
        crumbs={[{ label: t.crumb, href: "/articles" }, { label: a.title }]}
        eyebrow={date ? tf(t.published, { date }) : t.eyebrow}
        title={a.title}
        lede={<p>{a.excerpt}</p>}
      />
      <div className="section-narrow art">
        {cover && (
          <div className="art-cover">
            <Image src={cover} alt="" fill sizes="(max-width: 760px) 92vw, 760px" priority />
          </div>
        )}
        <div className="legal art-body">
          <Markdown text={a.body} />
        </div>
        {b && (
          <aside className="art-buy" aria-label={t.braceletTitle}>
            {b.photos[0] && (
              <span className="art-buy-img">
                <Image src={b.photos[0]} alt="" fill sizes="120px" />
              </span>
            )}
            <span className="art-buy-t">
              <small>{t.braceletTitle}</small>
              <b>{b.title}</b>
              <span>
                {b.blurb} · {formatINR(b.priceInr)}
              </span>
              <span className="btn-row">
                <OrderLink className="btn btn-lapis" slug={b.slug} href={`/bracelets/${b.slug}?order=${b.slug}`} aria-haspopup="dialog">
                  {t.order}
                </OrderLink>
                <Link className="btn btn-line" href={`/bracelets/${b.slug}`}>
                  {t.view}
                </Link>
              </span>
            </span>
          </aside>
        )}
        <p className="small-note art-disclaimer">{s.disclaimer}</p>
        {others.length > 0 && (
          <nav className="art-more" aria-label={t.more}>
            <h2 className="h3">{t.more}</h2>
            <ul>
              {others.map((o) => (
                <li key={o.slug}>
                  <Link href={`/articles/${o.slug}`}>{o.title}</Link>
                </li>
              ))}
            </ul>
          </nav>
        )}
      </div>
    </PageShell>
  );
}
