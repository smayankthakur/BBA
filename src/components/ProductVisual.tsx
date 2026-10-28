import Image from "next/image";
import RefNote from "./RefNote";

type Triplet = [string, string, string];

/**
 * Fan of three arched photo cards (public/products/<slug>/1-3.jpg, or the
 * photos chosen in the admin panel). With fewer than three photos the
 * available ones repeat; with none, the brand emblem is shown.
 */
export default function ProductVisual({
  label,
  photosLabel,
  photos = [],
  refNote = "",
}: {
  cards?: [string, string, string];
  rings?: [Triplet, Triplet, Triplet];
  /** Accessible name when there are no photos, and for the photos */
  label: string;
  photosLabel?: string;
  photos?: string[];
  refNote?: string;
}) {
  if (!photos.length)
    return (
      <div className="pv is-empty" role="img" aria-label={label}>
        <span className="pv-card pv-c2">
          <Image src="/brand/emblem.png" alt="" width={140} height={155} className="pv-emblem" />
        </span>
      </div>
    );
  // Card order on screen: left (c1), right (c3), front (c2). Photo 1 goes in front.
  const at = (n: number) => photos[n % photos.length];
  const slots = [
    { cls: "pv-c1", photo: at(1) },
    { cls: "pv-c3", photo: at(2) },
    { cls: "pv-c2", photo: at(0) },
  ];
  return (
    <div className="pv" role="img" aria-label={photosLabel ?? label}>
      {slots.map((s) => (
        <span key={s.cls} className={`pv-card ${s.cls}`}>
          <Image src={s.photo} alt="" fill sizes="260px" className="pv-photo" />
          <RefNote text={refNote} />
        </span>
      ))}
    </div>
  );
}
