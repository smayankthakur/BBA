import type { Metadata } from "next";
import PageShell from "@/components/PageShell";
import PageHero from "@/components/PageHero";
import OrderCta from "@/components/OrderCta";
import LoShuCalculator from "@/components/LoShuCalculator";
import VideoEmbed from "@/components/VideoEmbed";
import { LO_SHU_LINES } from "@/lib/loshu";
import { COMBO_VIDEOS } from "@/data/videos";
import { getContent, getSite } from "@/lib/server/content";
import { fill, Markdown } from "@/lib/content/render";

export async function generateMetadata(): Promise<Metadata> {
  const c = await getContent("numerology");
  return {
    title: `${c.loshuTitle}: find your missing numbers`,
    description: c.loshuLede,
    alternates: { canonical: "/numerology/lo-shu-grid" },
  };
}

export default async function LoShuPage() {
  const [c, { vars }] = await Promise.all([getContent("numerology"), getSite()]);
  return (
    <PageShell>
      <PageHero
        crumbs={[{ label: "Numerology", href: "/numerology" }, { label: "Lo Shu grid" }]}
        eyebrow={c.loshuEyebrow}
        title={c.loshuTitle}
        lede={<p>{c.loshuLede}</p>}
      />
      <section className="section-narrow" aria-label="Calculator">
        <LoShuCalculator />
      </section>

      <section className="section-narrow legal" aria-label="How the grid works">
        <Markdown text={fill(c.loshuBody, vars)} />
      </section>

      <section className="section-wide grid-section" aria-labelledby="lines-h">
        <h2 id="lines-h" className="h2 grid-title">
          {c.loshuLinesTitle}
        </h2>
        <div className="combo-grid">
          {LO_SHU_LINES.map((l) => (
            <div key={l.combo} className="combo-card">
              <p className="combo-num">{l.combo}</p>
              <p className="combo-where">{l.where}</p>
              {COMBO_VIDEOS[l.combo] && <VideoEmbed video={COMBO_VIDEOS[l.combo]} />}
            </div>
          ))}
        </div>
        <div className="small-note center">
          <Markdown text={fill(c.loshuNote, vars)} />
        </div>
      </section>
      <OrderCta />
    </PageShell>
  );
}
