import type { Metadata } from "next";
import Image from "next/image";
import Link from "@/components/LocaleLink";
import PageShell from "@/components/PageShell";
import PageHero from "@/components/PageHero";
import OrderCta from "@/components/OrderCta";
import { getLang, getUI, pageLang } from "@/lib/server/lang";
import { alternatesFor } from "@/lib/i18n/config";
import { listArticles } from "@/lib/server/articles";
import { getBracelets } from "@/lib/server/catalog";

type Params = { params: Promise<{ lang: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  await pageLang(params);
  const a = getUI().articles;
  return { title: a.title, description: a.seoDescription, alternates: alternatesFor(getLang(), "/articles") };
}

export default async function ArticlesPage({ params }: Params) {
  await pageLang(params);
  const a = getUI().articles;
  const [list, bracelets] = await Promise.all([listArticles(), getBracelets()]);
  const photo = (purpose: string | null) => bracelets.find((b) => b.slug === purpose)?.photos[0] ?? null;
  return (
    <PageShell>
      <PageHero crumbs={[{ label: a.crumb }]} eyebrow={a.eyebrow} title={a.title} lede={<p>{a.lede}</p>} />
      <section className="section-wide art-list" aria-label={a.title}>
        {list.map((x) => {
          const img = x.cover || photo(x.purpose);
          return (
            <article key={x.slug} className="art-card">
              <Link href={`/articles/${x.slug}`} className="art-card-link">
                <span className="art-card-img">{img && <Image src={img} alt="" fill sizes="(max-width: 760px) 92vw, 380px" />}</span>
                <h2 className="art-card-title">{x.title}</h2>
                <p className="art-card-ex">{x.excerpt}</p>
                <span className="art-card-go" aria-hidden="true">
                  {a.read} →
                </span>
              </Link>
            </article>
          );
        })}
      </section>
      <OrderCta />
    </PageShell>
  );
}
