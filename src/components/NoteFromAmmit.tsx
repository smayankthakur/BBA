import { getUI } from "@/lib/server/lang";
import { tf } from "@/lib/i18n/ui";
import Image from "next/image";
import Link from "./LocaleLink";
import { getContent, getSite } from "@/lib/server/content";

export default async function NoteFromAmmit({ compact = false }: { compact?: boolean }) {
  const [c, { s }] = await Promise.all([getContent("home"), getSite()]);
  const photo = s.ammitPhoto;
  const ui = getUI();
  return (
    <section id="note" className={`note${compact ? " is-compact" : ""}`}>
      <div className="note-card">
        <figure className="note-photo">
          <div className="note-arch">
            {photo ? (
              <Image src={photo} alt={s.ammitPhotoAlt} fill sizes="(max-width: 760px) 70vw, 280px" className="note-img" />
            ) : (
              <div className="note-photo-fallback" role="img" aria-label={ui.note.medallion}>
                <Image src="/brand/emblem.png" alt="" width={150} height={166} />
              </div>
            )}
          </div>
          <figcaption>
            <span className="note-name">{s.ammitName}</span>
            <span className="note-role">{s.ammitRole}</span>
          </figcaption>
        </figure>

        <div className="note-text">
          <h2>{c.noteTitle}</h2>
          <p className="note-body">{c.noteBody1}</p>
          {c.noteBody2 && <p className="note-body note-more">{c.noteBody2}</p>}
          {compact && (
            <Link className="note-readmore" href="/about-ammit">
              {c.noteReadMore}
            </Link>
          )}
          {c.noteQuote && <p className="note-quote">&ldquo;{c.noteQuote}&rdquo;</p>}
          <div className="note-foot">
            <span className="signature" aria-label={tf(ui.note.signed, { name: s.ammitName })}>
              {s.ammitName}
            </span>
            <a className="btn btn-line" href={s.youtube} target="_blank" rel="noopener noreferrer">
              {c.noteButton}
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
