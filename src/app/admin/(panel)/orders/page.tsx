import type { Metadata } from "next";
import Link from "next/link";
import Notice from "@/components/admin/Notice";
import { requireAdmin, roleAtLeast } from "@/lib/server/auth";
import { FULFILMENT, listOrders } from "@/lib/server/orders";
import { formatINR } from "@/lib/format";
import { bulkStatusAction } from "@/app/admin/actions";
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
  const missing = sp.missing === "1";
  const page = Math.max(1, Math.min(1000, Number(sp.page) || 1));
  const { rows, total } = await listOrders({
    status,
    fulfilment,
    q,
    missing,
    limit: PER_PAGE,
    offset: (page - 1) * PER_PAGE,
  });
  const pages = Math.max(1, Math.ceil(total / PER_PAGE));
  const qs = (extra: Record<string, string | number>) => {
    const p = new URLSearchParams({
      ...(status && { status }),
      ...(fulfilment && { fulfilment }),
      ...(q && { q }),
      ...(missing && { missing: "1" }),
    });
    for (const [k, v] of Object.entries(extra)) p.set(k, String(v));
    return p.toString();
  };

  return (
    <>
      <div className="ad-head">
        <h1>Orders</h1>
        <Link className="ad-btn" href="/admin/orders/board">
          Board view
        </Link>
        {roleAtLeast(user.role, "admin") && (
          <>
            <a className="ad-btn" href={`/api/admin/orders/export?${qs({})}`}>
              Download CSV
            </a>
            <a className="ad-btn" href="/api/admin/customers/export" title="Customers who paid and agreed to WhatsApp offers">
              Marketing list (opted in)
            </a>
          </>
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
        <label className="ad-check">
          <input type="checkbox" name="missing" value="1" defaultChecked={missing} />
          <span>Details missing</span>
        </label>
        <button className="ad-btn" type="submit">
          Filter
        </button>
        {(status || fulfilment || q || missing) && <Link href="/admin/orders">Clear</Link>}
      </form>

      <form action={bulkStatusAction} id="bulk">
        <input type="hidden" name="back" value={`/admin/orders?${qs({ page })}`} />
        <div className="ad-bulk">
          <label>
            <span>Move ticked orders to</span>
            <select name="to" defaultValue="reading">
              {FULFILMENT.map((f) => (
                <option key={f} value={f}>
                  {PROGRESS[f]}
                </option>
              ))}
            </select>
          </label>
          <button className="ad-btn" type="submit">
            Move
          </button>
        </div>
      </form>

      <div className="ad-table-wrap">
        <table className="ad-table ad-orders">
          <thead>
            <tr>
              <th scope="col" className="ad-tick">
                <span className="sr-only">Select</span>
              </th>
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
                <td colSpan={8} className="ad-empty">
                  {q || status || fulfilment || missing
                    ? "No orders match these filters."
                    : "No orders yet."}
                </td>
              </tr>
            )}
            {rows.map((o) => (
              <tr key={o.id}>
                <td className="ad-tick">
                  <input type="checkbox" name="ids" value={o.id} form="bulk" aria-label={`Select ${o.ref}`} />
                </td>
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
                  {o.status === "paid" && (!o.dob_text || !o.pincode) && <div className="ad-pill warn">details missing</div>}
                </td>
                <td>
                  {formatINR((o.amount_paise + (o.upgrade_paise ?? 0)) / 100)}
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
