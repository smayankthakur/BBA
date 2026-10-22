import Link from "next/link";
import Sphere from "./Sphere";
import { PRICE } from "@/data/home";
import type { BraceletDetail } from "@/data/pages";

export default function BraceletCard({ b }: { b: BraceletDetail }) {
  return (
    <Link href={`/bracelets/${b.slug}`} className="b-card">
      <Sphere color={b.sphere} shade={b.sphereShade} gloss={b.sphereGloss} size={64} />
      <span className="b-card-title">{b.title}</span>
      <span className="b-card-blurb">{b.blurb}</span>
      <span className="b-card-foot">
        <span className="b-card-price">{PRICE}</span>
        <span className="b-card-go" aria-hidden="true">
          View bracelet →
        </span>
      </span>
    </Link>
  );
}
