import type { CSSProperties } from "react";
import { INTENTIONS, type Intention } from "@/data/home";

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
 * Swap the [Photo n] placeholders for <Image className="ph-img" …/> later.
 */
function PhotoStack({ it }: { it: Intention }) {
  const order = [
    { cls: "c1", label: "[Photo 1]", i: 0 },
    { cls: "c3", label: "[Photo 3]", i: 1 },
    { cls: "c2", label: "[Photo 2]", i: 2 },
  ];
  return (
    <span className="stack" aria-hidden="true">
      {order.map(({ cls, label, i }) => (
        <span key={cls} className={`pc ${cls}`} style={{ backgroundImage: it.cards[i] }}>
          <span className="ring" style={ringStyle(it.rings[i])} />
          <span className="ph">{label}</span>
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
        <p>Six bracelets, six purposes. Hover to see each one, then choose.</p>
      </div>
      <div className="edit-list">
        {INTENTIONS.map((it) => (
          <a key={it.slug} className="row" href={it.href}>
            <PhotoStack it={it} />
            <span className="sphere" aria-hidden="true" style={sphereStyle(it)} />
            <span className="row-title">{it.title}</span>
            <span className="muted">{it.blurb}</span>
            <span className="price">{it.price}</span>
            <span className="go">Choose</span>
          </a>
        ))}
      </div>
    </section>
  );
}
