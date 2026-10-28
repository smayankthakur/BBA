import type { CSSProperties } from "react";
import Image from "next/image";
import type { Product } from "@/lib/catalog-types";
import { getBracelets, lowestPrice } from "@/lib/server/catalog";
import { formatINR, getContent, getSite } from "@/lib/server/content";
import { fill } from "@/lib/content/render";
import RefNote from "./RefNote";
import { getUI } from "@/lib/server/lang";
import EditCycler from "./EditCycler";
import Link from "./LocaleLink";

const sphereStyle = ({ visual: it }: Product): CSSProperties => ({
  backgroundColor: it.sphere,
  backgroundImage: `radial-gradient(circle at 30% 30%,rgba(255,255,255,${it.sphereGloss ?? 0.95}) 0 6%,rgba(255,255,255,0) 30%),radial-gradient(circle,rgba(0,0,0,0) 40%,${it.sphereShade} 100%)`,
});

/**
 * Hover fan of three photo cards. Cards are rendered in the order 1, 3, 2
 * so the middle card (c2) sits on top, matching the design. With fewer than
 * three photos they repeat; with none, no fan is shown.
 */
function PhotoStack({ it, refNote }: { it: Product; refNote: string }) {
  const photos = it.photos;
  if (!photos.length) return null;
  const at = (n: number) => photos[n % photos.length];
  const order = [
    { cls: "c1", photo: at(1) },
    { cls: "c3", photo: at(0) },
    { cls: "c2", photo: at(2) },
  ];
  return (
    <span className="stack" aria-hidden="true">
      {order.map(({ cls, photo }) => (
        <span key={cls} className={`pc ${cls}`}>
          <Image src={photo} alt="" fill sizes="150px" className="ph-img" />
          <RefNote text={refNote} className="is-small" />
        </span>
      ))}
      <span className="tag">{it.title}</span>
    </span>
  );
}

export default async function IntentionEdit() {
  const [all, c, { s, vars }, low] = await Promise.all([getBracelets(), getContent("home"), getSite(), lowestPrice()]);
  const list = all.filter((b) => b.inList);
  const ui = getUI();
  return (
    <section id="edit" className="section-wide edit">
      <div className="edit-head">
        <h2 className="h2">{c.editTitle}</h2>
        <p>
          {fill(c.editLede, { ...vars, price: formatINR(low) })} <span className="hint-hover">{c.editHintHover}</span>
          <span className="hint-touch">{c.editHintTouch}</span>
        </p>
      </div>
      <div className="edit-list">
        {list.map((it) => (
          <Link key={it.slug} className="row" href={`/bracelets/${it.slug}`} aria-label={`${it.title}, ${formatINR(it.priceInr)}`}>
            <PhotoStack it={it} refNote={s.refNote} />
            <span className="sphere" aria-hidden="true" style={sphereStyle(it)} />
            <span className="row-title">{it.title}</span>
            <span className="muted">{it.blurb}</span>
            <span className="price">{formatINR(it.priceInr)}</span>
            <span className="go">{ui.common.choose}</span>
          </Link>
        ))}
      </div>
      <EditCycler targetId="edit" />
    </section>
  );
}
