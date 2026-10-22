import type { Metadata } from "next";
import Link from "next/link";
import PageShell from "@/components/PageShell";
import PageHero from "@/components/PageHero";
import OrderCta from "@/components/OrderCta";
import LoShuCalculator from "@/components/LoShuCalculator";
import VideoEmbed from "@/components/VideoEmbed";
import { LO_SHU_LINES } from "@/lib/loshu";
import { COMBO_VIDEOS } from "@/data/videos";

export const metadata: Metadata = {
  title: "Lo Shu grid calculator: find your missing numbers",
  description: "Free Lo Shu grid calculator. Enter your date of birth to see which numbers you have, which are missing, and which lines like 4-9-2 or 2-7-6 are complete.",
  alternates: { canonical: "/numerology/lo-shu-grid" },
};

export default function LoShuPage() {
  return (
    <PageShell>
      <PageHero
        crumbs={[{ label: "Numerology", href: "/numerology" }, { label: "Lo Shu grid" }]}
        eyebrow="Free calculator"
        title="Your Lo Shu grid"
        lede={
          <p>
            The Lo Shu grid places the digits of your date of birth into a 3×3 square. Repeated numbers, missing numbers
            and complete lines are all part of a reading.
          </p>
        }
      />
      <section className="section-narrow" aria-label="Calculator">
        <LoShuCalculator />
      </section>

      <section className="section-narrow legal" aria-labelledby="how-h">
        <h2 id="how-h">How the grid works</h2>
        <p>
          Every digit in your date of birth (except 0) goes into its fixed place in the grid: 4, 9, 2 across the top; 3, 5,
          7 in the middle; 8, 1, 6 at the bottom. A digit that appears twice is written twice. Empty squares are your
          missing numbers.
        </p>
        <p>
          Methods differ between numerologists. Some also add the mulank and bhagyank; the checkbox above lets you see
          both versions. Ammit reads the whole picture, including your name, before he chooses crystals.
        </p>
      </section>

      <section className="section-wide grid-section" aria-labelledby="lines-h">
        <h2 id="lines-h" className="h2 grid-title">
          The eight lines
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
        <p className="small-note center">
          Want to know what your grid means for you? <Link href="/consultation">Book a consultation</Link> with Ammit.
        </p>
      </section>
      <OrderCta />
    </PageShell>
  );
}
