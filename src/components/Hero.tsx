import Image from "next/image";
import { HERO_BEADS, LINKS } from "@/data/home";

const RADIUS = 190; // px from centre to bead
const STEP = 15; // degrees between bead and spacer

export default function Hero() {
  // 24 positions: gem at every 30°, gold spacer in between.
  const beads = Array.from({ length: 360 / STEP }, (_, i) => {
    const angle = i * STEP;
    const isGem = i % 2 === 0;
    return { angle, isGem, color: isGem ? HERO_BEADS[(i / 2) % HERO_BEADS.length] : undefined };
  });

  return (
    <section className="hero">
      <div className="hero-copy">
        <h1>A bracelet for what you&apos;re asking of life.</h1>
        <p className="hero-lede">
          Choose the intention. Numerologist Ammit Kukreja chooses the crystals for your birth date,
          then strings them by hand.
        </p>
        <div className="btn-row">
          <a className="btn btn-lapis" href="#edit">Shop by intention</a>
          <a className="btn btn-line" href={LINKS.buildBracelet}>Build my bracelet</a>
        </div>
      </div>

      <div className="hero-art">
        <div
          role="img"
          aria-label="A lapis, moonstone and amethyst bracelet with gold spacers, slowly turning around a BBA medallion"
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
