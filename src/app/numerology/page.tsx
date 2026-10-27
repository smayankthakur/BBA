import type { Metadata } from "next";
import Link from "next/link";
import PageShell from "@/components/PageShell";
import PageHero from "@/components/PageHero";
import OrderCta from "@/components/OrderCta";
import { getContent } from "@/lib/server/content";

export async function generateMetadata(): Promise<Metadata> {
  const c = await getContent("numerology");
  return { title: c.seoTitle || c.title, description: c.seoDescription, alternates: { canonical: "/numerology" } };
}

export default async function NumerologyHub() {
  const c = await getContent("numerology");
  return (
    <PageShell>
      <PageHero crumbs={[{ label: "Numerology" }]} eyebrow={c.eyebrow} title={c.title} lede={<p>{c.lede}</p>} />
      <section className="section-wide grid-section" aria-label="Guides">
        <div className="info-grid">
          {c.guides.map((g, i) => (
            <div key={i} className="info-card">
              <h2 className="h3">{g.title}</h2>
              <p>{g.text}</p>
              {g.href && (g.href.startsWith("/") ? <Link href={g.href}>Read →</Link> : <a href={g.href}>Read →</a>)}
            </div>
          ))}
        </div>
      </section>
      <OrderCta />
    </PageShell>
  );
}
