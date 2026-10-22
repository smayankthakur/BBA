import Link from "next/link";

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
export default function OrderCta({
  title = "Ready when you are",
  text = "Answer 7 quick questions, see your numbers and the bracelet that suits them, then place your order.",
  primary = { label: "Order my bracelet", href: "/find-your-bracelet" },
  secondary,
}: {
  title?: string;
  text?: string;
  primary?: Action;
  secondary?: Action;
}) {
  return (
    <section className="order-cta">
      <div className="order-cta-inner">
        <h2 className="h2">{title}</h2>
        <p>{text}</p>
        <div className="btn-row">
          {btn(primary, "btn btn-gold")}
          {secondary && btn(secondary, "btn btn-ghost-gold")}
        </div>
      </div>
    </section>
  );
}
