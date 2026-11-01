import type { Metadata } from "next";
import Link from "next/link";
import Notice from "@/components/admin/Notice";
import { requireAdmin } from "@/lib/server/auth";
import { readingQueue, recentlyRead } from "@/lib/server/orders";
import { getBracelets } from "@/lib/server/catalog";
import { saveReadingAction } from "@/app/admin/actions";
import { MULANK } from "@/data/pages";

export const metadata: Metadata = { title: "Reading queue" };

const fmt = (d: string | Date | null | undefined) =>
  d ? new Intl.DateTimeFormat("en-IN", { timeZone: "Asia/Kolkata", day: "numeric", month: "short", hour: "numeric", minute: "2-digit" }).format(new Date(d)) : "—";
const dobLabel = (s: string | null) => {
  if (!s) return null;
  const [y, m, d] = s.split("-").map(Number);
  const now = new Date();
  let age = now.getFullYear() - y;
  if (now.getMonth() + 1 < m || (now.getMonth() + 1 === m && now.getDate() < d)) age--;
  return `${d} ${["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][m - 1]} ${y} (age ${age})`;
};
const GENDER: Record<string, string> = { female: "Woman", male: "Man", other: "Prefer not to say", unspecified: "Not given yet" };

/**
 * Ammit Ji's daily list: paid orders waiting for a reading, with everything
 * needed to choose the crystals. "Reading done" moves the order on and the
 * crystals print on the reading card.
 */
export default async function ReadingQueue({ searchParams }: { searchParams: Promise<Record<string, string>> }) {
  const sp = await searchParams;
  await requireAdmin("editor");
  const [queue, recent, bracelets] = await Promise.all([readingQueue(), recentlyRead(), getBracelets()]);
  const ready = queue.filter((o) => o.dob_text);
  const waiting = queue.filter((o) => !o.dob_text);
  const crystalsFor = (slugs: string[]) =>
    [...new Set(slugs.flatMap((s) => bracelets.find((b) => b.slug === s)?.crystals ?? []))].join(", ");

  return (
    <>
      <div className="ad-head">
        <h1>Reading queue</h1>
      </div>
      <p className="ad-sub">
        {ready.length} to read{waiting.length ? ` · ${waiting.length} waiting for birth details` : ""}. Oldest first. Choose the crystals, then tap Reading done; the
        crystals print on the reading card.
      </p>
      <Notice sp={sp} />
      {ready.length === 0 && <p className="ad-empty">Nothing to read right now. 🙏</p>}
      <div className="rq">
        {ready.map((o) => {
          const purposes = o.purposes?.length ? o.purposes : [o.bracelet_slug];
          const m = MULANK.find((x) => x.number === o.mulank);
          return (
            <article key={o.id} className="rq-card" id={`o-${o.ref}`}>
              <header className="rq-head">
                <div>
                  <h2>
                    {o.wearer_first_name} {o.wearer_last_name}
                  </h2>
                  <p className="ad-muted">
                    <Link href={`/admin/orders/${o.id}`}>{o.ref}</Link> · paid {fmt(o.paid_at)}
                    {o.is_gift ? " · gift" : ""}
                  </p>
                </div>
                <div className="rq-nums" aria-label="Numbers">
                  <span>
                    <b>{o.mulank}</b>Mulank{m ? ` · ${m.planet}` : ""}
                  </span>
                  <span>
                    <b>{o.bhagyank}</b>Bhagyank
                  </span>
                </div>
              </header>
              <dl className="rq-dl">
                <dt>Born</dt>
                <dd>{dobLabel(o.dob_text)}</dd>
                <dt>Gender</dt>
                <dd>{GENDER[o.wearer_gender] ?? o.wearer_gender}</dd>
                <dt>Purposes</dt>
                <dd>{o.bracelet_title}</dd>
                <dt>Help with</dt>
                <dd>{o.focus || "—"}</dd>
                {o.wearer_note && (
                  <>
                    <dt>Their note</dt>
                    <dd>{o.wearer_note}</dd>
                  </>
                )}
                <dt>Wrist</dt>
                <dd>{o.wrist === "unsure" ? "Not sure (ask)" : o.wrist}</dd>
              </dl>
              <form action={saveReadingAction} className="rq-form">
                <input type="hidden" name="id" value={o.id} />
                <label className="ad-field">
                  <span>Crystals chosen</span>
                  <textarea name="crystals" rows={2} maxLength={400} defaultValue={o.crystals_chosen ?? ""} placeholder={crystalsFor(purposes)} />
                  <small>Comma-separated. Usual for these purposes: {crystalsFor(purposes) || "—"}</small>
                </label>
                <label className="ad-field">
                  <span>Note on the reading card (optional)</span>
                  <textarea name="note" rows={2} maxLength={400} defaultValue={o.reading_notes ?? ""} />
                </label>
                <div className="ad-actions">
                  <button className="ad-btn is-primary" name="intent" value="done" type="submit">
                    ✓ Reading done
                  </button>
                  <button className="ad-btn" name="intent" value="save" type="submit">
                    Save for later
                  </button>
                </div>
              </form>
            </article>
          );
        })}
      </div>

      {waiting.length > 0 && (
        <section className="ad-box" style={{ marginTop: 24 }}>
          <h2>Waiting for birth details ({waiting.length})</h2>
          <div className="ad-box-body">
            <p className="ad-help">Paid quick orders where the customer hasn&apos;t added the date of birth yet. Open the order to ask on WhatsApp or type it in.</p>
            <ul className="rq-wait">
              {waiting.map((o) => (
                <li key={o.id}>
                  <Link href={`/admin/orders/${o.id}`}>{o.ref}</Link> · {o.wearer_first_name} · {o.bracelet_title} · paid {fmt(o.paid_at)}
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      {recent.length > 0 && (
        <section className="ad-box" style={{ marginTop: 24 }}>
          <h2>Recently read</h2>
          <div className="ad-box-body">
            <ul className="rq-wait">
              {recent.map((o) => (
                <li key={o.id}>
                  <Link href={`/admin/orders/${o.id}`}>{o.ref}</Link> · {o.wearer_first_name} · {o.crystals_chosen || "—"} ·{" "}
                  <Link href={`/admin/orders/${o.id}/card`}>Reading card</Link>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}
    </>
  );
}
