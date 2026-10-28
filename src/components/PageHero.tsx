import Link from "./LocaleLink";
import JsonLd from "./JsonLd";
import { SITE_URL } from "@/lib/site";
import { getLang, getUI } from "@/lib/server/lang";
import { lp } from "@/lib/i18n/config";

export type Crumb = { label: string; href?: string };

type Props = {
  crumbs: Crumb[];
  eyebrow?: string;
  title: string;
  lede?: React.ReactNode;
  children?: React.ReactNode;
  align?: "left" | "center";
};

/** Inner-page header: breadcrumbs (+ BreadcrumbList schema), eyebrow, H1, lede, actions. */
export default function PageHero({ crumbs, eyebrow, title, lede, children, align = "left" }: Props) {
  const lang = getLang();
  const ui = getUI();
  const all: Crumb[] = [{ label: ui.common.home, href: "/" }, ...crumbs];
  return (
    <header className={`page-hero ${align === "center" ? "is-center" : ""}`}>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: all.map((c, i) => ({
            "@type": "ListItem",
            position: i + 1,
            name: c.label,
            ...(c.href ? { item: `${SITE_URL}${lp(lang, c.href) === "/" ? "" : lp(lang, c.href)}` } : {}),
          })),
        }}
      />
      <nav aria-label={ui.common.breadcrumb} className="crumbs">
        <ol>
          {all.map((c, i) => (
            <li key={c.label}>
              {c.href && i < all.length - 1 ? <Link href={c.href}>{c.label}</Link> : <span aria-current="page">{c.label}</span>}
            </li>
          ))}
        </ol>
      </nav>
      {eyebrow && (
        <p className="eyebrow">
          <span aria-hidden="true">◆</span> {eyebrow}
        </p>
      )}
      <h1>{title}</h1>
      {lede && <div className="page-lede">{lede}</div>}
      {children && <div className="btn-row page-actions">{children}</div>}
    </header>
  );
}
