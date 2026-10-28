import Link from "next/link";
import InstagramReel from "./InstagramReel";
import { getContent, getSite } from "@/lib/server/content";

/** Homepage: why every bracelet is made for one person, with Ammit's reel. */
export default async function MadeForYou() {
  const [c, { s }] = await Promise.all([getContent("home"), getSite()]);
  return (
    <section id="made-for-you" className="three made" aria-labelledby="made-title">
      <div className="three-inner">
        <div className="made-media">
          <InstagramReel url={s.reelUrl} title={c.madeReelTitle} note={c.madeReelNote} />
        </div>
        <div className="three-copy">
          <h2 id="made-title" className="h2">
            {c.madeTitle}
          </h2>
          <p>{c.madeText}</p>
          <ul className="made-points">
            {c.madePoints.map((x, i) => (
              <li key={i}>{x}</li>
            ))}
          </ul>
          {c.madeNote && <p className="made-note">{c.madeNote}</p>}
          <div className="three-actions">
            <Link className="btn btn-gold" href="/find-your-bracelet">
              {c.madeButton}
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
