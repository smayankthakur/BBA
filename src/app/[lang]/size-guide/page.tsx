import { getLang, getUI, pageLang } from "@/lib/server/lang";
import { alternatesFor } from "@/lib/i18n/config";
import { tf } from "@/lib/i18n/ui";
import type { Metadata } from "next";
import PageShell from "@/components/PageShell";
import PageHero from "@/components/PageHero";
import OrderCta from "@/components/OrderCta";
import MeasureIllustration from "@/components/MeasureIllustration";
import { getContent, getSite } from "@/lib/server/content";
import { fill, Markdown } from "@/lib/content/render";

type Params = { params: Promise<{ lang: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  await pageLang(params);
  const c = await getContent("sizeGuide");
  return { title: c.seoTitle || c.title, description: c.seoDescription, alternates: alternatesFor(getLang(), "/size-guide") };
}

export default async function SizeGuidePage({ params }: Params) {
  await pageLang(params);
  const [c, { vars }] = await Promise.all([getContent("sizeGuide"), getSite()]);
  return (
    <PageShell>
      <PageHero crumbs={[{ label: getUI().sizePage.crumb }]} eyebrow={c.eyebrow} title={c.title} lede={<p>{c.lede}</p>} />

      <section className="section-narrow size-measure" aria-labelledby="measure-h">
        <h2 id="measure-h" className="h3">
          {c.measureTitle}
        </h2>
        <MeasureIllustration text={getUI().measure} />
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
                <th scope="col">{getUI().sizePage.fit}</th>
                <th scope="col">{getUI().sizePage.women}</th>
                <th scope="col">{getUI().sizePage.men}</th>
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
