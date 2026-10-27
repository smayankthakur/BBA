import type { Metadata } from "next";
import PageShell from "@/components/PageShell";
import PageHero from "@/components/PageHero";
import Testimonials from "@/components/Testimonials";
import OrderCta from "@/components/OrderCta";
import { getContent } from "@/lib/server/content";

export async function generateMetadata(): Promise<Metadata> {
  const c = await getContent("reviews");
  return { title: c.seoTitle || c.title, description: c.seoDescription, alternates: { canonical: "/reviews" } };
}

export default async function ReviewsPage() {
  const c = await getContent("reviews");
  return (
    <PageShell>
      <PageHero crumbs={[{ label: "Reviews" }]} eyebrow={c.eyebrow} title={c.title} lede={<p>{c.lede}</p>} />
      <Testimonials />
      <OrderCta title={c.ctaTitle} text={c.ctaText} />
    </PageShell>
  );
}
