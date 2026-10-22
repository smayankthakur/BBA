import type { Metadata } from "next";
import PageShell from "@/components/PageShell";
import PageHero from "@/components/PageHero";
import OrderCta from "@/components/OrderCta";
import { CONSULTATION } from "@/data/pages";
import { LINKS } from "@/data/home";

export const metadata: Metadata = {
  title: "Numerology consultation with Ammit",
  description:
    "Book a one-to-one numerology consultation with Ammit Kukreja: your mulank, bhagyank, missing numbers and the crystals that suit you.",
  alternates: { canonical: "/consultation" },
};

export default function ConsultationPage() {
  return (
    <PageShell>
      <PageHero
        crumbs={[{ label: "Consultation" }]}
        eyebrow="One to one"
        title="A numerology consultation with Ammit"
        lede={<p>Not sure which bracelet, or have a bigger question? Ammit reads your full date of birth and talks you through what your numbers say.</p>}
      >
        <a className="btn btn-lapis" href={LINKS.whatsapp} target="_blank" rel="noopener noreferrer">
          Book on WhatsApp
        </a>
      </PageHero>
      <section className="section-narrow split-lists">
        <div>
          <h2 className="h3">What we cover</h2>
          <ul className="tick-list">
            {CONSULTATION.covers.map((c) => (
              <li key={c}>{c}</li>
            ))}
          </ul>
        </div>
        <div>
          <h2 className="h3">How to book</h2>
          <ol className="num-list">
            {CONSULTATION.steps.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ol>
        </div>
      </section>
      <section className="section-narrow prose-section">
        <p className="callout">
          Numerology is guidance, not a guarantee. For medical, legal or financial decisions, please also speak to a
          qualified professional.
        </p>
      </section>
      <OrderCta
        title="Have your date of birth ready"
        text="Message Ammit on WhatsApp to book a time."
        primary={{ label: "Book on WhatsApp", href: LINKS.whatsapp, external: true }}
        secondary={{ label: "Or order a bracelet", href: "/find-your-bracelet" }}
      />
    </PageShell>
  );
}
