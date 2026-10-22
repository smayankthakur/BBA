import Image from "next/image";
import { BUSINESS, FOOTER_DISCLAIMER, LINKS } from "@/data/home";

export default function SiteFooter() {
  return (
    <footer className="footer">
      <div className="footer-inner">
        <div className="footer-cta">
          <h2>Ask Ammit which crystal is yours</h2>
          <a className="btn btn-gold-dark" href={LINKS.whatsapp} target="_blank" rel="noopener noreferrer">
            Message on WhatsApp
          </a>
        </div>
        <div className="footer-base">
          <div className="footer-brand">
            <Image src="/brand/wordmark.png" alt="BBA" width={108} height={50} />
            <span>Wear the right crystals, not just any.</span>
          </div>
          <nav aria-label="Footer" className="footer-nav">
            <a href={LINKS.instagram} target="_blank" rel="noopener noreferrer">Instagram</a>
            <a href={LINKS.youtube} target="_blank" rel="noopener noreferrer">YouTube</a>
            <a href={LINKS.whatsapp} target="_blank" rel="noopener noreferrer">WhatsApp</a>
          </nav>
        </div>
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
              <a href={LINKS.whatsapp} target="_blank" rel="noopener noreferrer">WhatsApp</a>
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
              {BUSINESS.grievanceOfficer.name}, {BUSINESS.grievanceOfficer.designation} (via{" "}
              <a href={LINKS.whatsapp} target="_blank" rel="noopener noreferrer">WhatsApp</a>
              {BUSINESS.email && <> or {BUSINESS.email}</>})
            </dd>
          </div>
          {BUSINESS.gstin && (
            <div>
              <dt>GSTIN</dt>
              <dd>{BUSINESS.gstin}</dd>
            </div>
          )}
        </dl>
        <div className="footer-legal">
          <p>{FOOTER_DISCLAIMER}</p>
          <p>© {new Date().getFullYear()} Bracelet By Ammit</p>
        </div>
      </div>
    </footer>
  );
}
