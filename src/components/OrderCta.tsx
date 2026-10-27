import Link from "next/link";
import { getContent } from "@/lib/server/content";

type Action = { label: string; href: string; external?: boolean };

const btn = (a: Action, cls: string) =>
  a.external ? (
    <a className={cls} href={a.href} target="_blank" rel="noopener noreferrer">
      {a.label}
    </a>
  ) : (
    <Link className={cls} href={a.href}>
      {a.label}
    </Link>
  );

/** Lapis band closing most inner pages. Primary action = the order funnel. */
export default async function OrderCta({
  title,
  text,
  primary,
  secondary,
}: {
  title?: string;
  text?: string;
  primary?: Action;
  secondary?: Action;
}) {
  const c = await getContent("shared");
  title ||= c.ctaTitle;
  text ||= c.ctaText;
  primary ??= { label: c.ctaButton, href: "/find-your-bracelet" };
  return (
    <section className="order-cta">
      <div className="order-cta-inner">
        <h2 className="h2">{title}</h2>
        {text && <p>{text}</p>}
        <div className="btn-row">
          {btn(primary, "btn btn-gold")}
          {secondary && btn(secondary, "btn btn-ghost-gold")}
        </div>
      </div>
    </section>
  );
}
