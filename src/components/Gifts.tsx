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
          <a key={g.title} href={g.href} className="gift">
            {/* Replace the placeholder text with <Image fill className="ph-img" …/> once photos exist */}
            <div role="img" aria-label={g.alt} className="arch" style={{ backgroundImage: g.gradient }}>
              {g.placeholder}
            </div>
            <span className="gift-title">{g.title}</span>
          </a>
        ))}
      </div>
    </section>
  );
}
