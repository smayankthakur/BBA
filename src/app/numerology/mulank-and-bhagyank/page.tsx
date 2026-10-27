import type { Metadata } from "next";
import Link from "next/link";
import PageShell from "@/components/PageShell";
import PageHero from "@/components/PageHero";
import OrderCta from "@/components/OrderCta";
import { getContent, getSite } from "@/lib/server/content";
import { fill, Markdown } from "@/lib/content/render";

export async function generateMetadata(): Promise<Metadata> {
  const c = await getContent("numerology");
  return {
    title: `${c.guideTitle}: how to calculate them`,
    description: c.guideLede,
    alternates: { canonical: "/numerology/mulank-and-bhagyank" },
  };
}

export default async function MulankBhagyankGuide() {
  const [c, m, { vars }] = await Promise.all([getContent("numerology"), getContent("mulank"), getSite()]);
  const planets = (
    <ul className="planet-list">
      {m.numbers.map((n) => (
        <li key={n.number}>
          <Link href={`/mulank/${n.number}`}>
            {n.number}: {n.planet}
            {n.planetHindi !== n.planet ? ` (${n.planetHindi})` : ""}
          </Link>
        </li>
      ))}
    </ul>
  );
  return (
    <PageShell>
      <PageHero
        crumbs={[{ label: "Numerology", href: "/numerology" }, { label: c.guideTitle }]}
        eyebrow="Guide"
        title={c.guideTitle}
        lede={<p>{c.guideLede}</p>}
      />
      <article className="section-narrow legal">
        <Markdown text={fill(c.guideBody, vars)} blocks={{ planets }} />
      </article>
      <OrderCta />
    </PageShell>
  );
}
