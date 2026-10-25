import Image from "next/image";
import Link from "next/link";
import { PRICE, THREE_IN_ONE_RINGS } from "@/data/home";
import { productPhotos } from "@/lib/server/photos";
import RefNote from "./RefNote";

const STONES = [
  { name: "Rose quartz", for: "Love", color: THREE_IN_ONE_RINGS[0] },
  { name: "Black tourmaline", for: "Protection", color: THREE_IN_ONE_RINGS[1] },
  { name: "Citrine", for: "Prosperity", color: THREE_IN_ONE_RINGS[2] },
] as const;

export default function ThreeInOne() {
  const photos = productPhotos("3-in-1");
  const photo = photos[1] ?? photos[0];

  return (
    <section id="three-in-one" className="three">
      <div className="three-inner">
        {photo ? (
          <figure className="three-visual">
            <div className="three-frame">
              <Image
                src={photo}
                alt="3 in 1 crystal bracelet with rose quartz, dark protective stones and warm golden beads"
                fill
                sizes="(max-width: 760px) 80vw, 380px"
                className="three-photo"
              />
              <RefNote />
            </div>
            <figcaption>
              <ul className="three-stones">
                {STONES.map((s) => (
                  <li key={s.name}>
                    <span className="three-dot" style={{ backgroundColor: s.color }} aria-hidden="true" />
                    <span className="three-stone-name">{s.name}</span>
                    <span className="three-stone-for">{s.for}</span>
                  </li>
                ))}
              </ul>
            </figcaption>
          </figure>
        ) : (
          <div aria-hidden="true" className="three-rings">
            {THREE_IN_ONE_RINGS.map((c) => (
              <span key={c} style={{ boxShadow: `inset 0 0 0 12px ${c},0 0 0 1px rgba(212,175,90,.6)` }} />
            ))}
          </div>
        )}
        <div className="three-copy">
          <h2 className="h2">Three intentions, one bracelet</h2>
          <p>
            The 3 in 1 combines love, protection and prosperity on a single strand, balanced for your
            numbers so the crystals work together.
          </p>
          <p className="three-price">{PRICE}</p>
          <div className="three-actions">
            <Link className="btn btn-gold" href="/find-your-bracelet?intention=3-in-1">
              Build my 3 in 1
            </Link>
            <Link className="three-more" href="/bracelets/3-in-1">
              See the 3 in 1 →
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
