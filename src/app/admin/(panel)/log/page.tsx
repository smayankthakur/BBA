import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/lib/server/auth";
import { sql } from "@/lib/server/db";
import { ensureSchema } from "@/lib/server/schema";

export const metadata: Metadata = { title: "Activity log" };

const PER_PAGE = 50;
const fmt = (d: Date) =>
  new Intl.DateTimeFormat("en-IN", { timeZone: "Asia/Kolkata", day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit" }).format(
    new Date(d),
  );

/** Plain-English names for the actions in admin_log. */
const LABEL: Record<string, string> = {
  login: "Signed in",
  logout: "Signed out",
  register: "Created the owner account",
  "order.update": "Edited an order",
  "order.bulk-status": "Moved orders",
  "order.ship": "Booked a shipment",
  "order.reading-done": "Finished a reading",
  "order.reading-save": "Saved a reading",
  "content.save": "Edited page text",
  "content.reset": "Reset page text",
  "product.create": "Added a bracelet",
  "product.update": "Edited a bracelet",
  "product.trash": "Moved a bracelet to the trash",
  "product.delete": "Deleted a bracelet",
  "media.upload": "Uploaded media",
  "media.delete": "Deleted media",
  "article.create": "Added an article",
  "article.update": "Edited an article",
  "article.translate": "Translated an article",
  "article.delete": "Deleted an article",
  "customers.export": "Downloaded the marketing list",
  "orders.export": "Downloaded orders (CSV)",
  "account.two-step.on": "Turned on two-step login",
  "account.two-step.off": "Turned off two-step login",
};
const label = (a: string) =>
  LABEL[a] ?? (a.startsWith("order.whatsapp.") ? `Sent a WhatsApp (${a.split(".")[2]})` : a.replace(/[.-]/g, " ").replace(/^\w/, (c) => c.toUpperCase()));

/** Who changed what, newest first (kept for good; only the owner and admins see it). */
export default async function LogPage({ searchParams }: { searchParams: Promise<Record<string, string>> }) {
  const sp = await searchParams;
  await requireAdmin("admin");
  await ensureSchema();
  const who = /^[0-9a-f-]{36}$/i.test(sp.who ?? "") ? sp.who : "";
  const q = (sp.q ?? "").slice(0, 60);
  const like = `%${q.replace(/[%_\\]/g, (m) => "\\" + m)}%`;
  const page = Math.max(1, Math.min(500, Number(sp.page) || 1));
  const [rows, users] = await Promise.all([
    sql<{ id: number; action: string; target: string | null; at: Date; name: string | null; email: string | null; total: number }>`
      select l.id, l.action, l.target, l.at, u.name, u.email, count(*) over() :: int as total
      from admin_log l left join admin_users u on u.id = l.user_id
      where (${who} = '' or l.user_id::text = ${who})
        and (${q} = '' or l.action ilike ${like} or coalesce(l.target, '') ilike ${like})
      order by l.at desc limit ${PER_PAGE} offset ${(page - 1) * PER_PAGE}`,
    sql<{ id: string; name: string }>`select id, name from admin_users order by name`,
  ]);
  const total = rows[0]?.total ?? 0;
  const pages = Math.max(1, Math.ceil(total / PER_PAGE));
  const qs = (p: number) => new URLSearchParams({ ...(who && { who }), ...(q && { q }), page: String(p) }).toString();
  return (
    <>
      <div className="ad-head">
        <h1>Activity log</h1>
      </div>
      <p className="ad-sub">Every change made in the admin panel, newest first.</p>
      <form className="ad-filters" method="get">
        <label>
          <span className="sr-only">Person</span>
          <select name="who" defaultValue={who}>
            <option value="">Everyone</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span className="sr-only">Search</span>
          <input type="search" name="q" defaultValue={q} placeholder="Order no., page, action" />
        </label>
        <button className="ad-btn" type="submit">
          Filter
        </button>
        {(who || q) && <Link href="/admin/log">Clear</Link>}
      </form>
      <div className="ad-table-wrap">
        <table className="ad-table">
          <thead>
            <tr>
              <th scope="col">When</th>
              <th scope="col">Who</th>
              <th scope="col">What</th>
              <th scope="col">Details</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td colSpan={4} className="ad-empty">
                  Nothing logged{q || who ? " for these filters" : " yet"}.
                </td>
              </tr>
            )}
            {rows.map((r) => (
              <tr key={r.id}>
                <td>{fmt(r.at)}</td>
                <td>{r.name ?? <span className="ad-muted">(removed user)</span>}</td>
                <td>{label(r.action)}</td>
                <td className="ad-log-target">{r.target}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {pages > 1 && (
        <nav className="ad-pager" aria-label="Pages">
          {page > 1 && <Link href={`/admin/log?${qs(page - 1)}`}>← Newer</Link>}
          <span>
            Page {page} of {pages} · {total} entries
          </span>
          {page < pages && <Link href={`/admin/log?${qs(page + 1)}`}>Older →</Link>}
        </nav>
      )}
    </>
  );
}
