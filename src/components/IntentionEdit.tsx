import type { CSSProperties } from "react";
import Image from "next/image";
import type { Product } from "@/lib/catalog-types";
import { getBracelets, lowestPrice } from "@/lib/server/catalog";
import { formatINR, getContent, getSite } from "@/lib/server/content";
import { fill } from "@/lib/content/render";
import RefNote from "./RefNote";
import { getUI } from "@/lib/server/lang";
import EditCycler from "./EditCycler";
import OrderLink from "./order/OrderLink";

const ringStyle = ([a, b, c]: [string, string, string]): CSSProperties => ({
  backgroundImage: `repeating-conic-gradient(${a} 0 20deg,${b} 20deg 40deg,${c} 40deg 60deg)`,
});

const sphereStyle = ({ visual: it }: Product): CSSProperties => ({
  backgroundColor: it.sphere,
  backgroundImage: `radial-gradient(circle at 30% 30%,rgba(255,255,255,${it.sphereGloss ?? 0.95}) 0 6%,rgba(255,255,255,0) 30%),radial-gradient(circle,rgba(0,0,0,0) 40%,${it.sphereShade} 100%)`,
});

/**
 * Hover fan of three photo cards. Cards are rendered in the order 1, 3, 2
 * so the middle card (c2) sits on top, matching the design.
 * Bead-ring illustrations until product photos arrive; add <Image className="ph-img" …/> per card.
 */
function PhotoStack({ it, refNote }: { it: Product; refNote: string }) {
  const photos = it.photos;
  const order = [
    { cls: "c1", i: 0 },
    { cls: "c3", i: 1 },
    { cls: "c2", i: 2 },
  ];
  return (
    <span className="stack" aria-hidden="true">
      {order.map(({ cls, i }) => (
        <span key={cls} className={`pc ${cls}`} style={{ backgroundImage: it.visual.cards[i] }}>
          {photos.length ? (
            <>
              <Image src={photos[[1, 2, 0][i]] ?? photos[0]} alt="" fill sizes="150px" className="ph-img" />
              <RefNote text={refNote} className="is-small" />
            </>
          ) : (
            <span className="ring" style={ringStyle(it.visual.rings[i])} />
          )}
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
          <OrderLink key={it.slug} slug={it.slug} className="row" href={`/bracelets/${it.slug}`} aria-label={`${it.title}, ${formatINR(it.priceInr)}`} aria-haspopup="dialog">
            <PhotoStack it={it} refNote={s.refNote} />
            <span className="sphere" aria-hidden="true" style={sphereStyle(it)} />
            <span className="row-title">{it.title}</span>
            <span className="muted">{it.blurb}</span>
            <span className="price">{formatINR(it.priceInr)}</span>
            <span className="go">{ui.common.choose}</span>
          </OrderLink>
        ))}
      </div>
      <EditCycler targetId="edit" />
    </section>
  );
}
