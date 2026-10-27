import type { Metadata } from "next";
import PageShell from "./PageShell";
import PageHero from "./PageHero";
import { getContent, getSite } from "@/lib/server/content";
import { fill, Markdown } from "@/lib/content/render";

type PolicyId = "privacy" | "terms" | "shipping" | "returns";

export async function policyMetadata(id: PolicyId, path: string, description: string): Promise<Metadata> {
  const c = await getContent(id);
  return { title: c.title, description, alternates: { canonical: path } };
}

/** Policy pages: hero + the admin-editable policy text. */
export default async function LegalPage({ id, crumb }: { id: PolicyId; crumb: string }) {
  const [c, { vars }] = await Promise.all([getContent(id), getSite()]);
  return (
    <PageShell>
      <PageHero
        crumbs={[{ label: crumb }]}
        eyebrow={`Policy · Updated ${c.updated}`}
        title={c.title}
        lede={<p>{fill(c.lede, vars)}</p>}
      />
      <article className="section-narrow legal">
        <Markdown text={fill(c.body, vars)} />
      </article>
    </PageShell>
  );
}
