import type { Metadata } from "next";
import Link from "next/link";
import Notice from "@/components/admin/Notice";
import { requireAdmin, roleAtLeast } from "@/lib/server/auth";
import { FULFILMENT, listOrders } from "@/lib/server/orders";
import { formatINR } from "@/lib/format";
import { PROGRESS } from "@/lib/orderProgress";

export const metadata: Metadata = { title: "Orders" };

const PER_PAGE = 30;
const fmt = (d: string | Date) =>
  new Intl.DateTimeFormat("en-IN", {
    timeZone: "Asia/Kolkata",
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(d));

export default async function OrdersPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string>>;
}) {
  const sp = await searchParams;
  const user = await requireAdmin();
  const status = ["paid", "pending", "failed"].includes(sp.status)
    ? sp.status
    : "";
  const fulfilment = (FULFILMENT as readonly string[]).includes(sp.fulfilment)
    ? sp.fulfilment
    : "";
  const q = (sp.q ?? "").slice(0, 80);
  const page = Math.max(1, Math.min(1000, Number(sp.page) || 1));
  const { rows, total } = await listOrders({
    status,
    fulfilment,
    q,
    limit: PER_PAGE,
    offset: (page - 1) * PER_PAGE,
  });
  const pages = Math.max(1, Math.ceil(total / PER_PAGE));
  const qs = (extra: Record<string, string | number>) => {
    const p = new URLSearchParams({
      ...(status && { status }),
      ...(fulfilment && { fulfilment }),
      ...(q && { q }),
    });
    for (const [k, v] of Object.entries(extra)) p.set(k, String(v));
    return p.toString();
  };

  return (
    <>
      <div className="ad-head">
        <h1>Orders</h1>
        {roleAtLeast(user.role, "admin") && (
          <a className="ad-btn" href={`/api/admin/orders/export?${qs({})}`}>
            Download CSV
          </a>
        )}
      </div>
      <Notice sp={sp} />
      <form className="ad-filters" method="get">
        <label>
          <span className="sr-only">Payment</span>
          <select name="status" defaultValue={status}>
            <option value="">All payments</option>
            <option value="paid">Paid</option>
            <option value="pending">Not paid yet</option>
            <option value="failed">Failed</option>
          </select>
        </label>
        <label>
          <span className="sr-only">Progress</span>
          <select name="fulfilment" defaultValue={fulfilment}>
            <option value="">Any progress</option>
            {FULFILMENT.map((f) => (
              <option key={f} value={f}>
                {PROGRESS[f]}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span className="sr-only">Search</span>
          <input
            type="search"
            name="q"
            defaultValue={q}
            placeholder="Order no., name, phone, email, PIN"
          />
        </label>
        <button className="ad-btn" type="submit">
          Filter
        </button>
        {(status || fulfilment || q) && <Link href="/admin/orders">Clear</Link>}
      </form>

      <div className="ad-table-wrap">
        <table className="ad-table">
          <thead>
            <tr>
              <th scope="col">Order</th>
              <th scope="col">Date</th>
              <th scope="col">Customer</th>
              <th scope="col">Bracelet</th>
              <th scope="col">Payment</th>
              <th scope="col">Progress</th>
              <th scope="col">Total</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td colSpan={7} className="ad-empty">
                  {q || status || fulfilment
                    ? "No orders match these filters."
                    : "No orders yet."}
                </td>
              </tr>
            )}
            {rows.map((o) => (
              <tr key={o.id}>
                <td>
                  <Link className="t-title" href={`/admin/orders/${o.id}`}>
                    {o.ref}
                  </Link>
                  <div className="ad-row-actions">
                    <Link href={`/admin/orders/${o.id}`}>View</Link>
                    <a href={`/api/admin/orders/${o.id}/pdf`}>PDF</a>
                  </div>
                </td>
                <td>{fmt(o.created_at)}</td>
                <td>
                  {o.wearer_first_name} {o.wearer_last_name}
                  <div className="ad-muted">
                    {o.city}, {o.pincode}
                  </div>
                </td>
                <td>
                  {o.bracelet_title}
                  {o.is_gift && <div className="ad-muted">gift</div>}
                </td>
                <td>
                  <span
                    className={`ad-pill ${o.status === "paid" ? "ok" : o.status === "failed" ? "err" : "warn"}`}
                  >
                    {o.status === "pending" ? "not paid" : o.status}
                  </span>
                </td>
                <td>
                  <span
                    className={`ad-pill ${o.fulfilment_status === "delivered" ? "ok" : o.fulfilment_status === "cancelled" ? "err" : "info"}`}
                  >
                    {PROGRESS[o.fulfilment_status] ?? o.fulfilment_status}
                  </span>
                </td>
                <td>
                  {formatINR(o.amount_paise / 100)}
                  {o.coupon_code && <div className="ad-muted">{o.coupon_code}</div>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {pages > 1 && (
        <nav className="ad-pager" aria-label="Pages">
          {page > 1 && (
            <Link href={`/admin/orders?${qs({ page: page - 1 })}`}>
              ← Newer
            </Link>
          )}
          <span>
            Page {page} of {pages} · {total} orders
          </span>
          {page < pages && (
            <Link href={`/admin/orders?${qs({ page: page + 1 })}`}>
              Older →
            </Link>
          )}
        </nav>
      )}
    </>
  );
}
