import type { Metadata } from "next";
import Link from "next/link";
import PageShell from "@/components/PageShell";
import PageHero from "@/components/PageHero";
import BraceletCard from "@/components/BraceletCard";
import HowItWorks from "@/components/HowItWorks";
import OrderCta from "@/components/OrderCta";
import SiteTrustBar from "@/components/SiteTrustBar";
import { getBracelets, lowestPrice } from "@/lib/server/catalog";
import { formatINR, getContent, getSite } from "@/lib/server/content";
import { fill } from "@/lib/content/render";

async function vars() {
  const [{ vars }, low] = await Promise.all([getSite(), lowestPrice()]);
  return { ...vars, price: formatINR(low) };
}

export async function generateMetadata(): Promise<Metadata> {
  const [c, v] = await Promise.all([getContent("bracelets"), vars()]);
  return { title: c.seoTitle || c.title, description: fill(c.seoDescription, v), alternates: { canonical: "/bracelets" } };
}

export default async function BraceletsPage() {
  const [c, v, bracelets] = await Promise.all([getContent("bracelets"), vars(), getBracelets()]);
  return (
    <PageShell>
      <PageHero crumbs={[{ label: "Bracelets" }]} eyebrow={c.eyebrow} title={c.title} lede={<p>{fill(c.lede, v)}</p>}>
        <Link className="btn btn-lapis" href="/find-your-bracelet">
          {c.button}
        </Link>
      </PageHero>
      <div className="section-wide trust-wrap">
        <SiteTrustBar />
      </div>
      <section className="section-wide grid-section" aria-label="Bracelets">
        <div className="b-grid">
          {bracelets.map((b) => (
            <BraceletCard key={b.slug} b={b} />
          ))}
        </div>
      </section>
      <HowItWorks />
      <OrderCta title={c.ctaTitle} text={c.ctaText} secondary={{ label: "Book a consultation", href: "/consultation" }} />
    </PageShell>
  );
}
