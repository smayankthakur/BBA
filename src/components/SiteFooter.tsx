import Image from "next/image";
import Link from "next/link";
import { BUSINESS, CREDIT, FOOTER_DISCLAIMER, LINKS, PRICE } from "@/data/home";

const EXT = { target: "_blank", rel: "noopener noreferrer" } as const;

const COLUMNS: { title: string; links: { label: string; href: string; external?: boolean }[] }[] = [
  {
    title: "Shop",
    links: [
      { label: "Find your bracelet", href: "/find-your-bracelet" },
      { label: "Shop by intention", href: "/bracelets" },
      { label: "Find your number", href: "/mulank" },
      { label: "3 in 1 bracelet", href: "/bracelets/3-in-1" },
      { label: "Gifts", href: "/gifts" },
    ],
  },
  {
    title: "Ammit",
    links: [
      { label: "About Ammit", href: "/about-ammit" },
      { label: "Book a consultation", href: "/consultation" },
      { label: "Watch on YouTube", href: LINKS.youtube, external: true },
      { label: "Follow on Instagram", href: LINKS.instagram, external: true },
    ],
  },
  {
    title: "Help",
    links: [
      { label: "Bracelet care", href: "/bracelet-care" },
      { label: "If your bracelet breaks", href: "/bracelet-care" },
      { label: "Customer reviews", href: "/reviews" },
      { label: "Order on WhatsApp", href: LINKS.whatsapp, external: true },
    ],
  },
];

// Bead strand divider — same palette as the intention spheres.
const STRAND = ["#F2A7A0", "#1C1C26", "#7A3FC0", "#2E9E4F", "#D96B86", "#E7B32A", "#050E8F"];

/** Original geometric mandala: concentric rings, 16 petals, 32 dots. */
function Mandala() {
  const petals = Array.from({ length: 16 }, (_, i) => i * 22.5);
  const dots = Array.from({ length: 32 }, (_, i) => i * 11.25);
  return (
    <svg className="footer-mandala" viewBox="0 0 400 400" aria-hidden="true" focusable="false">
      <g fill="none" stroke="currentColor" strokeWidth="0.8">
        <circle cx="200" cy="200" r="196" />
        <circle cx="200" cy="200" r="184" strokeDasharray="2 6" />
        <circle cx="200" cy="200" r="150" />
        <circle cx="200" cy="200" r="96" />
        <circle cx="200" cy="200" r="58" />
        {petals.map((a) => (
          <g key={a} transform={`rotate(${a} 200 200)`}>
            <path d="M200 50 C 222 80, 222 120, 200 146 C 178 120, 178 80, 200 50 Z" />
            <path d="M200 104 C 210 118, 210 132, 200 142 C 190 132, 190 118, 200 104 Z" />
          </g>
        ))}
      </g>
      <g fill="currentColor">
        {dots.map((a) => (
          <circle key={a} cx="200" cy="34" r="2.2" transform={`rotate(${a} 200 200)`} />
        ))}
      </g>
    </svg>
  );
}

function Strand() {
  return (
    <div className="footer-strand" aria-hidden="true">
      <span className="strand-line" />
      {STRAND.map((c, i) => (
        <span key={c} className="strand-unit">
          {i > 0 && <span className="strand-spacer" />}
          <span className="strand-bead" style={{ backgroundColor: c }} />
        </span>
      ))}
      <span className="strand-line" />
    </div>
  );
}

export default function SiteFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="footer">
      <div className="footer-jaali" aria-hidden="true" />

      <div className="footer-inner">
        {/* Call to action under a slowly turning mandala */}
        <div className="footer-cta">
          <Mandala />
          <p className="footer-kicker">
            <span aria-hidden="true">◆</span> Read for your date of birth <span aria-hidden="true">◆</span>
          </p>
          <h2>Ask Ammit which crystal is yours</h2>
          <p className="footer-cta-text">
            Send your date of birth on WhatsApp and Ammit will suggest the crystals that suit your numbers.
          </p>
          <div className="footer-cta-actions">
            <a className="btn btn-gold-dark" href={LINKS.whatsapp} {...EXT}>
              Message on WhatsApp
            </a>
            <a className="btn btn-ghost-gold" href={LINKS.youtube} {...EXT}>
              Watch Ammit on YouTube
            </a>
          </div>
        </div>

        <Strand />

        {/* Brand + link columns */}
        <div className="footer-grid">
          <div className="footer-brand">
            <Image src="/brand/wordmark.png" alt="Bracelet By Ammit" width={140} height={65} />
            <p className="footer-tagline">Wear the right crystals, not just any.</p>
            <p className="footer-promise">
              Every bracelet {PRICE} · Read for your birth date · Strung by hand
            </p>
          </div>

          {COLUMNS.map((col) => (
            <nav key={col.title} className="footer-col" aria-label={`Footer: ${col.title}`}>
              <h3>
                <span aria-hidden="true">◆</span> {col.title}
              </h3>
              <ul>
                {col.links.map((l) => (
                  <li key={l.label}>
                    {l.external ? (
                      <a href={l.href} {...EXT}>
                        {l.label}
                      </a>
                    ) : (
                      <Link href={l.href}>{l.label}</Link>
                    )}
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        {/* Business details (Consumer Protection (E-Commerce) Rules) */}
        <dl className="footer-business" aria-label="Business details">
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
              <a href={LINKS.whatsapp} {...EXT}>WhatsApp</a>
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

        <p className="footer-disclaimer">{FOOTER_DISCLAIMER}</p>
      </div>

      {/* Bottom bar */}
      <div className="footer-bar">
        <div className="footer-bar-inner">
          <p>© {year} Bracelet By Ammit. All rights reserved.</p>
          <p className="footer-credit">
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
