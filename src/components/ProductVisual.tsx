import type { CSSProperties } from "react";
import Image from "next/image";
import RefNote from "./RefNote";

type Triplet = [string, string, string];

const ring = ([a, b, c]: Triplet): CSSProperties => ({
  backgroundImage: `repeating-conic-gradient(${a} 0 15deg,${b} 15deg 30deg,${c} 30deg 45deg)`,
});

/**
 * Fan of three arched cards. Shows real product photos when they exist
 * (public/products/<slug>/1-3.jpg), otherwise bead-ring illustrations.
 */
export default function ProductVisual({
  cards,
  rings,
  label,
  photos = [],
  refNote = "",
}: {
  cards: [string, string, string];
  rings: [Triplet, Triplet, Triplet];
  label: string;
  photos?: string[];
  refNote?: string;
}) {
  // Card order on screen: left (c1), right (c3), front (c2). Photo 1 goes in front.
  const slots = [
    { cls: "pv-c1", i: 0, photo: photos[1] },
    { cls: "pv-c3", i: 1, photo: photos[2] },
    { cls: "pv-c2", i: 2, photo: photos[0] },
  ];
  return (
    <div className="pv" role="img" aria-label={photos.length ? label.replace("Illustration of", "Photos of") : label}>
      {slots.map((s) => (
        <span key={s.cls} className={`pv-card ${s.cls}`} style={{ backgroundImage: cards[s.i] }}>
          {s.photo ? (
            <>
              <Image src={s.photo} alt="" fill sizes="260px" className="pv-photo" />
              <RefNote text={refNote} />
            </>
          ) : (
            <span className="pv-ring" style={ring(rings[s.i])} />
          )}
        </span>
      ))}
    </div>
  );
}
