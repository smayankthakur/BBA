import type { Metadata } from "next";
import Link from "next/link";
import PageShell from "@/components/PageShell";
import PageHero from "@/components/PageHero";
import OrderCta from "@/components/OrderCta";
import { MULANK } from "@/data/pages";

export const metadata: Metadata = {
  title: "Mulank and bhagyank: how to calculate them",
  description: "Your mulank (birth number) comes from the day you were born; your bhagyank (destiny number) from your full date of birth. Here's how to work out both.",
  alternates: { canonical: "/numerology/mulank-and-bhagyank" },
};

export default function MulankBhagyankGuide() {
  return (
    <PageShell>
      <PageHero
        crumbs={[{ label: "Numerology", href: "/numerology" }, { label: "Mulank and bhagyank" }]}
        eyebrow="Guide"
        title="Mulank and bhagyank"
        lede={<p>The two numbers at the heart of Indian numerology, and the first thing Ammit looks at in your date of birth.</p>}
      />
      <article className="section-narrow legal">
        <h2>Mulank: your birth number</h2>
        <p>
          Your mulank comes from the <b>day</b> you were born. Add its digits until a single number is left.
        </p>
        <ul>
          <li>Born on the 7th: mulank 7.</li>
          <li>Born on the 25th: 2 + 5 = 7, so mulank 7.</li>
          <li>Born on the 29th: 2 + 9 = 11, then 1 + 1 = 2, so mulank 2.</li>
        </ul>
        <p>Each mulank is traditionally linked with a ruling planet:</p>
        <ul className="planet-list">
          {MULANK.map((m) => (
            <li key={m.number}>
              <Link href={`/mulank/${m.number}`}>
                {m.number}: {m.planet}
                {m.planetHindi !== m.planet ? ` (${m.planetHindi})` : ""}
              </Link>
            </li>
          ))}
        </ul>

        <h2>Bhagyank: your destiny number</h2>
        <p>
          Your bhagyank comes from your <b>full date of birth</b>. Add every digit of the day, month and year, then keep
          adding until a single number is left.
        </p>
        <p>
          Example: 25-03-1995 → 2 + 5 + 0 + 3 + 1 + 9 + 9 + 5 = 34 → 3 + 4 = <b>7</b>.
        </p>

        <h2>Why both matter</h2>
        <p>
          Your mulank is often described as how you see yourself and how you act day to day; your bhagyank as the
          direction your life tends to take. Two people with the same mulank can have different bhagyanks, which is why
          Ammit reads your whole date of birth, and your name, before choosing crystals.
        </p>

        <h2>Try it</h2>
        <p>
          The <Link href="/find-your-bracelet">60-second reading</Link> works out both numbers for you, or put your date
          of birth into the <Link href="/numerology/lo-shu-grid">Lo Shu grid calculator</Link> to see which numbers are
          present and missing.
        </p>
      </article>
      <OrderCta />
    </PageShell>
  );
}
