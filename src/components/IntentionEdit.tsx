import type { CSSProperties } from "react";
import Link from "next/link";
import Image from "next/image";
import { INTENTIONS, PRICE, type Intention } from "@/data/home";
import { productPhotos } from "@/lib/server/photos";
import RefNote from "./RefNote";
import EditCycler from "./EditCycler";

const ringStyle = ([a, b, c]: [string, string, string]): CSSProperties => ({
  backgroundImage: `repeating-conic-gradient(${a} 0 20deg,${b} 20deg 40deg,${c} 40deg 60deg)`,
});

const sphereStyle = (it: Intention): CSSProperties => ({
  backgroundColor: it.sphere,
  backgroundImage: `radial-gradient(circle at 30% 30%,rgba(255,255,255,${it.sphereGloss ?? 0.95}) 0 6%,rgba(255,255,255,0) 30%),radial-gradient(circle,rgba(0,0,0,0) 40%,${it.sphereShade} 100%)`,
});

/**
 * Hover fan of three photo cards. Cards are rendered in the order 1, 3, 2
 * so the middle card (c2) sits on top, matching the design.
 * Bead-ring illustrations until product photos arrive; add <Image className="ph-img" …/> per card.
 */
function PhotoStack({ it }: { it: Intention }) {
  const photos = productPhotos(it.slug);
  const order = [
    { cls: "c1", i: 0 },
    { cls: "c3", i: 1 },
    { cls: "c2", i: 2 },
  ];
  return (
    <span className="stack" aria-hidden="true">
      {order.map(({ cls, i }) => (
        <span key={cls} className={`pc ${cls}`} style={{ backgroundImage: it.cards[i] }}>
          {photos.length ? (
            <>
              <Image src={photos[[1, 2, 0][i]] ?? photos[0]} alt="" fill sizes="150px" className="ph-img" />
              <RefNote className="is-small" />
            </>
          ) : (
            <span className="ring" style={ringStyle(it.rings[i])} />
          )}
        </span>
      ))}
      <span className="tag">{it.title}</span>
    </span>
  );
}

export default function IntentionEdit() {
  return (
    <section id="edit" className="section-wide edit">
      <div className="edit-head">
        <h2 className="h2">The intention edit</h2>
        <p>
          Six bracelets, six purposes, each {PRICE}. <span className="hint-hover">Hover to see each one, then choose.</span>
          <span className="hint-touch">Tap one to choose.</span>
        </p>
      </div>
      <div className="edit-list">
        {INTENTIONS.map((it) => (
          <Link key={it.slug} className="row" href={`/bracelets/${it.slug}`} aria-label={`${it.title}, ${it.price}`}>
            <PhotoStack it={it} />
            <span className="sphere" aria-hidden="true" style={sphereStyle(it)} />
            <span className="row-title">{it.title}</span>
            <span className="muted">{it.blurb}</span>
            <span className="price">{it.price}</span>
            <span className="go">Choose</span>
          </Link>
        ))}
      </div>
      <EditCycler targetId="edit" />
    </section>
  );
}
