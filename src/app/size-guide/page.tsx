import type { Metadata } from "next";
import Link from "next/link";
import PageShell from "@/components/PageShell";
import PageHero from "@/components/PageHero";
import OrderCta from "@/components/OrderCta";
import MeasureIllustration from "@/components/MeasureIllustration";
import { LINKS } from "@/data/home";

export const metadata: Metadata = {
  title: "Bracelet size guide",
  description: "How to measure your wrist for a Bracelet By Ammit crystal bracelet, with the sizes we make for women and men.",
  alternates: { canonical: "/size-guide" },
};

const SIZES = [
  { label: "Slim", women: "14 cm", men: "16 cm" },
  { label: "Medium", women: "15 cm", men: "17 cm" },
  { label: "Healthy", women: "16 cm", men: "18 cm" },
];

export default function SizeGuidePage() {
  return (
    <PageShell>
      <PageHero
        crumbs={[{ label: "Size guide" }]}
        eyebrow="Fit"
        title="Find your bracelet size"
        lede={<p>A crystal bracelet should sit comfortably on the wrist bone: snug enough not to slide over your hand, loose enough to turn.</p>}
      />

      <section className="section-narrow size-measure" aria-labelledby="measure-h">
        <h2 id="measure-h" className="h3">
          How to measure
        </h2>
        <MeasureIllustration />
        <ol className="num-list">
          <li>Wrap a thread or a strip of paper around your wrist, just above the wrist bone.</li>
          <li>Mark where the end meets the thread. Don&apos;t pull it tight.</li>
          <li>Lay it flat on a ruler and read the length in centimetres.</li>
          <li>Pick the size closest to your measurement. If you&apos;re between two sizes, choose the larger one.</li>
        </ol>
      </section>

      <section className="section-narrow" aria-labelledby="sizes-h">
        <h2 id="sizes-h" className="h3 size-h">
          Our sizes
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
              {SIZES.map((s) => (
                <tr key={s.label}>
                  <th scope="row">{s.label}</th>
                  <td>{s.women}</td>
                  <td>{s.men}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="small-note">
          Not sure? Choose &ldquo;Not sure&rdquo; in the reading, or send us your measurement on{" "}
          WhatsApp (link in the footer){" "}
          and we&apos;ll advise. If it doesn&apos;t fit, see our <Link href="/returns">returns policy</Link>.
        </p>
      </section>

      <OrderCta title="Got your size?" />
    </PageShell>
  );
}
