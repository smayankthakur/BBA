import type { Metadata } from "next";
import Link from "next/link";
import LegalPage from "@/components/LegalPage";
import { LINKS, SHIPPING } from "@/data/home";

export const metadata: Metadata = {
  title: "Shipping and delivery",
  description: "How Bracelet By Ammit makes and ships your crystal bracelet, and how delivery works.",
  alternates: { canonical: "/shipping" },
};

export default function ShippingPage() {
  return (
    <LegalPage
      title="Shipping and delivery"
      crumb="Shipping"
      lede="Free delivery across India, usually within 5–7 days of your order. Every bracelet is read and strung by hand first."
    >
      <h2>Making your bracelet</h2>
      <p>
        After your order is confirmed, Ammit reads the wearer&apos;s numbers, chooses the crystals and the bracelet is
        strung by hand. We&apos;ll tell you on WhatsApp when it&apos;s on its way.
      </p>

      <h2>Where we deliver</h2>
      <p>
        We deliver across India. For delivery outside India, message us on{" "}
        <a href={LINKS.whatsapp} target="_blank" rel="noopener noreferrer">
          WhatsApp
        </a>{" "}
        before ordering.
      </p>

      <h2>Delivery charges</h2>
      <p>Shipping is free on every order within India. The price you see is the price you pay.</p>

      <h2>Delivery time</h2>
      <p>
        Most orders arrive within {SHIPPING.minDays}–{SHIPPING.maxDays} days of payment, including the time Ammit takes to
        read your numbers and string the bracelet. We show an estimated delivery date before you pay. Remote PIN codes
        and festival periods can take a little longer; we&apos;ll tell you on WhatsApp if that happens.
      </p>

      <h2>Payment</h2>
      <p>
        All orders are prepaid online through Razorpay: UPI, debit and credit cards, and net banking. We don&apos;t offer
        cash on delivery.
      </p>

      <h2>Your address</h2>
      <p>
        Please give your full address, including flat or house number, society, street, landmark and PIN code. Couriers
        don&apos;t always call before delivering, so an incomplete address can mean the parcel is returned or delayed.
      </p>

      <h2>Tracking</h2>
      <p>We&apos;ll share tracking details on WhatsApp once your bracelet has been sent.</p>

      <h2>If something goes wrong</h2>
      <p>
        If your parcel is late, damaged or missing, message us on WhatsApp with your name and order details and
        we&apos;ll sort it out with the courier. See also our <Link href="/returns">returns policy</Link>.
      </p>
    </LegalPage>
  );
}
