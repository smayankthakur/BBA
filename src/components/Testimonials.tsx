import Image from "next/image";
import RowAutoScroll from "./RowAutoScroll";
import { getBracelets } from "@/lib/server/catalog";
import { OLD_BRACELET_SLUGS } from "@/data/pages";
import { getContent, getSite } from "@/lib/server/content";

export default async function Testimonials() {
  const [home, r, { s }, bracelets] = await Promise.all([getContent("home"), getContent("reviews"), getSite(), getBracelets()]);
  const bySlug: Record<string, (typeof bracelets)[number]> = Object.fromEntries(bracelets.map((b) => [b.slug, b]));
  for (const [old, now] of Object.entries(OLD_BRACELET_SLUGS)) if (bySlug[now]) bySlug[old] = bySlug[now];
  // Instagram screenshots replace the written reviews as soon as any are added.
  const shots = (r.shots ?? []).filter((x) => x.image);
  const TESTIMONIALS = r.items.filter((t) => t.quote.trim());
  const LINKS = { instagramReviews: s.instagramReviews };
  const hasReviews = shots.length > 0 || TESTIMONIALS.length > 0;

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

        {shots.length > 0 && (
          <ul id="reviews-list" className="reviews-list is-shots" tabIndex={0} aria-label="Customer reviews from Instagram">
            {shots.map((x, idx) => (
              <li key={idx} className="review-shot">
                <figure>
                  <div className="review-shot-frame">
                    <Image
                      src={x.image}
                      alt={x.text ? `Instagram review${x.name ? ` from ${x.name}` : ""}: ${x.text}` : `Instagram review screenshot${x.name ? ` from ${x.name}` : ""}`}
                      fill
                      sizes="(max-width: 760px) 70vw, 280px"
                    />
                  </div>
                  {(x.name || x.link) && (
                    <figcaption>
                      {x.name && <span className="review-name">{x.name}</span>}
                      {x.link && (
                        <a className="review-source" href={x.link} target="_blank" rel="noopener noreferrer">
                          View on Instagram
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
