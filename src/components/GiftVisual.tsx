import Image from "next/image";
import RefNote from "./RefNote";
import type { Product } from "@/lib/catalog-types";

/** First photo of a gift, otherwise the bead-ring illustration. */
export default function GiftVisual({
  gift,
  refNote,
  className = "arch",
  sizes = "(max-width: 760px) 80vw, 320px",
  priority = false,
}: {
  gift: Product;
  refNote: string;
  className?: string;
  sizes?: string;
  priority?: boolean;
}) {
  const photo = gift.photos[0];
  const v = gift.visual;
  const beads = v.beads ?? v.rings[0];
  if (photo) {
    return (
      <div className={`${className} has-photo`}>
        <Image src={photo} alt={gift.photoAlt || gift.title} fill sizes={sizes} className="gift-photo" priority={priority} />
        <RefNote text={refNote} />
      </div>
    );
  }
  return (
    <div role="img" aria-label={`Illustration of the ${gift.title} bracelet`} className={className} style={{ backgroundImage: v.gradient ?? v.cards[0] }}>
      <span
        className="gift-ring"
        style={{
          backgroundImage: `repeating-conic-gradient(${beads[0]} 0 15deg,${beads[1]} 15deg 30deg,${beads[2]} 30deg 45deg)`,
        }}
      />
    </div>
  );
}
