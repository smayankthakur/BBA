import Image from "next/image";
import Link from "next/link";
import Medallion from "./Medallion";
import { BUSINESS, CREDIT, FOOTER_DISCLAIMER, LINKS, PRICE } from "@/data/home";

const EXT = { target: "_blank", rel: "noopener noreferrer" } as const;

type FooterLink = { label: string; href: string; external?: boolean };

const COLUMNS: { title: string; links: FooterLink[] }[] = [
  {
    title: "Shop",
    links: [
      { label: "Find your bracelet", href: "/find-your-bracelet" },
      { label: "Shop by intention", href: "/bracelets" },
      { label: "3 in 1 bracelet", href: "/bracelets/3-in-1" },
      { label: "Gifts", href: "/gifts" },
    ],
  },
  {
    title: "Numerology",
    links: [
      { label: "Find your mulank", href: "/mulank" },
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
    ],
  },
];

const SOCIAL: FooterLink[] = [
  { label: "Instagram", href: LINKS.instagram, external: true },
  { label: "YouTube", href: LINKS.youtube, external: true },
  { label: "WhatsApp", href: LINKS.whatsapp, external: true },
];

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

export default function SiteFooter() {
  const year = new Date().getFullYear();

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
            <p className="ft-kicker">Read for your date of birth</p>
            <h2 id="ft-cta-title">Ask Ammit which crystal is yours</h2>
            <p className="ft-cta-text">A 60-second reading works out your numbers and the bracelet that suits them.</p>
          </div>
          <div className="ft-cta-actions">
            <Link className="btn btn-gold-dark" href="/find-your-bracelet">
              Order my bracelet
            </Link>
            <a className="btn btn-ghost-gold" href={LINKS.whatsapp} {...EXT}>
              Ask on WhatsApp
            </a>
          </div>
        </section>

        {/* Brand + links */}
        <div className="ft-grid">
          <div className="ft-brand">
            <Image src="/brand/wordmark.png" alt="Bracelet By Ammit" width={120} height={56} />
            <p className="ft-tagline">Wear the right crystals, not just any.</p>
            <p className="ft-promise">
              {PRICE} <span aria-hidden="true">·</span> read for your birth date <span aria-hidden="true">·</span> strung by
              hand
            </p>
            <ul className="ft-social" aria-label="Bracelet By Ammit elsewhere">
              {SOCIAL.map((s) => (
                <li key={s.label}>
                  <FLink l={s} />
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
        <p className="ft-disclaimer">{FOOTER_DISCLAIMER}</p>
      </div>

      <div className="ft-bar">
        <div className="ft-bar-inner">
          <p>© {year} Bracelet By Ammit. All rights reserved.</p>
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
