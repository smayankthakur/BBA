import Image from "next/image";
import RowAutoScroll from "./RowAutoScroll";
import { getBracelets } from "@/lib/server/catalog";
import { OLD_BRACELET_SLUGS } from "@/data/pages";
import { getUI } from "@/lib/server/lang";
import { tf } from "@/lib/i18n/ui";
import { getContent, getSite } from "@/lib/server/content";

export default async function Testimonials() {
  const [home, r, { s }, bracelets] = await Promise.all([getContent("home"), getContent("reviews"), getSite(), getBracelets()]);
  const bySlug: Record<string, (typeof bracelets)[number]> = Object.fromEntries(bracelets.map((b) => [b.slug, b]));
  for (const [old, now] of Object.entries(OLD_BRACELET_SLUGS)) if (bySlug[now]) bySlug[old] = bySlug[now];
  // Instagram screenshots replace the written reviews as soon as any are added.
  const shots = (r.shots ?? []).filter((x) => x.image);
  const TESTIMONIALS = r.items.filter((t) => t.quote.trim());
  const LINKS = { instagramReviews: s.instagramReviews };
  const ui = getUI();
  const u = ui.reviews;
  const hasReviews = shots.length > 0 || TESTIMONIALS.length > 0;

  return (
    <section id="reviews" className="reviews" aria-labelledby="reviews-title">
      <div className="reviews-inner">
        <div className="reviews-head">
          <h2 id="reviews-title" className="h2">
            {home.reviewsTitle}
          </h2>
          <p>{home.reviewsLede}</p>
          {hasReviews && <RowAutoScroll targetId="reviews-list" label={ui.rows.reviews} />}
        </div>

        {!hasReviews && (
          <div className="reviews-empty">
            <span className="review-mark" aria-hidden="true">
              &ldquo;
            </span>
            <p>{u.empty}</p>
            <a className="btn btn-gold" href={LINKS.instagramReviews} target="_blank" rel="noopener noreferrer">
              {u.emptyButton}
            </a>
          </div>
        )}

        {shots.length > 0 && (
          <ul id="reviews-list" className="reviews-list is-shots" tabIndex={0} aria-label={u.ariaShots}>
            {shots.map((x, idx) => (
              <li key={idx} className="review-shot">
                <figure>
                  <div className="review-shot-frame">
                    <Image
                      src={x.image}
                      alt={`${x.name ? tf(ui.common.instagramReviewFrom, { name: x.name }) : x.text ? ui.common.instagramReview : ui.common.instagramScreenshot}${x.text ? `: ${x.text}` : ""}`}
                      fill
                      sizes="(max-width: 760px) 70vw, 280px"
                    />
                  </div>
                  {(x.name || x.link) && (
                    <figcaption>
                      {x.name && <span className="review-name">{x.name}</span>}
                      {x.link && (
                        <a className="review-source" href={x.link} target="_blank" rel="noopener noreferrer">
                          {ui.common.viewOnInstagram}
                        </a>
                      )}
                    </figcaption>
                  )}
                </figure>
              </li>
            ))}
          </ul>
        )}

        {shots.length === 0 && TESTIMONIALS.length > 0 && (
        <ul id="reviews-list" className="reviews-list" tabIndex={0} aria-label={u.aria}>
          {TESTIMONIALS.map((t, idx) => {
            const it = t.intention ? bySlug[t.intention] : undefined;
            return (
              <li key={idx} className="review">
                <figure>
                  <span className="review-mark" aria-hidden="true">
                    &ldquo;
                  </span>
                  <blockquote>
                    <p>{t.quote}</p>
                  </blockquote>
                  <figcaption>
                    <span className="review-name">{t.name}</span>
                                        {it && (
                      <span className="review-tag">
                        <span
                          className="review-dot"
                          aria-hidden="true"
                          style={{
                            backgroundColor: it.visual.sphere,
                            backgroundImage: `radial-gradient(circle at 30% 30%,rgba(255,255,255,.9) 0 10%,rgba(255,255,255,0) 40%)`,
                          }}
                        />
                        {tf(u.wears, { title: it.title })}
                      </span>
                    )}
                    {t.sourceUrl && (
                      <a className="review-source" href={t.sourceUrl} target="_blank" rel="noopener noreferrer">
                        {t.sourceLabel || ui.common.source}
                      </a>
                    )}
                  </figcaption>
                </figure>
              </li>
            );
          })}
        </ul>
        )}

        {hasReviews && (
          <div className="reviews-more">
            <a className="btn btn-gold" href={LINKS.instagramReviews} target="_blank" rel="noopener noreferrer">
              {home.reviewsMore}
            </a>
          </div>
        )}
      </div>
    </section>
  );
}
