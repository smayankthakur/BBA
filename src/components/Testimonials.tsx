import { INTENTIONS, LINKS, TESTIMONIALS } from "@/data/home";
import RowAutoScroll from "./RowAutoScroll";

const bySlug = Object.fromEntries(INTENTIONS.map((i) => [i.slug, i]));

export default function Testimonials() {
  const hasReviews = TESTIMONIALS.length > 0;

  return (
    <section id="reviews" className="reviews" aria-labelledby="reviews-title">
      <div className="reviews-inner">
        <div className="reviews-head">
          <h2 id="reviews-title" className="h2">
            In their own words
          </h2>
          <p>From people wearing a bracelet Ammit chose for them.</p>
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
                    {t.place && <span className="review-place">{t.place}</span>}
                    {it && (
                      <span className="review-tag">
                        <span
                          className="review-dot"
                          aria-hidden="true"
                          style={{
                            backgroundColor: it.sphere,
                            backgroundImage: `radial-gradient(circle at 30% 30%,rgba(255,255,255,.9) 0 10%,rgba(255,255,255,0) 40%)`,
                          }}
                        />
                        Wears: {it.title}
                      </span>
                    )}
                    {t.source && (
                      <a className="review-source" href={t.source.href} target="_blank" rel="noopener noreferrer">
                        {t.source.label}
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
              Read more reviews on Instagram
            </a>
          </div>
        )}
      </div>
    </section>
  );
}
