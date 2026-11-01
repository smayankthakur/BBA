import Image from "next/image";
import Link from "./LocaleLink";
import { getContent } from "@/lib/server/content";
import { getUI } from "@/lib/server/lang";
import { tf } from "@/lib/i18n/ui";

/**
 * Bracelet page: Instagram review screenshots tagged with this purpose (Admin →
 * Pages → Reviews), shown just above the order button. Falls back to written
 * reviews for this purpose, then to untagged screenshots.
 */
export default async function PurposeReviews({ slug }: { slug: string }) {
  const r = await getContent("reviews");
  const ui = getUI();
  const shots = (r.shots ?? []).filter((x) => x.image);
  const mine = shots.filter((x) => x.purpose === slug);
  const general = shots.filter((x) => !x.purpose);
  const list = (mine.length ? mine : general).slice(0, 4);
  const quotes = !list.length ? r.items.filter((t) => t.quote.trim() && t.intention === slug).slice(0, 2) : [];
  if (!list.length && !quotes.length) return null;

  return (
    <section className="pr" aria-labelledby="pr-title">
      <div className="pr-head">
        <h2 id="pr-title" className="pr-title">
          {mine.length || quotes.length ? ui.reviews.forThis : ui.reviews.general}
        </h2>
        <Link href="/reviews" className="pr-all">
          {ui.reviews.all} →
        </Link>
      </div>
      {list.length > 0 ? (
        <ul className="pr-shots">
          {list.map((x, i) => {
            const alt = `${x.name ? tf(ui.common.instagramReviewFrom, { name: x.name }) : ui.common.instagramReview}${x.text ? `: ${x.text}` : ""}`;
            return (
              <li key={i}>
                <a href={x.link || x.image} target="_blank" rel="noopener noreferrer" className="pr-shot">
                  <Image src={x.image} alt={alt} fill sizes="120px" />
                </a>
              </li>
            );
          })}
        </ul>
      ) : (
        <ul className="pr-quotes">
          {quotes.map((t, i) => (
            <li key={i}>
              <blockquote>“{t.quote.length > 180 ? `${t.quote.slice(0, 177)}…` : t.quote}”</blockquote>
              <span>{t.name}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
