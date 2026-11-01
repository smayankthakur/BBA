import Link from "./LocaleLink";
import FaqList, { prepFaqs } from "./FaqList";
import { getContent, getSite } from "@/lib/server/content";
import { getUI } from "@/lib/server/lang";

/** Homepage: the five questions people ask most, with a link to the full FAQ page. */
export default async function HomeFaq() {
  const [c, { vars }] = await Promise.all([getContent("home"), getSite()]);
  const items = prepFaqs(c.faqs, vars);
  if (!items.length) return null;
  return (
    <section className="section-narrow faq home-faq" aria-labelledby="home-faq-title">
      <h2 id="home-faq-title" className="h2">
        {c.faqTitle}
      </h2>
      {c.faqLede && <p className="faq-lede">{c.faqLede}</p>}
      <FaqList items={items} />
      <p className="faq-more">
        <Link className="btn btn-line" href="/faq">
          {getUI().common.allQuestions}
        </Link>
      </p>
    </section>
  );
}
