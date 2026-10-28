import Image from "next/image";
import Link from "next/link";
import Medallion from "./Medallion";
import CookieSettingsLink from "./CookieSettingsLink";
import { CREDIT } from "@/data/home";
import { formatINR, getContent, getSite } from "@/lib/server/content";

const EXT = { target: "_blank", rel: "noopener noreferrer" } as const;

type FooterLink = { label: string; href: string; external?: boolean };

const COLUMNS: { title: string; links: FooterLink[] }[] = [
  {
    title: "Shop",
    links: [
      { label: "Find your bracelet", href: "/find-your-bracelet" },
      { label: "Shop by purpose", href: "/bracelets" },
      { label: "Gifts", href: "/gifts" },
    ],
  },
  {
    title: "Numerology",
    links: [
      { label: "Find your mulank", href: "/mulank" },
      { label: "Lo Shu grid calculator", href: "/numerology/lo-shu-grid" },
      { label: "Numerology guides", href: "/numerology" },
      { label: "Book a consultation", href: "/consultation" },
      { label: "About Ammit", href: "/about-ammit" },
    ],
  },
  {
    title: "Care",
    links: [
      { label: "Bracelet care", href: "/bracelet-care" },
      { label: "If it breaks", href: "/bracelet-care" },
      { label: "Customer reviews", href: "/reviews" },
      { label: "Size guide", href: "/size-guide" },
    ],
  },
];



/** Simple line icons for the social links (shown as round buttons on phones). */
function SocialIcon({ kind }: { kind: "ig" | "yt" | "wa" }) {
  const common = { width: 18, height: 18, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.6, "aria-hidden": true } as const;
  if (kind === "ig")
    return (
      <svg {...common}>
        <rect x="3.5" y="3.5" width="17" height="17" rx="5" />
        <circle cx="12" cy="12" r="4" />
        <circle cx="17.2" cy="6.8" r="0.9" fill="currentColor" stroke="none" />
      </svg>
    );
  if (kind === "yt")
    return (
      <svg {...common}>
        <rect x="2.5" y="5.5" width="19" height="13" rx="4" />
        <path d="M10 9.2v5.6l4.8-2.8z" fill="currentColor" stroke="none" />
      </svg>
    );
  return (
    <svg {...common}>
      <path d="M4.5 19.5l1.2-3.6A7.8 7.8 0 1 1 8.6 18.6z" strokeLinejoin="round" />
      <path d="M9.3 8.6c.2-.5.6-.6.9-.6h.4c.2 0 .4.1.5.4l.6 1.4c.1.2 0 .4-.1.6l-.5.6c.4.9 1.2 1.7 2.1 2.1l.6-.5c.2-.1.4-.2.6-.1l1.4.6c.3.1.4.3.4.5v.4c0 .3-.1.7-.6.9-1.6.7-6.5-2.8-6.3-6.3z" fill="currentColor" stroke="none" />
    </svg>
  );
}

function FLink({ l, className }: { l: FooterLink; className?: string }) {
  return l.external ? (
    <a href={l.href} className={className} {...EXT}>
      {l.label}
    </a>
  ) : (
    <Link href={l.href} className={className}>
      {l.label}
    </Link>
  );
}

/** Small lotus rosette (original geometric motif) used as a watermark. */
function Rosette() {
  const petals = Array.from({ length: 12 }, (_, i) => i * 30);
  return (
    <svg className="ft-rosette" viewBox="0 0 200 200" aria-hidden="true" focusable="false">
      <g fill="none" stroke="currentColor" strokeWidth="0.9">
        <circle cx="100" cy="100" r="96" />
        <circle cx="100" cy="100" r="88" strokeDasharray="1.5 5" />
        <circle cx="100" cy="100" r="30" />
        {petals.map((a) => (
          <path key={a} transform={`rotate(${a} 100 100)`} d="M100 18 C 116 42, 116 64, 100 74 C 84 64, 84 42, 100 18 Z" />
        ))}
      </g>
    </svg>
  );
}

/** Thin gold rule with a diamond in the middle. */
function Rule() {
  return (
    <div className="ft-rule" aria-hidden="true">
      <span />
      <i />
      <span />
    </div>
  );
}

export default async function SiteFooter() {
  const year = new Date().getFullYear();
  const [{ s: site }, c] = await Promise.all([getSite(), getContent("shared")]);
  const LINKS = { instagram: site.instagram, youtube: site.youtube, whatsapp: site.whatsapp };
  const BUSINESS = {
    brand: site.brand,
    legalName: site.legalName,
    founder: site.founder,
    address: site.address,
    email: site.email,
    phone: site.phone,
    gstin: site.gstin,
    grievanceOfficer: { name: site.grievanceName, designation: site.grievanceDesignation },
  };
  const PRICE = formatINR(site.defaultPrice);
  const SOCIAL: (FooterLink & { icon: "ig" | "yt" | "wa" })[] = [
  { label: "Instagram", href: LINKS.instagram, external: true, icon: "ig" },
  { label: "YouTube", href: LINKS.youtube, external: true, icon: "yt" },
  { label: "WhatsApp", href: LINKS.whatsapp, external: true, icon: "wa" },
];


  return (
    <footer className="ft">
      {/* Zari-style woven border */}
      <div className="ft-zari" aria-hidden="true" />

      <div className="ft-inner">
        {/* Framed call to action with the BBA crest */}
        <section className="ft-cta" aria-labelledby="ft-cta-title">
          <Medallion width={34} height={38} className="ft-crest" />
          <Rosette />
          <div className="ft-cta-copy">
            <p className="ft-kicker">{c.footerKicker}</p>
            <h2 id="ft-cta-title">{c.footerTitle}</h2>
            <p className="ft-cta-text">{c.footerText}</p>
          </div>
          <div className="ft-cta-actions">
            <Link className="btn btn-gold-dark" href="/find-your-bracelet">
              {c.footerOrder}
            </Link>
            <a className="btn btn-ghost-gold ft-cta-wa" href={LINKS.whatsapp} {...EXT}>
              {c.footerWhatsapp}
            </a>
          </div>
        </section>

        {/* Brand + links */}
        <div className="ft-grid">
          <div className="ft-brand">
            <Image src="/brand/wordmark.png" alt="Bracelet By Ammit" width={120} height={56} />
            <p className="ft-tagline">{c.footerTagline}</p>
            <p className="ft-promise">
              {PRICE} <span aria-hidden="true">·</span> read for your birth date <span aria-hidden="true">·</span> strung by
              hand
            </p>
            <ul className="ft-social" aria-label="Bracelet By Ammit elsewhere">
              {SOCIAL.map((s) => (
                <li key={s.label}>
                  <a href={s.href} {...EXT} aria-label={s.label}>
                    <SocialIcon kind={s.icon} />
                    <span className="ft-social-label">{s.label}</span>
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {COLUMNS.map((col) => (
            <nav key={col.title} className="ft-col" aria-label={`Footer: ${col.title}`}>
              <h3>{col.title}</h3>
              <ul>
                {col.links.map((l) => (
                  <li key={l.label}>
                    <FLink l={l} />
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        {/* Phones: the three link groups fold into an accordion */}
        <div className="ft-acc">
          {COLUMNS.map((col) => (
            <details key={col.title} className="ft-acc-item">
              <summary>
                <span>{col.title}</span>
                <i aria-hidden="true" />
              </summary>
              <nav aria-label={`Footer: ${col.title}`}>
                <ul>
                  {col.links.map((l) => (
                    <li key={l.label}>
                      <FLink l={l} />
                    </li>
                  ))}
                </ul>
              </nav>
            </details>
          ))}
        </div>

        <Rule />

        {/* Business details (Consumer Protection (E-Commerce) Rules) */}
        <dl className="ft-biz" aria-label="Business details">
          <div>
            <dt>Business</dt>
            <dd>{BUSINESS.legalName || BUSINESS.brand}</dd>
          </div>
          <div>
            <dt>Founder</dt>
            <dd>{BUSINESS.founder}</dd>
          </div>
          {BUSINESS.address && (
            <div>
              <dt>Address</dt>
              <dd>{BUSINESS.address}</dd>
            </div>
          )}
          <div>
            <dt>Contact</dt>
            <dd>
              <a href={LINKS.whatsapp} {...EXT}>
                WhatsApp
              </a>
              {BUSINESS.email && (
                <>
                  {" · "}
                  <a href={`mailto:${BUSINESS.email}`}>{BUSINESS.email}</a>
                </>
              )}
              {BUSINESS.phone && (
                <>
                  {" · "}
                  <a href={`tel:${BUSINESS.phone.replace(/\s/g, "")}`}>{BUSINESS.phone}</a>
                </>
              )}
            </dd>
          </div>
          <div>
            <dt>Grievance officer</dt>
            <dd>
              {BUSINESS.grievanceOfficer.name}, {BUSINESS.grievanceOfficer.designation}
            </dd>
          </div>
          {BUSINESS.gstin && (
            <div>
              <dt>GSTIN</dt>
              <dd>{BUSINESS.gstin}</dd>
            </div>
          )}
        </dl>
        <p className="ft-disclaimer">{site.disclaimer}</p>
        <nav className="ft-policies" aria-label="Policies">
          <Link href="/privacy">Privacy</Link>
          <Link href="/terms">Terms</Link>
          <Link href="/shipping">Shipping</Link>
          <Link href="/returns">Returns &amp; restringing</Link>
          <CookieSettingsLink />
        </nav>
      </div>

      <div className="ft-bar">
        <div className="ft-bar-inner">
          <p>© {year} {site.brand}. All rights reserved.</p>
          <p className="ft-credit">
            Designed by{" "}
            <a href={CREDIT.href} {...EXT}>
              {CREDIT.label}
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
