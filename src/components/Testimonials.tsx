import { INTENTIONS, TESTIMONIALS } from "@/data/home";

const bySlug = Object.fromEntries(INTENTIONS.map((i) => [i.slug, i]));

export default function Testimonials() {
  if (!TESTIMONIALS.length) return null;

  return (
    <section id="reviews" className="reviews" aria-labelledby="reviews-title">
      <div className="reviews-inner">
        <div className="reviews-head">
          <h2 id="reviews-title" className="h2">
            In their own words
          </h2>
          <p>From people wearing a bracelet Ammit chose for them.</p>
        </div>

        <ul className="reviews-list" tabIndex={0} aria-label="Customer reviews">
          {TESTIMONIALS.map((t, idx) => {
            const it = bySlug[t.intention];
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
                    <span className="review-place">{t.place}</span>
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
      </div>
    </section>
  );
}
