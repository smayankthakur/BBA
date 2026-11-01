import RichText from "./RichText";
import JsonLd from "./JsonLd";
import { fill } from "@/lib/content/render";

export type Faq = { q: string; a: string; group?: string };

/** Drops empty rows and fills {{price}}, {{minDays}}… placeholders. */
export function prepFaqs<T extends Faq>(list: T[] | undefined, vars: Record<string, string | number>): T[] {
  return (list ?? [])
    .filter((f) => f.q?.trim() && f.a?.trim())
    .map((f) => ({ ...f, q: fill(f.q, vars), a: fill(f.a, vars) }));
}

/** [text](/path) → text, for structured data. */
const plain = (t: string) => t.replace(/\[([^\]]+)\]\([^)\s]+\)/g, "$1");

/** schema.org FAQPage (used once per page, on the page that owns the questions). */
export function FaqJsonLd({ items }: { items: Faq[] }) {
  if (!items.length) return null;
  return (
    <JsonLd
      data={{
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: items.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: plain(f.a) } })),
      }}
    />
  );
}

/** Questions as open/close rows. Answers can contain [links](/path). */
export default function FaqList({ items }: { items: Faq[] }) {
  return (
    <>
      {items.map((f, i) => (
        <details key={i}>
          <summary>{f.q}</summary>
          <p>
            <RichText text={f.a} />
          </p>
        </details>
      ))}
    </>
  );
}
