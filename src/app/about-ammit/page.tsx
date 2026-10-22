import type { Metadata } from "next";
import Link from "next/link";
import PageShell from "@/components/PageShell";
import PageHero from "@/components/PageHero";
import NoteFromAmmit from "@/components/NoteFromAmmit";
import OrderCta from "@/components/OrderCta";
import JsonLd from "@/components/JsonLd";
import { AMMIT, LINKS } from "@/data/home";
import { SITE_URL } from "@/lib/site";

export const metadata: Metadata = {
  title: "About Ammit Kukreja, numerologist",
  description:
    "Ammit Kukreja is the numerologist behind Bracelet By Ammit. He reads every date of birth himself before choosing crystals, and strings each bracelet by hand.",
  alternates: { canonical: "/about-ammit" },
};

const WORK = [
  { title: "Crystal bracelets", text: "Seven intention bracelets, each read for your date of birth and strung by hand.", href: "/bracelets", cta: "Shop by intention", external: false },
  { title: "Numerology consultations", text: "A one-to-one reading of your numbers, with advice on which crystals suit you.", href: "/consultation", cta: "About consultations", external: false },
  { title: "Videos in Hinglish", text: "Short videos on mulank, number combinations and crystal care, on YouTube and Instagram.", href: LINKS.youtube, cta: "Watch on YouTube", external: true },
];

export default function AboutPage() {
  return (
    <PageShell>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Person",
          name: AMMIT.name,
          jobTitle: "Numerologist",
          worksFor: { "@type": "Organization", name: "Bracelet By Ammit", url: SITE_URL },
          sameAs: [LINKS.instagram, LINKS.youtube],
        }}
      />
      <PageHero
        crumbs={[{ label: "About Ammit" }]}
        eyebrow="The numerologist"
        title="Meet Ammit Kukreja"
        lede={<p>Right crystal, right direction. Every bracelet starts with Ammit reading your date of birth himself.</p>}
      />
      <NoteFromAmmit />
      <section className="section-wide grid-section" aria-labelledby="work-title">
        <h2 id="work-title" className="h2 grid-title">
          What Ammit does
        </h2>
        <div className="info-grid">
          {WORK.map((w) => (
            <div key={w.title} className="info-card">
              <h3>{w.title}</h3>
              <p>{w.text}</p>
              {w.external ? (
                <a href={w.href} target="_blank" rel="noopener noreferrer">
                  {w.cta} →
                </a>
              ) : (
                <Link href={w.href}>{w.cta} →</Link>
              )}
            </div>
          ))}
        </div>
      </section>
      <OrderCta title="Ask Ammit which crystal is yours" secondary={{ label: "Read customer reviews", href: "/reviews" }} />
    </PageShell>
  );
}
