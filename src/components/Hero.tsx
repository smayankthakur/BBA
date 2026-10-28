import Image from "next/image";
import Link from "./LocaleLink";
import { HERO_BEADS } from "@/data/home";
import { getUI } from "@/lib/server/lang";
import { getContent } from "@/lib/server/content";

const RADIUS = 190; // px from centre to bead
const STEP = 15; // degrees between bead and spacer

export default async function Hero() {
  const c = await getContent("home");
  // 24 positions: gem at every 30°, gold spacer in between.
  const beads = Array.from({ length: 360 / STEP }, (_, i) => {
    const angle = i * STEP;
    const isGem = i % 2 === 0;
    return { angle, isGem, color: isGem ? HERO_BEADS[(i / 2) % HERO_BEADS.length] : undefined };
  });

  return (
    <section className="hero">
      <div className="hero-copy">
        <h1>{c.heroTitle}</h1>
        <p className="hero-lede">{c.heroLede}</p>
        <div className="btn-row">
          <a className="btn btn-lapis" href="#edit">{c.heroPrimary}</a>
          <Link className="btn btn-line" href="/find-your-bracelet">
            {c.heroSecondary}
          </Link>
        </div>
      </div>

      <div className="hero-art">
        <div
          role="img"
          aria-label={getUI().hero.artAria}
          className="bracelet"
        >
          <div aria-hidden="true" className="bracelet-glow" />
          <div className="hring">
            {beads.map(({ angle, isGem, color }) => (
              <div
                key={angle}
                className={isGem ? "gem" : "spacer"}
                style={{
                  transform: `rotate(${angle}deg) translateY(-${RADIUS}px)`,
                  ...(color ? { backgroundColor: color } : {}),
                }}
              />
            ))}
          </div>
          <div className="charm medallion">
            <Image src="/brand/emblem.png" alt="" width={108} height={120} priority />
          </div>
        </div>
      </div>
    </section>
  );
}
