import Link from "next/link";
import Medallion from "./Medallion";
import { LINKS } from "@/data/home";

export default function SiteHeader({ bagCount = 0 }: { bagCount?: number }) {
  return (
    <header className="header">
      <nav aria-label="Shop" className="header-nav">
        <a className="navlink" href="#edit">Intentions</a>
        <a className="navlink" href="#number">By number</a>
        <a className="navlink" href="#gifts">Gifts</a>
      </nav>

      <Link href="/" aria-label="Bracelet By Ammit home" className="brand">
        <Medallion width={38} height={42} priority />
        <span className="brand-name">Bracelet By Ammit</span>
      </Link>

      <div className="header-nav right">
        <a className="navlink" href="#note">Ammit</a>
        <a className="navlink" href={LINKS.consultation}>Consultation</a>
        <a className="navlink" href={LINKS.bag} aria-label={`Bag, ${bagCount} items`}>
          Bag ({bagCount})
        </a>
      </div>
    </header>
  );
}
