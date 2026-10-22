import type { Metadata } from "next";
import Link from "next/link";
import PageShell from "@/components/PageShell";
import PageHero from "@/components/PageHero";
import OrderCta from "@/components/OrderCta";

export const metadata: Metadata = {
  title: "Numerology guides",
  description: "Simple guides to mulank, bhagyank and the Lo Shu grid, with a free calculator and videos by numerologist Ammit Kukreja.",
  alternates: { canonical: "/numerology" },
};

const GUIDES = [
  { href: "/numerology/mulank-and-bhagyank", title: "Mulank and bhagyank", text: "What your birth number and destiny number are, and how to work them out." },
  { href: "/numerology/lo-shu-grid", title: "Lo Shu grid calculator", text: "Put your date of birth into the 3×3 grid and see which numbers and lines you have." },
  { href: "/mulank", title: "Mulank 1 to 9", text: "One page for each number: ruling planet, birth dates and traditional qualities." },
  { href: "/find-your-bracelet", title: "60-second crystal reading", text: "Your numbers, plus the bracelet that suits them." },
];

export default function NumerologyHub() {
  return (
    <PageShell>
      <PageHero
        crumbs={[{ label: "Numerology" }]}
        eyebrow="Guides"
        title="Numerology, made simple"
        lede={<p>Short, practical guides to the numbers Ammit reads before he chooses a single crystal.</p>}
      />
      <section className="section-wide grid-section" aria-label="Guides">
        <div className="info-grid">
          {GUIDES.map((g) => (
            <div key={g.href} className="info-card">
              <h2 className="h3">{g.title}</h2>
              <p>{g.text}</p>
              <Link href={g.href}>Read →</Link>
            </div>
          ))}
        </div>
      </section>
      <OrderCta />
    </PageShell>
  );
}
