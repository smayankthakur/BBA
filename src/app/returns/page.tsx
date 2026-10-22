import type { Metadata } from "next";
import Link from "next/link";
import LegalPage from "@/components/LegalPage";
import { LINKS } from "@/data/home";

export const metadata: Metadata = {
  title: "Returns, exchanges and restringing",
  description: "What to do if your Bracelet By Ammit bracelet arrives damaged, doesn't fit, or breaks.",
  alternates: { canonical: "/returns" },
};

export default function ReturnsPage() {
  return (
    <LegalPage
      title="Returns, exchanges and restringing"
      crumb="Returns"
      lede="Each bracelet is made for one person's numbers, so we can't resell it. But if something isn't right, we'll help."
    >
      <h2>If it arrives damaged or incorrect</h2>
      <p>
        Message us on{" "}
        <a href={LINKS.whatsapp} target="_blank" rel="noopener noreferrer">
          WhatsApp
        </a>{" "}
        as soon as you open the parcel, with a photo of the bracelet and the packaging. We&apos;ll arrange a repair or
        replacement.
      </p>

      <h2>If it doesn&apos;t fit</h2>
      <p>
        Check the <Link href="/size-guide">size guide</Link> before ordering. If the bracelet still doesn&apos;t fit,
        message us on WhatsApp and we&apos;ll tell you how to send it back for resizing.
      </p>

      <h2>If it breaks</h2>
      <p>
        Collect every bead and don&apos;t throw any away. Message us on WhatsApp with a photo, and we&apos;ll tell you how
        to send them back so Ammit can restring the same crystals for you. The <Link href="/bracelet-care">care guide</Link>{" "}
        explains how to make your bracelet last.
      </p>

      <h2>Change of mind</h2>
      <p>
        Because every bracelet is read and strung for one wearer&apos;s numbers, we can&apos;t accept returns for a
        change of mind once it has been made. Your rights under the Consumer Protection Act, 2019 are not affected.
      </p>

      <h2>Refunds</h2>
      <p>
        Where a refund is due, we&apos;ll confirm the amount with you and pay it back using the method you paid with.
      </p>
    </LegalPage>
  );
}
