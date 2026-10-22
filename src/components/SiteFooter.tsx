import Image from "next/image";
import { FOOTER_DISCLAIMER, LINKS } from "@/data/home";

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
            <a href={LINKS.shipping}>Shipping and returns</a>
          </nav>
        </div>
        <div className="footer-legal">
          <p>{FOOTER_DISCLAIMER}</p>
          <p>© {new Date().getFullYear()} Bracelet By Ammit</p>
        </div>
      </div>
    </footer>
  );
}
