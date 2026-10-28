import type { Metadata } from "next";
import Link from "next/link";
import Notice from "@/components/admin/Notice";
import { PAGES } from "@/lib/content/fields";
import { contentUpdatedAt } from "@/lib/server/content";
import { requireAdmin, roleAtLeast } from "@/lib/server/auth";

export const metadata: Metadata = { title: "Pages" };

const fmt = (d?: string) =>
  d
    ? new Intl.DateTimeFormat("en-IN", {
        timeZone: "Asia/Kolkata",
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
      }).format(new Date(d))
    : "";

export default async function PagesList({
  searchParams,
}: {
  searchParams: Promise<Record<string, string>>;
}) {
  const sp = await searchParams;
  const [user, updated] = await Promise.all([
    requireAdmin(),
    contentUpdatedAt(),
  ]);
  const groups = ["Site", "Pages", "Policies"] as const;
  return (
    <>
      <div className="ad-head">
        <h1>Pages</h1>
      </div>
      <p className="ad-sub">
        Edit the words on every page. Bracelets are edited under Bracelets.
      </p>
      <Notice sp={sp} />
      <div className="ad-table-wrap">
        <table className="ad-table">
          <thead>
            <tr>
              <th scope="col">Page</th>
              <th scope="col">Section</th>
              <th scope="col">Last edited</th>
            </tr>
          </thead>
          <tbody>
            {groups.flatMap((g) =>
              PAGES.filter((p) => p.group === g)
                .filter(
                  (p) => p.id !== "settings" || roleAtLeast(user.role, "admin"),
                )
                .map((p) => (
                  <tr key={p.id}>
                    <td>
                      <Link className="t-title" href={`/admin/pages/${p.id}`}>
                        {p.title}
                      </Link>
                      <div className="ad-row-actions">
                        <Link href={`/admin/pages/${p.id}`}>Edit</Link>
                        {p.path && (
                          <a
                            href={p.path}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            View
                          </a>
                        )}
                      </div>
                    </td>
                    <td>{g}</td>
                    <td>
                      {updated[p.id] ? (
                        fmt(updated[p.id])
                      ) : (
                        <span className="ad-muted">Original text</span>
                      )}
                    </td>
                  </tr>
                )),
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
