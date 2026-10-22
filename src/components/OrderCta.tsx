import Link from "next/link";
import { LINKS } from "@/data/home";

/** Lapis band closing most inner pages. */
export default function OrderCta({
  title = "Ready when you are",
  text = "Send your date of birth on WhatsApp and Ammit will choose the crystals for your numbers.",
  secondary,
}: {
  title?: string;
  text?: string;
  secondary?: { label: string; href: string };
}) {
  return (
    <section className="order-cta">
      <div className="order-cta-inner">
        <h2 className="h2">{title}</h2>
        <p>{text}</p>
        <div className="btn-row">
          <a className="btn btn-gold" href={LINKS.whatsapp} target="_blank" rel="noopener noreferrer">
            Order on WhatsApp
          </a>
          {secondary && (
            <Link className="btn btn-ghost-gold" href={secondary.href}>
              {secondary.label}
            </Link>
          )}
        </div>
      </div>
    </section>
  );
}
