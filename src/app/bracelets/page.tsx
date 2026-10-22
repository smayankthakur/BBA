import type { Metadata } from "next";
import Link from "next/link";
import PageShell from "@/components/PageShell";
import PageHero from "@/components/PageHero";
import BraceletCard from "@/components/BraceletCard";
import HowItWorks from "@/components/HowItWorks";
import OrderCta from "@/components/OrderCta";
import { BRACELETS } from "@/data/pages";
import { PRICE } from "@/data/home";

export const metadata: Metadata = {
  title: "Shop by intention",
  description: `Seven crystal bracelets for seven intentions, each ${PRICE}. Ammit Kukreja reads your date of birth before choosing the crystals.`,
  alternates: { canonical: "/bracelets" },
};

export default function BraceletsPage() {
  return (
    <PageShell>
      <PageHero
        crumbs={[{ label: "Bracelets" }]}
        eyebrow="Shop by intention"
        title="A bracelet for what you're asking of life"
        lede={
          <p>
            Choose the intention. Ammit reads your date of birth and chooses the crystals for your numbers, then strings
            them by hand. Every bracelet is {PRICE}.
          </p>
        }
      >
        <Link className="btn btn-lapis" href="/find-your-bracelet">
          Not sure? Take the 60-second reading
        </Link>
      </PageHero>
      <section className="section-wide grid-section" aria-label="Bracelets">
        <div className="b-grid">
          {BRACELETS.map((b) => (
            <BraceletCard key={b.slug} b={b} />
          ))}
        </div>
      </section>
      <HowItWorks />
      <OrderCta title="Not sure which one?" text="Take the 60-second reading: we'll work out your numbers and suggest the bracelet that suits them." secondary={{ label: "Book a consultation", href: "/consultation" }} />
    </PageShell>
  );
}
