import type { Metadata } from "next";
import Link from "next/link";
import PageShell from "@/components/PageShell";
import PageHero from "@/components/PageHero";
import OrderCta from "@/components/OrderCta";
import { MULANK, birthDaysFor } from "@/data/pages";

export const metadata: Metadata = {
  title: "Find your mulank (birth number)",
  description:
    "Work out your mulank from the day you were born and see its ruling planet. Ammit Kukreja chooses crystal bracelets for your numbers.",
  alternates: { canonical: "/mulank" },
};

export default function MulankIndex() {
  return (
    <PageShell>
      <PageHero
        crumbs={[{ label: "Mulank" }]}
        eyebrow="By number"
        title="Start with your number"
        lede={
          <p>
            Your mulank is your birth number. Add the digits of the day you were born until one is left. Born on the
            25th? 2 + 5 makes you a 7. Born on the 9th? You&apos;re a 9.
          </p>
        }
      />
      <section className="section-wide grid-section" aria-label="Mulank 1 to 9">
        <ul className="m-grid">
          {MULANK.map((m) => (
            <li key={m.number}>
              <Link href={`/mulank/${m.number}`} className="m-card">
                <span className="m-num">{m.number}</span>
                <span className="m-planet">
                  {m.planet} · {m.planetHindi}
                </span>
                <span className="m-days">Born on {birthDaysFor(m.number).join(", ")}</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>
      <section className="section-narrow prose-section">
        <h2 className="h2">Your mulank is only the start</h2>
        <p>
          Your bhagyank, the sum of your full date of birth, matters just as much, and so does how your numbers sit
          together. That&apos;s why Ammit reads your whole date of birth before choosing a single crystal.
        </p>
      </section>
      <OrderCta title="Know your number?" text="Send Ammit your full date of birth on WhatsApp and he'll tell you which crystals suit it." secondary={{ label: "Shop by intention", href: "/bracelets" }} />
    </PageShell>
  );
}
