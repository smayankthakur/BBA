import type { Metadata } from "next";
import Link from "next/link";
import Notice from "@/components/admin/Notice";
import ConfirmButton from "@/components/admin/ConfirmButton";
import { adminCounts, adminListProducts } from "@/lib/server/catalog";
import { productStatusAction } from "@/app/admin/actions";
import { formatINR } from "@/lib/format";
import type { ProductKind, ProductStatus } from "@/lib/catalog-types";

export const metadata: Metadata = { title: "Products" };

const fmt = (d?: string) =>
  d
    ? new Intl.DateTimeFormat("en-IN", {
        timeZone: "Asia/Kolkata",
        day: "numeric",
        month: "short",
        year: "numeric",
      }).format(new Date(d))
    : "";

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string>>;
}) {
  const sp = await searchParams;
  const kind: ProductKind = sp.kind === "gift" ? "gift" : "bracelet";
  const status = (
    ["published", "draft", "trash"].includes(sp.status) ? sp.status : "all"
  ) as ProductStatus | "all";
  const [rows, counts] = await Promise.all([
    adminListProducts(kind, status),
    adminCounts(),
  ]);
  const n = (s: ProductStatus) =>
    counts.find((c) => c.kind === kind && c.status === s)?.n ?? 0;
  const label = kind === "gift" ? "Gifts" : "Bracelets";
  const base = kind === "gift" ? "/gifts" : "/bracelets";
  const tab = (s: string, text: string, count: number) => (
    <li>
      <Link
        href={`/admin/products?kind=${kind}${s === "all" ? "" : `&status=${s}`}`}
        aria-current={status === s ? "page" : undefined}
      >
        {text} <span className="n">({count})</span>
      </Link>
    </li>
  );

  return (
    <>
      <div className="ad-head">
        <h1>{label}</h1>
        <Link className="ad-btn" href={`/admin/products/new?kind=${kind}`}>
          Add new
        </Link>
      </div>
      <Notice sp={sp} />
      <ul className="ad-tabs">
        {tab("all", "All", n("published") + n("draft"))}
        {tab("published", "Published", n("published"))}
        {tab("draft", "Drafts", n("draft"))}
        {tab("trash", "Trash", n("trash"))}
      </ul>

      <div className="ad-table-wrap">
        <table className="ad-table">
          <thead>
            <tr>
              <th scope="col" style={{ width: 64 }}>
                <span className="sr-only">Photo</span>
              </th>
              <th scope="col">Title</th>
              <th scope="col">Price</th>
              <th scope="col">Status</th>
              <th scope="col">Order</th>
              <th scope="col">Updated</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td colSpan={6} className="ad-empty">
                  {status === "trash"
                    ? "The trash is empty."
                    : "Nothing here yet."}
                </td>
              </tr>
            )}
            {rows.map((p) => (
              <tr key={p.id}>
                <td>
                  {p.photos[0] ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      className="ad-thumb"
                      src={p.photos[0]}
                      alt=""
                      loading="lazy"
                    />
                  ) : (
                    <span
                      className="ad-thumb"
                      style={{
                        display: "block",
                        background: p.visual.cards[0],
                      }}
                      aria-hidden
                    />
                  )}
                </td>
                <td>
                  {p.status === "trash" ? (
                    <span className="t-title">{p.title}</span>
                  ) : (
                    <Link className="t-title" href={`/admin/products/${p.id}`}>
                      {p.title}
                    </Link>
                  )}
                  <div className="ad-muted">
                    {base}/{p.slug}
                  </div>
                  <div className="ad-row-actions">
                    {p.status === "trash" ? (
                      <>
                        <form action={productStatusAction}>
                          <input type="hidden" name="id" value={p.id} />
                          <input type="hidden" name="to" value="published" />
                          <button className="ad-link-btn">Restore</button>
                        </form>
                        <form action={productStatusAction}>
                          <input type="hidden" name="id" value={p.id} />
                          <input type="hidden" name="to" value="delete" />
                          <ConfirmButton className="ad-link-btn is-danger" message={`Delete ${p.title} permanently? This can't be undone.`}>
                            Delete permanently
                          </ConfirmButton>
                        </form>
                      </>
                    ) : (
                      <>
                        <Link href={`/admin/products/${p.id}`}>Edit</Link>
                        {p.status === "published" && (
                          <a
                            href={`${base}/${p.slug}`}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            View
                          </a>
                        )}
                        <form action={productStatusAction}>
                          <input type="hidden" name="id" value={p.id} />
                          <input type="hidden" name="to" value="trash" />
                          <button className="ad-link-btn is-danger">
                            Trash
                          </button>
                        </form>
                      </>
                    )}
                  </div>
                </td>
                <td>{formatINR(p.priceInr)}</td>
                <td>
                  <span
                    className={`ad-pill ${p.status === "published" ? "ok" : p.status === "draft" ? "warn" : "err"}`}
                  >
                    {p.status}
                  </span>
                  {kind === "bracelet" && !p.inList && p.status !== "trash" && (
                    <div className="ad-muted">not in list</div>
                  )}
                </td>
                <td>{p.sort}</td>
                <td>{fmt(p.updatedAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {status === "trash" && rows.length > 0 && (
        <p className="ad-help">
          Restoring puts a product back on the site. Deleting permanently
          can&apos;t be undone.
        </p>
      )}
    </>
  );
}
