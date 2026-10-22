import Link from "next/link";
import { PRICE, THREE_IN_ONE_RINGS } from "@/data/home";

export default function ThreeInOne() {
  return (
    <section id="three-in-one" className="three">
      <div className="three-inner">
        <div aria-hidden="true" className="three-rings">
          {THREE_IN_ONE_RINGS.map((c) => (
            <span key={c} style={{ boxShadow: `inset 0 0 0 12px ${c},0 0 0 1px rgba(212,175,90,.6)` }} />
          ))}
        </div>
        <div className="three-copy">
          <h2 className="h2">Three intentions, one bracelet</h2>
          <p>
            The 3 in 1 combines love, protection and prosperity on a single strand, balanced for your
            numbers so the crystals work together.
          </p>
          <p className="three-price">{PRICE}</p>
          <div>
            <Link className="btn btn-gold" href="/bracelets/3-in-1">
              Build my 3 in 1
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
