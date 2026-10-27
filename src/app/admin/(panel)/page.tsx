import Link from "next/link";
import { requireAdmin } from "@/lib/server/auth";
import { listOrders, orderStats } from "@/lib/server/orders";
import { adminCounts } from "@/lib/server/catalog";
import { mediaStorageReady } from "@/lib/server/media";
import { razorpayConfigured } from "@/lib/server/razorpay";
import { formatINR } from "@/lib/format";

const fmt = (d: string | Date) =>
  new Intl.DateTimeFormat("en-IN", {
    timeZone: "Asia/Kolkata",
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(d));

export default async function Dashboard({
  searchParams,
}: {
  searchParams: Promise<Record<string, string>>;
}) {
  const sp = await searchParams;
  const user = await requireAdmin();
  const [stats, recent, counts] = await Promise.all([
    orderStats(),
    listOrders({ limit: 8 }),
    adminCounts(),
  ]);
  const count = (kind: string) =>
    counts
      .filter((c) => c.kind === kind && c.status === "published")
      .reduce((a, c) => a + c.n, 0);

  return (
    <>
      <div className="ad-head">
        <h1>Dashboard</h1>
      </div>
      {sp.welcome && (
        <div className="ad-notice" role="status">
          <p>
            Welcome, {user.name}. Your owner account is ready. Invite your team
            from Users.
          </p>
        </div>
      )}
      {sp.denied && (
        <div className="ad-notice is-err" role="alert">
          <p>Your role doesn&apos;t have access to that screen.</p>
        </div>
      )}
      {!razorpayConfigured() && (
        <div className="ad-notice is-warn">
          <p>
            Online payment is not switched on yet: add the Razorpay keys in
            Vercel. Customers see a &ldquo;being switched on&rdquo; message at
            checkout.
          </p>
        </div>
      )}
      {!mediaStorageReady() && (
        <div className="ad-notice is-warn">
          <p>
            Image uploads need Vercel Blob storage connected to the project.
          </p>
        </div>
      )}

      <div className="ad-cards">
        <div className="ad-stat">
          <b>{stats.today}</b>
          <span>Paid orders today</span>
        </div>
        <div className="ad-stat">
          <b>{stats.to_ship}</b>
          <span>Paid, not yet shipped</span>
        </div>
        <div className="ad-stat">
          <b>{stats.paid}</b>
          <span>Paid orders in total</span>
        </div>
        <div className="ad-stat">
          <b>{formatINR(stats.revenue / 100)}</b>
          <span>Revenue (paid)</span>
        </div>
        <div className="ad-stat">
          <b>{stats.pending}</b>
          <span>Started but not paid</span>
        </div>
      </div>

      <div className="ad-two">
        <section className="ad-box">
          <h2>Latest orders</h2>
          <div className="ad-box-body">
            {recent.rows.length === 0 ? (
              <p className="ad-muted">
                No orders yet. They appear here as soon as someone reaches
                checkout.
              </p>
            ) : (
              <ul className="ad-list">
                {recent.rows.map((o) => (
                  <li key={o.id}>
                    <Link href={`/admin/orders/${o.id}`}>
                      <b>{o.ref}</b>
                    </Link>{" "}
                    · {o.bracelet_title} for {o.wearer_first_name} ·{" "}
                    {formatINR(o.amount_paise / 100)} ·{" "}
                    <span
                      className={`ad-pill ${o.status === "paid" ? "ok" : o.status === "failed" ? "err" : "warn"}`}
                    >
                      {o.status}
                    </span>{" "}
                    <span className="ad-muted">{fmt(o.created_at)}</span>
                  </li>
                ))}
              </ul>
            )}
            <div>
              <Link className="ad-btn" href="/admin/orders">
                All orders
              </Link>
            </div>
          </div>
        </section>
        <section className="ad-box">
          <h2>At a glance</h2>
          <div className="ad-box-body">
            <ul className="ad-list">
              <li>
                <Link href="/admin/products?kind=bracelet">
                  {count("bracelet")} bracelets
                </Link>{" "}
                published
              </li>
              <li>
                <Link href="/admin/products?kind=gift">
                  {count("gift")} gifts
                </Link>{" "}
                published
              </li>
              <li>
                <Link href="/admin/pages">Edit page text</Link>
              </li>
              <li>
                <Link href="/admin/media">Media library</Link>
              </li>
            </ul>
            <div className="ad-actions">
              <Link
                className="ad-btn is-primary"
                href="/admin/products/new?kind=bracelet"
              >
                Add a bracelet
              </Link>
              <Link className="ad-btn" href="/admin/products/new?kind=gift">
                Add a gift
              </Link>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
