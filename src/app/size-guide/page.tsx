import type { Metadata } from "next";
import PageShell from "@/components/PageShell";
import PageHero from "@/components/PageHero";
import OrderCta from "@/components/OrderCta";
import MeasureIllustration from "@/components/MeasureIllustration";
import { getContent, getSite } from "@/lib/server/content";
import { fill, Markdown } from "@/lib/content/render";

export async function generateMetadata(): Promise<Metadata> {
  const c = await getContent("sizeGuide");
  return { title: c.seoTitle || c.title, description: c.seoDescription, alternates: { canonical: "/size-guide" } };
}

export default async function SizeGuidePage() {
  const [c, { vars }] = await Promise.all([getContent("sizeGuide"), getSite()]);
  return (
    <PageShell>
      <PageHero crumbs={[{ label: "Size guide" }]} eyebrow={c.eyebrow} title={c.title} lede={<p>{c.lede}</p>} />

      <section className="section-narrow size-measure" aria-labelledby="measure-h">
        <h2 id="measure-h" className="h3">
          {c.measureTitle}
        </h2>
        <MeasureIllustration />
        <ol className="num-list">
          {c.measureSteps.map((x, i) => (
            <li key={i}>{x}</li>
          ))}
        </ol>
      </section>

      <section className="section-narrow" aria-labelledby="sizes-h">
        <h2 id="sizes-h" className="h3 size-h">
          {c.sizesTitle}
        </h2>
        <div className="size-table-wrap">
          <table className="size-table">
            <thead>
              <tr>
                <th scope="col">Fit</th>
                <th scope="col">Women</th>
                <th scope="col">Men</th>
              </tr>
            </thead>
            <tbody>
              {c.sizes.map((s, i) => (
                <tr key={i}>
                  <th scope="row">{s.label}</th>
                  <td>{s.women}</td>
                  <td>{s.men}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="small-note">
          <Markdown text={fill(c.note, vars)} />
        </div>
      </section>

      <OrderCta title={c.ctaTitle} />
    </PageShell>
  );
}
