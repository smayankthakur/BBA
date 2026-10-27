import type { Metadata } from "next";
import Link from "next/link";
import PageShell from "@/components/PageShell";
import PageHero from "@/components/PageHero";
import OrderCta from "@/components/OrderCta";
import { birthDaysFor } from "@/data/pages";
import { getContent } from "@/lib/server/content";

export async function generateMetadata(): Promise<Metadata> {
  const c = await getContent("mulank");
  return { title: c.seoTitle || c.title, description: c.seoDescription, alternates: { canonical: "/mulank" } };
}

export default async function MulankIndex() {
  const c = await getContent("mulank");
  return (
    <PageShell>
      <PageHero crumbs={[{ label: "Mulank" }]} eyebrow={c.eyebrow} title={c.title} lede={<p>{c.lede}</p>} />
      <section className="section-wide grid-section" aria-label="Mulank 1 to 9">
        <ul className="m-grid">
          {c.numbers.map((m) => (
            <li key={m.number}>
              <Link href={`/mulank/${m.number}`} className="m-card">
                <span className="m-num">{m.number}</span>
                <span className="m-planet">
                  {m.planet} · {m.planetHindi}
                </span>
                <span className="m-days">
                  {c.bornOn} {birthDaysFor(m.number).join(", ")}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>
      <section className="section-narrow prose-section">
        <h2 className="h2">{c.startTitle}</h2>
        <p>{c.startText}</p>
      </section>
      <OrderCta title={c.ctaTitle} text={c.ctaText} secondary={{ label: "Shop by intention", href: "/bracelets" }} />
    </PageShell>
  );
}
