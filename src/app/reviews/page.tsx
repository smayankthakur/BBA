import type { Metadata } from "next";
import PageShell from "@/components/PageShell";
import PageHero from "@/components/PageHero";
import Testimonials from "@/components/Testimonials";
import OrderCta from "@/components/OrderCta";

export const metadata: Metadata = {
  title: "Customer reviews",
  description: "What customers say about the crystal bracelets Ammit Kukreja chose for them.",
  alternates: { canonical: "/reviews" },
};

export default function ReviewsPage() {
  return (
    <PageShell>
      <PageHero
        crumbs={[{ label: "Reviews" }]}
        eyebrow="Customer reviews"
        title="What customers say"
        lede={<p>Messages customers have sent Ammit about their bracelets, shared with their words unchanged except for spelling.</p>}
      />
      <Testimonials />
      <OrderCta title="Wearing one of our bracelets?" text="We'd love to hear how it's going. Send Ammit a message on WhatsApp." secondary={{ label: "Shop by intention", href: "/bracelets" }} />
    </PageShell>
  );
}
