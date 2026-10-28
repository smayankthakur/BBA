import Link from "./LocaleLink";
import Sphere from "./Sphere";
import type { Product } from "@/lib/catalog-types";
import { formatINR } from "@/lib/format";

/** viewLabel: "View bracelet →" in the page language (server pages pass ui.common.viewBracelet). */
export default function BraceletCard({ b, viewLabel = "View bracelet →" }: { b: Product; viewLabel?: string }) {
  return (
    <Link href={`/bracelets/${b.slug}`} className="b-card">
      <Sphere color={b.visual.sphere} shade={b.visual.sphereShade} gloss={b.visual.sphereGloss} size={64} />
      <span className="b-card-title">{b.title}</span>
      <span className="b-card-blurb">{b.blurb}</span>
      <span className="b-card-foot">
        <span className="b-card-price">{formatINR(b.priceInr)}</span>
        <span className="b-card-go" aria-hidden="true">
          {viewLabel}
        </span>
      </span>
    </Link>
  );
}
