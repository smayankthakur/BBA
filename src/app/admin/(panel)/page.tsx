import Link from "next/link";
import { requireAdmin, twoStepFor } from "@/lib/server/auth";
import { listOrders, orderStats } from "@/lib/server/orders";
import { adminCounts } from "@/lib/server/catalog";
import { mediaStorageReady } from "@/lib/server/media";
import { razorpayConfigured } from "@/lib/server/razorpay";
import { formatINR } from "@/lib/format";
import { contentUpdatedAt, getContent } from "@/lib/server/content";
import { getBracelets } from "@/lib/server/catalog";
import { insights } from "@/lib/server/insights";

const PERIODS = [
  { days: 7, label: "7 days" },
  { days: 30, label: "30 days" },
  { days: 90, label: "90 days" },
  { days: 0, label: "All time" },
];

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
  const days = PERIODS.some((p) => String(p.days) === sp.days) ? Number(sp.days) : 30;
  const [stats, recent, counts, updated, reviews, ins, bracelets] = await Promise.all([
    orderStats(),
    listOrders({ limit: 8 }),
    adminCounts(),
    contentUpdatedAt(),
    getContent("reviews"),
    insights(days),
    getBracelets(),
  ]);
  const twoStepOff = user.role === "owner" && !(await twoStepFor(user.id)).enabled;
  const titleOf = (slug: string) => bracelets.find((b) => b.slug === slug)?.title ?? slug;
  const topPurpose = Math.max(1, ...ins.byPurpose.map((p) => p.orders));
  const conversion = ins.totals.started ? Math.round((ins.totals.paid / ins.totals.started) * 100) : 0;
  const waText = (o: { ref: string; wearer_first_name: string; delivery_name: string; bracelet_title: string }) =>
    `Hi ${(o.wearer_first_name || o.delivery_name).split(" ")[0]}, this is Bracelet By Ammit. You started an order for the ${o.bracelet_title} bracelet but the payment didn't go through. Can we help you finish it? Reply here if you have any questions.`;
  // Reviews should be refreshed with new Instagram screenshots every week.
  const hasShots = (reviews.shots ?? []).some((x) => x.image);
  const reviewsAt = updated["reviews"] ? new Date(updated["reviews"]) : null;
  const reviewDays = reviewsAt ? Math.floor((Date.now() - reviewsAt.getTime()) / 86_400_000) : null;
  const reviewsDue = !hasShots || reviewDays === null || reviewDays >= 7;
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
      {twoStepOff && (
        <div className="ad-notice is-warn">
          <p>
            Protect the owner account with two-step login (a code from your phone when signing in).{" "}
            <Link href="/admin/account#two-step">Set it up →</Link>
          </p>
        </div>
      )}
      {reviewsDue && (
        <div className="ad-notice is-warn">
          <p>
            {!hasShots
              ? "No Instagram review screenshots yet. The site is showing written reviews until you add some."
              : `Reviews were last updated ${reviewDays} days ago.`}{" "}
            <Link href="/admin/pages/reviews">Add this week&apos;s Instagram screenshots →</Link>
          </p>
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
        <Link className="ad-stat is-link" href="/admin/reading">
          <b>{stats.to_read}</b>
          <span>Waiting for Ammit Ji&apos;s reading</span>
        </Link>
        <Link className={`ad-stat is-link${stats.missing ? " is-warn" : ""}`} href="/admin/orders?missing=1">
          <b>{stats.missing}</b>
          <span>Paid, details still missing</span>
        </Link>
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

      <div className="ad-period">
        <h2>How it&apos;s going</h2>
        <nav aria-label="Period">
          {PERIODS.map((p) => (
            <Link key={p.days} href={`/admin?days=${p.days}`} aria-current={p.days === days ? "page" : undefined}>
              {p.label}
            </Link>
          ))}
        </nav>
      </div>
      <div className="ad-cards">
        <div className="ad-stat">
          <b>{ins.totals.paid}</b>
          <span>Paid orders</span>
        </div>
        <div className="ad-stat">
          <b>{formatINR(ins.totals.revenue / 100)}</b>
          <span>Revenue</span>
        </div>
        <div className="ad-stat">
          <b>{formatINR(ins.totals.aov / 100)}</b>
          <span>Average order</span>
        </div>
        <div className="ad-stat">
          <b>{conversion}%</b>
          <span>
            Checkouts paid ({ins.totals.paid} of {ins.totals.started})
          </span>
        </div>
      </div>

      <div className="ad-two">
        <section className="ad-box">
          <h2>Sales by purpose</h2>
          <div className="ad-box-body">
            {ins.byPurpose.length === 0 ? (
              <p className="ad-muted">No paid orders in this period.</p>
            ) : (
              <table className="ad-table ad-bars">
                <thead>
                  <tr>
                    <th scope="col">Purpose</th>
                    <th scope="col">In bracelets</th>
                    <th scope="col">Revenue (main purpose)</th>
                  </tr>
                </thead>
                <tbody>
                  {ins.byPurpose.map((p) => (
                    <tr key={p.slug}>
                      <td>
                        {titleOf(p.slug)}
                        <span className="ad-bar" style={{ width: `${(p.orders / topPurpose) * 100}%` }} aria-hidden="true" />
                      </td>
                      <td>
                        {p.orders}
                        {p.orders > p.main && <span className="ad-muted"> ({p.orders - p.main} as add-on)</span>}
                      </td>
                      <td>{formatINR(p.revenue / 100)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </section>
        <section className="ad-box">
          <h2>Started but not paid (last 14 days)</h2>
          <div className="ad-box-body">
            {ins.abandoned.length === 0 ? (
              <p className="ad-muted">Nobody has left a checkout unpaid.</p>
            ) : (
              <ul className="ad-list">
                {ins.abandoned.map((o) => (
                  <li key={o.id}>
                    <Link href={`/admin/orders/${o.id}`}>
                      <b>{o.ref}</b>
                    </Link>{" "}
                    · {o.wearer_first_name || o.delivery_name} · {o.bracelet_title} · {formatINR(o.amount_paise / 100)}{" "}
                    <span className="ad-muted">{fmt(o.created_at)}</span>{" "}
                    {o.marketing_opt_in ? (
                      <a href={`https://wa.me/91${o.mobile}?text=${encodeURIComponent(waText(o))}`} target="_blank" rel="noopener noreferrer">
                        Follow up on WhatsApp ↗
                      </a>
                    ) : (
                      <span className="ad-muted">(no WhatsApp opt-in)</span>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      </div>

      <div className="ad-two">
        <section className="ad-box">
          <h2>Top partners</h2>
          <div className="ad-box-body">
            {ins.partners.length === 0 ? (
              <p className="ad-muted">No partner sales in this period.</p>
            ) : (
              <table className="ad-table">
                <thead>
                  <tr>
                    <th scope="col">Partner</th>
                    <th scope="col">Orders</th>
                    <th scope="col">Revenue</th>
                    <th scope="col">Commission</th>
                  </tr>
                </thead>
                <tbody>
                  {ins.partners.map((p) => (
                    <tr key={p.code}>
                      <td>
                        <Link href={`/admin/partners?q=${encodeURIComponent(p.code)}`}>{p.code}</Link>
                      </td>
                      <td>{p.orders}</td>
                      <td>{formatINR(p.revenue / 100)}</td>
                      <td>{formatINR(p.commission / 100)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </section>
        <section className="ad-box">
          <h2>Coupons</h2>
          <div className="ad-box-body">
            {ins.coupons.length === 0 ? (
              <p className="ad-muted">No coupons used in this period.</p>
            ) : (
              <table className="ad-table">
                <thead>
                  <tr>
                    <th scope="col">Code</th>
                    <th scope="col">Orders</th>
                    <th scope="col">Discount given</th>
                    <th scope="col">Revenue</th>
                  </tr>
                </thead>
                <tbody>
                  {ins.coupons.map((c) => (
                    <tr key={c.code}>
                      <td>{c.code}</td>
                      <td>{c.orders}</td>
                      <td>{formatINR(c.discount / 100)}</td>
                      <td>{formatINR(c.revenue / 100)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </section>
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
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
