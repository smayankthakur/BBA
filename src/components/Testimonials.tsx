import RowAutoScroll from "./RowAutoScroll";
import { getBracelets } from "@/lib/server/catalog";
import { getContent, getSite } from "@/lib/server/content";

export default async function Testimonials() {
  const [home, r, { s }, bracelets] = await Promise.all([getContent("home"), getContent("reviews"), getSite(), getBracelets()]);
  const bySlug = Object.fromEntries(bracelets.map((b) => [b.slug, b]));
  const TESTIMONIALS = r.items.filter((t) => t.quote.trim());
  const LINKS = { instagramReviews: s.instagramReviews };
  const hasReviews = TESTIMONIALS.length > 0;

  return (
    <section id="reviews" className="reviews" aria-labelledby="reviews-title">
      <div className="reviews-inner">
        <div className="reviews-head">
          <h2 id="reviews-title" className="h2">
            {home.reviewsTitle}
          </h2>
          <p>{home.reviewsLede}</p>
          {hasReviews && <RowAutoScroll targetId="reviews-list" label="reviews" />}
        </div>

        {!hasReviews && (
          <div className="reviews-empty">
            <span className="review-mark" aria-hidden="true">
              &ldquo;
            </span>
            <p>
              Customers share photos and messages about their bracelets with Ammit. You can read them
              in the Reviews highlight on our Instagram.
            </p>
            <a className="btn btn-gold" href={LINKS.instagramReviews} target="_blank" rel="noopener noreferrer">
              Read reviews on Instagram
            </a>
          </div>
        )}

        {hasReviews && (
        <ul id="reviews-list" className="reviews-list" tabIndex={0} aria-label="Customer reviews">
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
                        Wears: {it.title}
                      </span>
                    )}
                    {t.sourceUrl && (
                      <a className="review-source" href={t.sourceUrl} target="_blank" rel="noopener noreferrer">
                        {t.sourceLabel || "Source"}
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
