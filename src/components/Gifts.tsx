import Link from "next/link";
import { GIFTS } from "@/data/home";
import GiftVisual from "@/components/GiftVisual";

export default function Gifts() {
  return (
    <section id="gifts" className="section-wide gifts">
      <div className="gifts-head">
        <h2 className="h2">Gifts that mean something</h2>
        <p>Send their birth date and we&apos;ll make it for them, not just for the occasion.</p>
      </div>
      <div className="gifts-grid">
        {GIFTS.map((g) => (
          <Link key={g.slug} href={`/gifts/${g.slug}`} className="gift">
                        <GiftVisual gift={g} className="arch" />
            <span className="gift-title">{g.title}</span>
            <span className="gift-blurb">{g.blurb}</span>
          </Link>
        ))}
      </div>
    </section>
  );
}
