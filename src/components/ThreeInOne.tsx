import Image from "next/image";
import Link from "next/link";
import RefNote from "./RefNote";
import { getCombo } from "@/lib/server/catalog";
import { formatINR, getContent, getSite } from "@/lib/server/content";

export default async function ThreeInOne() {
  const [combo, c, { s }] = await Promise.all([getCombo(), getContent("home"), getSite()]);
  if (!combo) return null;
  const photo = combo.photos[0];
  const stones = c.threeStones;

  return (
    <section id="three-in-one" className="three">
      <div className="three-inner">
        {photo ? (
          <figure className="three-visual">
            <div className="three-frame">
              <Image src={photo} alt={combo.photoAlt || `${combo.title} crystal bracelet`} fill sizes="(max-width: 760px) 80vw, 380px" className="three-photo" />
              <RefNote text={s.refNote} />
            </div>
            {stones.length > 0 && (
              <figcaption>
                <ul className="three-stones">
                  {stones.map((st, i) => (
                    <li key={i}>
                      <span className="three-dot" style={{ backgroundColor: st.color }} aria-hidden="true" />
                      <span className="three-stone-name">{st.name}</span>
                      <span className="three-stone-for">{st.for}</span>
                    </li>
                  ))}
                </ul>
              </figcaption>
            )}
          </figure>
        ) : (
          <div aria-hidden="true" className="three-rings">
            {stones.slice(0, 3).map((st, i) => (
              <span key={i} style={{ boxShadow: `inset 0 0 0 12px ${st.color},0 0 0 1px rgba(212,175,90,.6)` }} />
            ))}
          </div>
        )}
        <div className="three-copy">
          <h2 className="h2">{c.threeTitle}</h2>
          <p>{c.threeText}</p>
          <p className="three-price">{formatINR(combo.priceInr)}</p>
          <div className="three-actions">
            <Link className="btn btn-gold" href={`/find-your-bracelet?intention=${combo.slug}`}>
              {c.threeButton}
            </Link>
            <Link className="three-more" href={`/bracelets/${combo.slug}`}>
              {c.threeLink}
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
