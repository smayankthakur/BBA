import PageShell from "./PageShell";
import PageHero from "./PageHero";

export const POLICY_UPDATED = "22 October 2026";

/** Shared shell for policy pages: hero + readable article column. */
export default function LegalPage({
  title,
  crumb,
  lede,
  children,
}: {
  title: string;
  crumb: string;
  lede: string;
  children: React.ReactNode;
}) {
  return (
    <PageShell>
      <PageHero crumbs={[{ label: crumb }]} eyebrow={`Policy · Updated ${POLICY_UPDATED}`} title={title} lede={<p>{lede}</p>} />
      <article className="section-narrow legal">{children}</article>
    </PageShell>
  );
}
