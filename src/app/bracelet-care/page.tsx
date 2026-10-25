import type { Metadata } from "next";
import PageShell from "@/components/PageShell";
import PageHero from "@/components/PageHero";
import OrderCta from "@/components/OrderCta";
import { CARE, LINKS } from "@/data/home";
import { CARE_GUIDE } from "@/data/pages";
import VideoEmbed from "@/components/VideoEmbed";
import { CARE_VIDEO } from "@/data/videos";

export const metadata: Metadata = {
  title: "Crystal bracelet care: cleansing, recharging, restringing",
  description:
    "How to cleanse, recharge and look after your crystal bracelet, and what to do if it breaks.",
  alternates: { canonical: "/bracelet-care" },
};

export default function CarePage() {
  return (
    <PageShell>
      <PageHero
        crumbs={[{ label: "Bracelet care" }]}
        eyebrow="Care guide"
        title="Looking after your bracelet"
        lede={<p>A little care keeps your crystals clear and your bracelet strong. Here&apos;s how.</p>}
      />
      <section className="section-wide grid-section" aria-label="Care steps">
        <div className="info-grid" tabIndex={0} role="region" aria-label="Care basics">
          {CARE.map((c) => (
            <div key={c.term} className="info-card">
              <h2 className="h3">{c.term}</h2>
              <p>{c.detail}</p>
            </div>
          ))}
        </div>
      </section>
      <section className="section-narrow split-lists">
        <div>
          <h2 className="h3">Do</h2>
          <ul className="tick-list">
            {CARE_GUIDE.dos.map((d) => (
              <li key={d}>{d}</li>
            ))}
          </ul>
        </div>
        <div>
          <h2 className="h3">Don&apos;t</h2>
          <ul className="cross-list">
            {CARE_GUIDE.donts.map((d) => (
              <li key={d}>{d}</li>
            ))}
          </ul>
        </div>
      </section>
      <section className="section-narrow prose-section">
        <h2 className="h2">What if my bracelet breaks?</h2>
        <p>
          It&apos;s the question people ask us most. Collect every bead, then{" "}
          <a href={LINKS.youtubeShorts} target="_blank" rel="noopener noreferrer">
            watch Ammit&apos;s answer on YouTube
          </a>{" "}
          and message us on WhatsApp so we can restring the same crystals for you.
        </p>
        <VideoEmbed video={CARE_VIDEO} />
      </section>
      <OrderCta
        title="Need a restring?"
        text="Send us a photo of the beads (contact details are at the bottom of this page) and we'll tell you how to send them back."
        secondary={{ label: "Order a new bracelet", href: "/find-your-bracelet" }}
      />
    </PageShell>
  );
}
