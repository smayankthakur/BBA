import type { Metadata } from "next";
import PageShell from "@/components/PageShell";
import PageHero from "@/components/PageHero";
import OrderCta from "@/components/OrderCta";
import { getContent, getSite } from "@/lib/server/content";

export async function generateMetadata(): Promise<Metadata> {
  const c = await getContent("consultation");
  return { title: c.seoTitle || c.title, description: c.seoDescription, alternates: { canonical: "/consultation" } };
}

export default async function ConsultationPage() {
  const [c, { s }] = await Promise.all([getContent("consultation"), getSite()]);
  return (
    <PageShell>
      <PageHero crumbs={[{ label: "Consultation" }]} eyebrow={c.eyebrow} title={c.title} lede={<p>{c.lede}</p>}>
        {s.whatsapp && (
          <a className="btn btn-lapis" href={s.whatsapp} target="_blank" rel="noopener noreferrer">
            {c.button}
          </a>
        )}
      </PageHero>
      <section className="section-narrow split-lists">
        <div>
          <h2 className="h3">{c.coversTitle}</h2>
          <ul className="tick-list">
            {c.covers.map((x, i) => (
              <li key={i}>{x}</li>
            ))}
          </ul>
        </div>
        <div>
          <h2 className="h3">{c.stepsTitle}</h2>
          <ol className="num-list">
            {c.steps.map((x, i) => (
              <li key={i}>{x}</li>
            ))}
          </ol>
        </div>
      </section>
      {c.callout && (
        <section className="section-narrow prose-section">
          <p className="callout">{c.callout}</p>
        </section>
      )}
      <OrderCta
        title={c.ctaTitle}
        text={c.ctaText}
        primary={s.whatsapp ? { label: c.button, href: s.whatsapp, external: true } : undefined}
        secondary={{ label: "Or order a bracelet", href: "/find-your-bracelet" }}
      />
    </PageShell>
  );
}
