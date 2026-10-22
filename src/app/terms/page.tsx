import type { Metadata } from "next";
import Link from "next/link";
import LegalPage from "@/components/LegalPage";
import { BUSINESS, FOOTER_DISCLAIMER, LINKS } from "@/data/home";

export const metadata: Metadata = {
  title: "Terms of use",
  description: "The terms for using the Bracelet By Ammit website and ordering a crystal bracelet.",
  alternates: { canonical: "/terms" },
};

export default function TermsPage() {
  return (
    <LegalPage
      title="Terms of use"
      crumb="Terms"
      lede="By using this website or ordering a bracelet, you agree to these terms. They're written to be read, so please do."
    >
      <h2>About these terms</h2>
      <p>
        These terms apply to the website and to orders placed with {BUSINESS.legalName || BUSINESS.brand}. Our{" "}
        <Link href="/privacy">privacy policy</Link>, <Link href="/shipping">shipping policy</Link> and{" "}
        <Link href="/returns">returns policy</Link> form part of them.
      </p>

      <h2>Guidance, not advice</h2>
      <p>{FOOTER_DISCLAIMER}</p>
      <p>
        Numerology readings, crystal suggestions and website content are offered as traditional guidance. Please
        don&apos;t stop or change any medical treatment, or make legal or financial decisions, based on them.
      </p>

      <h2>Your bracelet</h2>
      <ul>
        <li>Every bracelet is made after we read the wearer&apos;s name and date of birth, so details you give us must be accurate.</li>
        <li>Crystals are natural. Colour, pattern and size vary from stone to stone, and photos and illustrations are a guide only.</li>
        <li>The crystals named on product pages are those traditionally used for each intention. Ammit chooses the final stones for each wearer, so yours may differ.</li>
      </ul>

      <h2>Prices and payment</h2>
      <p>
        Prices are shown in Indian rupees. The total you pay, including any delivery charge, is confirmed with you
        before payment. An order is accepted once we confirm it with you on WhatsApp.
      </p>

      <h2>Delivery, returns and restringing</h2>
      <p>
        See our <Link href="/shipping">shipping policy</Link> and <Link href="/returns">returns policy</Link>.
      </p>

      <h2>Website content</h2>
      <p>
        The Bracelet By Ammit name, logo, text, videos and designs belong to us or are used with permission. Please
        don&apos;t copy them for commercial use without asking.
      </p>

      <h2>Liability</h2>
      <p>
        We take care to make every bracelet well. To the extent the law allows, our liability for any order is limited
        to the amount you paid for it. Nothing in these terms affects your rights under the Consumer Protection Act,
        2019.
      </p>

      <h2>Questions and complaints</h2>
      <p>
        Message us on{" "}
        <a href={LINKS.whatsapp} target="_blank" rel="noopener noreferrer">
          WhatsApp
        </a>
        . Our grievance officer is {BUSINESS.grievanceOfficer.name}, {BUSINESS.grievanceOfficer.designation}. These terms
        are governed by the laws of India.
      </p>
    </LegalPage>
  );
}
