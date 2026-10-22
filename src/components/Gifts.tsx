import Link from "next/link";
import { GIFTS } from "@/data/home";

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
            {/* Illustration until product photos arrive: swap for <Image fill …/> */}
            <div role="img" aria-label={g.alt} className="arch" style={{ backgroundImage: g.gradient }}>
              <span
                className="gift-ring"
                style={{
                  backgroundImage: `repeating-conic-gradient(${g.beads[0]} 0 15deg,${g.beads[1]} 15deg 30deg,${g.beads[2]} 30deg 45deg)`,
                }}
              />
            </div>
            <span className="gift-title">{g.title}</span>
            <span className="gift-blurb">{g.blurb}</span>
          </Link>
        ))}
      </div>
    </section>
  );
}
