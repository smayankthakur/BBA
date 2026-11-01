import type { Metadata } from "next";
import Link from "next/link";
import Notice from "@/components/admin/Notice";
import { requireAdmin } from "@/lib/server/auth";
import { adminListArticles } from "@/lib/server/articles";

export const metadata: Metadata = { title: "Articles" };

const day = (iso: string | null) =>
  iso ? new Intl.DateTimeFormat("en-IN", { timeZone: "Asia/Kolkata", day: "numeric", month: "short", year: "numeric" }).format(new Date(iso)) : "—";

export default async function ArticlesAdmin({ searchParams }: { searchParams: Promise<Record<string, string>> }) {
  const sp = await searchParams;
  await requireAdmin("editor");
  const list = await adminListArticles();
  return (
    <>
      <div className="ad-head">
        <h1>Articles</h1>
        <Link className="ad-btn" href="/admin/articles/new">
          Write a new article
        </Link>
      </div>
      <p className="ad-sub">Guides that bring visitors from Google. Each can point to one bracelet, shown at the end of the article and on that bracelet&apos;s page.</p>
      <Notice sp={sp} />
      <div className="ad-table-wrap">
        <table className="ad-table">
          <thead>
            <tr>
              <th scope="col">Title</th>
              <th scope="col">Bracelet</th>
              <th scope="col">Hindi / Hinglish</th>
              <th scope="col">Status</th>
              <th scope="col">Updated</th>
            </tr>
          </thead>
          <tbody>
            {list.length === 0 && (
              <tr>
                <td colSpan={5}>No articles yet.</td>
              </tr>
            )}
            {list.map((a) => (
              <tr key={a.id}>
                <td>
                  <Link className="t-title" href={`/admin/articles/${a.id}`}>
                    {a.title}
                  </Link>
                  <div className="ad-muted">/articles/{a.slug}</div>
                </td>
                <td>{a.purpose ?? "—"}</td>
                <td>
                  {a.i18n?.hi?.title ? "✓" : "—"} / {a.i18n?.hn?.title ? "✓" : "—"}
                </td>
                <td>
                  <span className={`ad-pill ${a.status === "published" ? "ok" : "warn"}`}>{a.status === "published" ? "Published" : "Draft"}</span>
                </td>
                <td>{day(a.updatedAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
