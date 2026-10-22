import Medallion from "./Medallion";
import { LINKS } from "@/data/home";

export default function NoteFromAmmit() {
  return (
    <section id="note" className="note">
      <div className="note-card">
        <Medallion width={52} height={57} />
        <h2>A note from Ammit</h2>
        <p className="note-body">
          [A short welcome from Ammit: why he started making bracelets, and why he reads every birth
          date himself before choosing a single crystal.]
        </p>
        <p className="note-quote">
          &ldquo;Har bracelet style ke liye nahi hota. Right crystal, right direction.&rdquo;
        </p>
        <div className="note-foot">
          <span className="signature">[Ammit&apos;s signature]</span>
          <a className="btn btn-line" href={LINKS.youtube} target="_blank" rel="noopener noreferrer">
            Watch Ammit on YouTube
          </a>
        </div>
      </div>
    </section>
  );
}
