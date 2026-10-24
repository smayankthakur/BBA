import fs from "node:fs";
import path from "node:path";
import Image from "next/image";
import { GIFTS } from "@/data/home";

type Gift = (typeof GIFTS)[number];

/** Photo at public/products/gifts/<slug>.jpg if present, otherwise the bead-ring illustration. */
function giftPhoto(slug: string): string | null {
  for (const ext of ["jpg", "jpeg", "webp", "png"]) {
    const rel = `/products/gifts/${slug}.${ext}`;
    if (fs.existsSync(path.join(process.cwd(), "public", rel))) return rel;
  }
  return null;
}

export default function GiftVisual({
  gift,
  className = "arch",
  sizes = "(max-width: 760px) 80vw, 320px",
  priority = false,
}: {
  gift: Gift;
  className?: string;
  sizes?: string;
  priority?: boolean;
}) {
  const photo = giftPhoto(gift.slug);
  if (photo) {
    return (
      <div className={`${className} has-photo`}>
        <Image src={photo} alt={gift.photoAlt} fill sizes={sizes} className="gift-photo" priority={priority} />
      </div>
    );
  }
  return (
    <div role="img" aria-label={gift.alt} className={className} style={{ backgroundImage: gift.gradient }}>
      <span
        className="gift-ring"
        style={{
          backgroundImage: `repeating-conic-gradient(${gift.beads[0]} 0 15deg,${gift.beads[1]} 15deg 30deg,${gift.beads[2]} 30deg 45deg)`,
        }}
      />
    </div>
  );
}
