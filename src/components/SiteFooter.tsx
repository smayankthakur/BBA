import Image from "next/image";
import Link from "./LocaleLink";
import CookieSettingsLink from "./CookieSettingsLink";
import OrderLink from "./order/OrderLink";
import { CREDIT } from "@/data/home";
import { formatINR, getContent, getSite } from "@/lib/server/content";
import { getBracelets } from "@/lib/server/catalog";
import { getUI } from "@/lib/server/lang";
import { tf } from "@/lib/i18n/ui";

const EXT = { target: "_blank", rel: "noopener noreferrer" } as const;

/** Simple line icons (social links, trust row, contact). */
function Icon({ kind }: { kind: "ig" | "yt" | "wa" | "truck" | "lock" | "spark" | "phone" | "mail" | "pin" }) {
  const p = { width: 18, height: 18, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.6, strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": true } as const;
  switch (kind) {
    case "ig":
      return (
        <svg {...p}>
          <rect x="3.5" y="3.5" width="17" height="17" rx="5" />
          <circle cx="12" cy="12" r="4" />
          <circle cx="17.2" cy="6.8" r="0.9" fill="currentColor" stroke="none" />
        </svg>
      );
    case "yt":
      return (
        <svg {...p}>
          <rect x="2.5" y="5.5" width="19" height="13" rx="4" />
          <path d="M10 9.2v5.6l4.8-2.8z" fill="currentColor" stroke="none" />
        </svg>
      );
    case "wa":
      return (
        <svg {...p}>
          <path d="M4.5 19.5l1.2-3.6A7.8 7.8 0 1 1 8.6 18.6z" />
          <path d="M9.3 8.6c.2-.5.6-.6.9-.6h.4c.2 0 .4.1.5.4l.6 1.4c.1.2 0 .4-.1.6l-.5.6c.4.9 1.2 1.7 2.1 2.1l.6-.5c.2-.1.4-.2.6-.1l1.4.6c.3.1.4.3.4.5v.4c0 .3-.1.7-.6.9-1.6.7-6.5-2.8-6.3-6.3z" fill="currentColor" stroke="none" />
        </svg>
      );
    case "truck":
      return (
        <svg {...p}>
          <path d="M3 7h11v9H3zM14 10h4l3 3v3h-7z" />
          <circle cx="7" cy="17.5" r="1.6" />
          <circle cx="17" cy="17.5" r="1.6" />
        </svg>
      );
    case "lock":
      return (
        <svg {...p}>
          <rect x="5" y="10.5" width="14" height="9.5" rx="2" />
          <path d="M8 10.5V8a4 4 0 0 1 8 0v2.5" />
        </svg>
      );
    case "spark":
      return (
        <svg {...p}>
          <path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z" />
          <path d="M19 16l.7 1.8 1.8.7-1.8.7L19 21l-.7-1.8-1.8-.7 1.8-.7z" />
        </svg>
      );
    case "phone":
      return (
        <svg {...p}>
          <path d="M6.5 3.5h3l1.5 4-2 1.5a11 11 0 0 0 6 6l1.5-2 4 1.5v3a2 2 0 0 1-2 2A16.5 16.5 0 0 1 4.5 5.5a2 2 0 0 1 2-2z" />
        </svg>
      );
    case "mail":
      return (
        <svg {...p}>
          <rect x="3" y="5.5" width="18" height="13" rx="2" />
          <path d="M3.5 7l8.5 6 8.5-6" />
        </svg>
      );
    default:
      return (
        <svg {...p}>
          <path d="M12 21s-6.5-5.6-6.5-11a6.5 6.5 0 0 1 13 0c0 5.4-6.5 11-6.5 11z" />
          <circle cx="12" cy="10" r="2.3" />
        </svg>
      );
  }
}

export default async function SiteFooter() {
  const year = new Date().getFullYear();
  const [{ s: site }, c, bracelets] = await Promise.all([getSite(), getContent("shared"), getBracelets()]);
  const ui = getUI();
  const f = ui.footer;
  const purposes = bracelets.filter((b) => b.inList);
  const phone = site.phone?.trim();
  const SOCIAL = [
    { label: "Instagram", href: site.instagram, icon: "ig" as const },
    { label: "YouTube", href: site.youtube, icon: "yt" as const },
    { label: "WhatsApp", href: site.whatsapp, icon: "wa" as const },
  ].filter((x) => x.href);
  const HELP = [
    { label: f.links.find, href: "/find-your-bracelet" },
    { label: f.links.consultation, href: "/consultation" },
    { label: f.links.about, href: "/about-ammit" },
    { label: f.links.reviews, href: "/reviews" },
    { label: f.links.care, href: "/bracelet-care" },
    { label: f.links.size, href: "/size-guide" },
  ];

  return (
    <footer className="foot">
      {/* Call to action */}
      <section className="foot-cta" aria-labelledby="foot-cta-title">
        <div className="foot-wrap foot-cta-in">
          <div className="foot-cta-copy">
            <p className="foot-kicker">{c.footerKicker}</p>
            <h2 id="foot-cta-title">{c.footerTitle}</h2>
            <p>{c.footerText}</p>
          </div>
          <div className="foot-cta-actions">
            <OrderLink className="btn btn-gold-dark" href="/find-your-bracelet" aria-haspopup="dialog">
              {c.footerOrder}
            </OrderLink>
            <a className="btn btn-ghost-gold" href={site.whatsapp} {...EXT}>
              <Icon kind="wa" /> {c.footerWhatsapp}
            </a>
          </div>
        </div>
      </section>

      <div className="foot-wrap">
        {/* Promises */}
        <ul className="foot-trust" aria-label={ui.trust.aria}>
          <li>
            <Icon kind="truck" /> {c.trustShipping}
          </li>
          <li>
            <Icon kind="lock" /> {c.trustPayment}
          </li>
          <li>
            <Icon kind="spark" /> {f.trust.made}
          </li>
        </ul>

        <div className="foot-main">
          <div className="foot-brand">
            <Image src="/brand/wordmark.png" alt="Bracelet By Ammit" width={128} height={59} />
            <p className="foot-tagline">{c.footerTagline}</p>
            <p className="foot-promise">{tf(f.promise, { price: formatINR(site.defaultPrice) })}</p>
            <ul className="foot-social" aria-label={f.elsewhere}>
              {SOCIAL.map((s) => (
                <li key={s.label}>
                  <a href={s.href} {...EXT} aria-label={s.label} title={s.label}>
                    <Icon kind={s.icon} />
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <nav className="foot-col foot-purposes" aria-label={tf(f.footerNav, { title: f.cols.purposes })}>
            <h3>{f.cols.purposes}</h3>
            <ul>
              {purposes.map((b) => (
                <li key={b.slug}>
                  <Link href={`/bracelets/${b.slug}`}>{b.title}</Link>
                </li>
              ))}
            </ul>
          </nav>

          <nav className="foot-col" aria-label={tf(f.footerNav, { title: f.cols.help })}>
            <h3>{f.cols.help}</h3>
            <ul>
              {HELP.map((l) => (
                <li key={l.href + l.label}>
                  <Link href={l.href}>{l.label}</Link>
                </li>
              ))}
            </ul>
          </nav>

          <div className="foot-col foot-contact">
            <h3>{f.cols.contact}</h3>
            <a className="foot-wa" href={site.whatsapp} {...EXT}>
              <Icon kind="wa" /> {f.whatsappCta}
            </a>
            <ul>
              {phone && (
                <li>
                  <Icon kind="phone" /> <a href={`tel:${phone.replace(/\s/g, "")}`}>{phone}</a>
                </li>
              )}
              {site.email && (
                <li>
                  <Icon kind="mail" /> <a href={`mailto:${site.email}`}>{site.email}</a>
                </li>
              )}
              {site.address && (
                <li>
                  <Icon kind="pin" /> <span>{site.address}</span>
                </li>
              )}
            </ul>
          </div>
        </div>

        {/* Business details (Consumer Protection (E-Commerce) Rules) and disclaimer */}
        <div className="foot-legal">
          <dl className="foot-biz" aria-label={f.business}>
            <div>
              <dt>{f.dt.business}</dt>
              <dd>{site.legalName || site.brand}</dd>
            </div>
            <div>
              <dt>{f.dt.founder}</dt>
              <dd>{site.founder}</dd>
            </div>
            <div>
              <dt>{f.dt.grievance}</dt>
              <dd>
                {site.grievanceName}, {site.grievanceDesignation}
              </dd>
            </div>
            {site.gstin && (
              <div>
                <dt>{f.dt.gstin}</dt>
                <dd>{site.gstin}</dd>
              </div>
            )}
          </dl>
          <p className="foot-disclaimer">{site.disclaimer}</p>
        </div>
      </div>

      <div className="foot-bar">
        <div className="foot-wrap foot-bar-in">
          <p>{tf(f.rights, { year, brand: site.brand })}</p>
          <nav className="foot-policies" aria-label={f.policies}>
            <Link href="/privacy">{f.policy.privacy}</Link>
            <Link href="/terms">{f.policy.terms}</Link>
            <Link href="/shipping">{f.policy.shipping}</Link>
            <Link href="/returns">{f.policy.returns}</Link>
            <CookieSettingsLink />
          </nav>
          <p className="foot-credit">
            {f.designedBy}{" "}
            <a href={CREDIT.href} {...EXT}>
              {CREDIT.label}
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
