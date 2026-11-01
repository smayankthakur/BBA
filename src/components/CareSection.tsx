import { getUI } from "@/lib/server/lang";
import Link from "./LocaleLink";
import FaqList, { prepFaqs } from "./FaqList";
import { getContent, getSite } from "@/lib/server/content";

/**
 * Homepage: "What if my bracelet breaks?" with the care basics underneath
 * (left), and the questions people ask most (right).
 */
export default async function CareSection() {
  const [c, care, { s, vars }] = await Promise.all([getContent("home"), getContent("care"), getSite()]);
  const ui = getUI();
  const faqs = prepFaqs(c.faqs, vars);
  return (
    <section id="care" className="care">
      <div className="care-inner">
        <div className="care-left">
          <div className="care-copy">
            <h2 className="h2">{c.careTitle}</h2>
            <p>{c.careText}</p>
            <div className="btn-row">
              <a className="btn btn-lapis on-white" href={s.youtubeShorts} target="_blank" rel="noopener noreferrer">
                {c.careWatch}
              </a>
              <Link className="btn btn-line" href="/bracelet-care">
                {c.careGuide}
              </Link>
            </div>
          </div>
          <dl className="care-list" tabIndex={0} aria-label={ui.care.listAria}>
            {care.items.map((x, i) => (
              <div key={i} className="care-item">
                <dt>{x.term}</dt>
                <dd>{x.detail}</dd>
              </div>
            ))}
          </dl>
        </div>

        {faqs.length > 0 && (
          <div className="care-faq faq" aria-labelledby="home-faq-title" role="region">
            <h2 id="home-faq-title" className="care-faq-title">
              {c.faqTitle}
            </h2>
            {c.faqLede && <p className="faq-lede">{c.faqLede}</p>}
            <FaqList items={faqs} />
            <p className="faq-more">
              <Link className="btn btn-line" href="/faq">
                {ui.common.allQuestions}
              </Link>
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
