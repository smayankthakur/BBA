import type { Metadata } from "next";
import { getLang, getUI, pageLang } from "@/lib/server/lang";
import { alternatesFor } from "@/lib/i18n/config";
import PageShell from "@/components/PageShell";
import PageHero from "@/components/PageHero";
import OrderCta from "@/components/OrderCta";
import FaqList, { FaqJsonLd, prepFaqs, type Faq } from "@/components/FaqList";
import { getContent, getSite } from "@/lib/server/content";

type Params = { params: Promise<{ lang: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  await pageLang(params);
  const c = await getContent("faq");
  return { title: c.seoTitle || c.title, description: c.seoDescription, alternates: alternatesFor(getLang(), "/faq") };
}

/** All questions: the homepage five first, then the FAQ page's own, grouped. */
export default async function FaqPage({ params }: Params) {
  await pageLang(params);
  const [c, home, { s, vars }] = await Promise.all([getContent("faq"), getContent("home"), getSite()]);
  const groups: { title: string; items: Faq[] }[] = [];
  const top = prepFaqs(home.faqs, vars);
  if (top.length) groups.push({ title: c.topGroup, items: top });
  for (const f of prepFaqs(c.items, vars)) {
    const title = f.group?.trim() || "";
    const g = groups.find((x) => x.title === title && x.items !== top);
    if (g) g.items.push(f);
    else groups.push({ title, items: [f] });
  }
  const all = groups.flatMap((g) => g.items);
  const ui = getUI();

  return (
    <PageShell>
      <PageHero crumbs={[{ label: c.title }]} eyebrow={c.eyebrow} title={c.title} lede={<p>{c.lede}</p>} />
      <FaqJsonLd items={all} />
      {groups.length > 1 && (
        <nav className="section-narrow faq-toc" aria-label={c.title}>
          <ul>
            {groups.map((g, i) => (
              <li key={i}>
                <a href={`#faq-${i + 1}`}>{g.title}</a>
              </li>
            ))}
          </ul>
        </nav>
      )}
      {groups.map((g, i) => (
        <section key={i} id={`faq-${i + 1}`} className="section-narrow faq faq-group" aria-labelledby={g.title ? `faq-${i + 1}-title` : undefined}>
          {g.title && (
            <h2 id={`faq-${i + 1}-title`} className="h2">
              {g.title}
            </h2>
          )}
          <FaqList items={g.items} />
        </section>
      ))}
      <OrderCta title={c.ctaTitle} text={c.ctaText} secondary={{ label: ui.footer.whatsappCta, href: s.whatsapp, external: true }} />
    </PageShell>
  );
}
