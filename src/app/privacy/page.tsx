import type { Metadata } from "next";
import Link from "next/link";
import LegalPage from "@/components/LegalPage";
import { BUSINESS, LINKS } from "@/data/home";

export const metadata: Metadata = {
  title: "Privacy policy",
  description: "What personal data Bracelet By Ammit collects, why, who we share it with, and how to ask us to correct or delete it.",
  alternates: { canonical: "/privacy" },
};

export default function PrivacyPage() {
  return (
    <LegalPage
      title="Privacy policy"
      crumb="Privacy"
      lede="We only ask for what we need to read your numbers, make your bracelet and deliver it. This page explains what that is and what we do with it."
    >
      <h2>Who we are</h2>
      <p>
        This website is run by {BUSINESS.legalName || BUSINESS.brand} (&ldquo;we&rdquo;, &ldquo;us&rdquo;), founded by{" "}
        {BUSINESS.founder}. For anything about your data, message us on{" "}
        <a href={LINKS.whatsapp} target="_blank" rel="noopener noreferrer">
          WhatsApp
        </a>
        .
      </p>

      <h2>What we collect</h2>
      <h3>When you browse this website</h3>
      <p>
        The website itself does not ask you to log in and does not set advertising cookies. Our hosting provider (Vercel)
        keeps standard server logs, such as IP address, browser type and the pages requested, to keep the site secure
        and working. If we turn on analytics, it only runs after you click &ldquo;Accept&rdquo; on the cookie notice, and
        you can change your mind at any time from the footer.
      </p>
      <h3>When you take the 60-second reading</h3>
      <p>
        Your answers (including the wearer&apos;s name and date of birth) are processed inside your browser to work out
        the mulank and bhagyank. They are not sent to us or stored unless you choose to continue to the order form or
        WhatsApp.
      </p>
      <h3>When you order</h3>
      <p>Orders are placed through our website checkout (and, in some cases, our Google order form or WhatsApp). We collect:</p>
      <ul>
        <li>name, mobile number and email address;</li>
        <li>date of birth and gender of the person who will wear the bracelet;</li>
        <li>wrist size and the purpose of the bracelet;</li>
        <li>delivery address;</li>
        <li>how you heard about us, and anything you tell us in messages.</li>
      </ul>

      <h2>Why we use it</h2>
      <ul>
        <li>to read the wearer&apos;s numbers and choose the crystals;</li>
        <li>to make, pack and deliver the bracelet and keep you updated;</li>
        <li>to help with care, restringing and any problem with your order;</li>
        <li>to keep the records the law requires (for example, tax records).</li>
      </ul>
      <p>We do not sell your data. We only send you offers if you&apos;ve agreed to receive them, and you can opt out any time.</p>

      <h2>Who we share it with</h2>
      <ul>
        <li>Razorpay, which processes payments. Your card, UPI and bank details go directly to Razorpay; we never see or store them;</li>
        <li>our order database provider, which stores order details securely for us;</li>
        <li>Google (order form and spreadsheet) and Meta (WhatsApp), which handle messages and order details for us;</li>
        <li>courier partners, who need your name, phone number and address to deliver;</li>
        <li>Vercel, which hosts this website;</li>
        <li>authorities, only where the law requires it.</li>
      </ul>
      <p>Some of these providers may process data outside India, under their own security and privacy terms.</p>

      <h2>Videos on this site</h2>
      <p>
        Ammit&apos;s videos use YouTube&apos;s privacy-enhanced mode and only load when you press play. Once you do,
        YouTube&apos;s own privacy policy applies.
      </p>

      <h2>Children</h2>
      <p>
        If the bracelet is for someone under 18, the order must be placed by their parent or guardian, who provides
        the child&apos;s details on their behalf.
      </p>

      <h2>How long we keep it</h2>
      <p>
        We keep order details for as long as we need them to fulfil and support your order, and for as long as the law
        requires us to keep business records. After that we delete them.
      </p>

      <h2>Your rights</h2>
      <p>
        Under India&apos;s Digital Personal Data Protection Act, 2023 you can ask us to show you the data we hold about
        you, correct it, delete it, or withdraw consent you&apos;ve given. You can also nominate someone to act for you.
        Message us on{" "}
        <a href={LINKS.whatsapp} target="_blank" rel="noopener noreferrer">
          WhatsApp
        </a>{" "}
        and we&apos;ll respond as quickly as we can.
      </p>

      <h2>Grievance officer</h2>
      <p>
        {BUSINESS.grievanceOfficer.name}, {BUSINESS.grievanceOfficer.designation}
        {BUSINESS.email ? `, ${BUSINESS.email}` : ""}. Contact via{" "}
        <a href={LINKS.whatsapp} target="_blank" rel="noopener noreferrer">
          WhatsApp
        </a>
        .
      </p>

      <h2>Changes</h2>
      <p>
        If we change this policy we&apos;ll update the date at the top of this page. See also our{" "}
        <Link href="/terms">terms</Link>, <Link href="/shipping">shipping</Link> and <Link href="/returns">returns</Link>{" "}
        policies.
      </p>
    </LegalPage>
  );
}
