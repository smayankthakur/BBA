import Link from "next/link";
import { CARE, LINKS } from "@/data/home";

export default function CareSection() {
  return (
    <section id="care" className="care">
      <div className="care-inner">
        <div className="care-copy">
          <h2 className="h2">What if my bracelet breaks?</h2>
          <p>
            It&apos;s the question people ask us most. Ammit&apos;s answer on YouTube has been watched
            more than 14,000 times.
          </p>
          <div className="btn-row">
            <a
              className="btn btn-lapis on-white"
              href={LINKS.youtubeShorts}
              target="_blank"
              rel="noopener noreferrer"
            >
              Watch Ammit&apos;s answer
            </a>
            <Link className="btn btn-line" href="/bracelet-care">
              Full care guide
            </Link>
          </div>
        </div>
        <dl className="care-list">
          {CARE.map((c) => (
            <div key={c.term} className="care-item">
              <dt>{c.term}</dt>
              <dd>{c.detail}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
