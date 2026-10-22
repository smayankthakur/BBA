import fs from "node:fs";
import path from "node:path";
import Image from "next/image";
import { AMMIT, LINKS } from "@/data/home";

// Resolved at build time: the portrait appears as soon as the file is added.
const hasPhoto = fs.existsSync(path.join(process.cwd(), "public", AMMIT.photo));

export default function NoteFromAmmit() {
  return (
    <section id="note" className="note">
      <div className="note-card">
        <figure className="note-photo">
          <div className="note-arch">
            {hasPhoto ? (
              <Image
                src={AMMIT.photo}
                alt={AMMIT.photoAlt}
                fill
                sizes="(max-width: 760px) 70vw, 280px"
                className="note-img"
              />
            ) : (
              <div className="note-photo-fallback" role="img" aria-label="Bracelet By Ammit medallion">
                <Image src="/brand/emblem.png" alt="" width={150} height={166} />
              </div>
            )}
          </div>
          <figcaption>
            <span className="note-name">{AMMIT.name}</span>
            <span className="note-role">{AMMIT.role}</span>
          </figcaption>
        </figure>

        <div className="note-text">
          <h2>A note from Ammit</h2>
          <p className="note-body">
            Namaste. A crystal bracelet is often chosen for its colour, or because a friend wears one.
            But a stone that helps one person can do nothing for another, because your numbers are not
            theirs. That is why I started Bracelet By Ammit.
          </p>
          <p className="note-body">
            Before I choose a single crystal, I read your date of birth myself: your mulank, your
            bhagyank and how your numbers sit together. Only then do I pick the stones for what you are
            asking of life, and string them by hand.
          </p>
          <p className="note-quote">
            &ldquo;Har bracelet style ke liye nahi hota. Right crystal, right direction.&rdquo;
          </p>
          <div className="note-foot">
            <span className="signature" aria-label={`Signed, ${AMMIT.name}`}>
              {AMMIT.name}
            </span>
            <a className="btn btn-line" href={LINKS.youtube} target="_blank" rel="noopener noreferrer">
              Watch Ammit on YouTube
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
