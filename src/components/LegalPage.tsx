import type { Metadata } from "next";
import PageShell from "./PageShell";
import PageHero from "./PageHero";
import { getContent, getSite } from "@/lib/server/content";
import { fill, Markdown } from "@/lib/content/render";
import { getLang, getUI } from "@/lib/server/lang";
import { alternatesFor } from "@/lib/i18n/config";
import { tf } from "@/lib/i18n/ui";

type PolicyId = "privacy" | "terms" | "shipping" | "returns";

export async function policyMetadata(id: PolicyId, path: string): Promise<Metadata> {
  const c = await getContent(id);
  return { title: c.title, description: getUI().legal.descriptions[id], alternates: alternatesFor(getLang(), path) };
}

/** Policy pages: hero + the admin-editable policy text. */
export default async function LegalPage({ id }: { id: PolicyId }) {
  const [c, { vars }] = await Promise.all([getContent(id), getSite()]);
  const ui = getUI();
  const crumb = ui.legal.crumbs[id];
  return (
    <PageShell>
      <PageHero
        crumbs={[{ label: crumb }]}
        eyebrow={tf(ui.legal.eyebrow, { date: c.updated })}
        title={c.title}
        lede={<p>{fill(c.lede, vars)}</p>}
      />
      <article className="section-narrow legal">
        <Markdown text={fill(c.body, vars)} />
      </article>
    </PageShell>
  );
}
