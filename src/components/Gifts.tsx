import { getUI } from "@/lib/server/lang";
import { tf } from "@/lib/i18n/ui";
import Link from "./LocaleLink";
import GiftVisual from "@/components/GiftVisual";
import { getGifts } from "@/lib/server/catalog";
import { getContent, getSite } from "@/lib/server/content";

export default async function Gifts() {
  const [gifts, c, { s }] = await Promise.all([getGifts(), getContent("home"), getSite()]);
  if (!gifts.length) return null;
  const ui = getUI();
  return (
    <section id="gifts" className="section-wide gifts">
      <div className="gifts-head">
        <h2 className="h2">{c.giftsTitle}</h2>
        <p>{c.giftsLede}</p>
      </div>
      <div className="gifts-grid">
        {gifts.map((g) => (
          <Link key={g.slug} href={`/gifts/${g.slug}`} className="gift">
            <GiftVisual gift={g} refNote={s.refNote} label={tf(ui.common.illustrationOf, { title: g.title })} className="arch" />
            <span className="gift-title">{g.title}</span>
            <span className="gift-blurb">{g.blurb}</span>
          </Link>
        ))}
      </div>
    </section>
  );
}
