import Link from "next/link";
import Sphere from "./Sphere";
import type { Product } from "@/lib/catalog-types";
import { formatINR } from "@/lib/format";

export default function BraceletCard({ b }: { b: Product }) {
  return (
    <Link href={`/bracelets/${b.slug}`} className="b-card">
      <Sphere color={b.visual.sphere} shade={b.visual.sphereShade} gloss={b.visual.sphereGloss} size={64} />
      <span className="b-card-title">{b.title}</span>
      <span className="b-card-blurb">{b.blurb}</span>
      <span className="b-card-foot">
        <span className="b-card-price">{formatINR(b.priceInr)}</span>
        <span className="b-card-go" aria-hidden="true">
          View bracelet →
        </span>
      </span>
    </Link>
  );
}
