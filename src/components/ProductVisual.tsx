import type { CSSProperties } from "react";

type Triplet = [string, string, string];

const ring = ([a, b, c]: Triplet): CSSProperties => ({
  backgroundImage: `repeating-conic-gradient(${a} 0 15deg,${b} 15deg 30deg,${c} 30deg 45deg)`,
});

/**
 * Static fan of three arched cards with bead rings — the product "photo"
 * until real photography arrives.
 */
export default function ProductVisual({
  cards,
  rings,
  label,
}: {
  cards: [string, string, string];
  rings: [Triplet, Triplet, Triplet];
  label: string;
}) {
  return (
    <div className="pv" role="img" aria-label={label}>
      <span className="pv-card pv-c1" style={{ backgroundImage: cards[0] }}>
        <span className="pv-ring" style={ring(rings[0])} />
      </span>
      <span className="pv-card pv-c3" style={{ backgroundImage: cards[1] }}>
        <span className="pv-ring" style={ring(rings[1])} />
      </span>
      <span className="pv-card pv-c2" style={{ backgroundImage: cards[2] }}>
        <span className="pv-ring" style={ring(rings[2])} />
      </span>
    </div>
  );
}
