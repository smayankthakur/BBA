import Link from "next/link";
import { getContent, getSite } from "@/lib/server/content";

export default async function CareSection() {
  const [c, care, { s }] = await Promise.all([getContent("home"), getContent("care"), getSite()]);
  return (
    <section id="care" className="care">
      <div className="care-inner">
        <div className="care-copy">
          <h2 className="h2">{c.careTitle}</h2>
          <p>{c.careText}</p>
          <div className="btn-row">
            <a
              className="btn btn-lapis on-white"
              href={s.youtubeShorts}
              target="_blank"
              rel="noopener noreferrer"
            >
              {c.careWatch}
            </a>
            <Link className="btn btn-line" href="/bracelet-care">
              {c.careGuide}
            </Link>
          </div>
        </div>
        <dl className="care-list" tabIndex={0} aria-label="Bracelet care">
          {care.items.map((c, i) => (
            <div key={i} className="care-item">
              <dt>{c.term}</dt>
              <dd>{c.detail}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
