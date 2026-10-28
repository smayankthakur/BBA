import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Notice from "@/components/admin/Notice";
import PartnerForm from "@/components/admin/PartnerForm";
import CopyField from "@/components/admin/CopyField";
import ConfirmButton from "@/components/admin/ConfirmButton";
import { requireAdmin } from "@/lib/server/auth";
import { getPartner, partnerClicksByDay, partnerOrders, partnerPayouts } from "@/lib/server/partners";
import { addPayoutAction, deletePayoutAction } from "@/app/admin/actions";
import { formatINR } from "@/lib/format";
import { PROGRESS } from "@/lib/orderProgress";
import { SITE_URL } from "@/lib/site";

export const metadata: Metadata = { title: "Partner" };
const rs = (paise: number) => formatINR(Math.round(paise) / 100);
const day = (d: string | Date) => new Intl.DateTimeFormat("en-IN", { timeZone: "Asia/Kolkata", day: "numeric", month: "short", year: "numeric" }).format(new Date(d));

export default async function PartnerPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<Record<string, string>> }) {
  const [{ id }, sp] = await Promise.all([params, searchParams]);
  await requireAdmin("admin");
  const p = await getPartner(id);
  if (!p) notFound();
  const [orders, payouts, clicks] = await Promise.all([partnerOrders(p.code), partnerPayouts(p.id), partnerClicksByDay(p.code)]);
  const balance = Math.max(0, p.earned_paise - p.paid_paise);
  const link = `${SITE_URL}/p/${p.code}`;
  const clicks30 = clicks.reduce((a, c) => a + c.n, 0);
  const today = new Date(Date.now() + 5.5 * 3600_000).toISOString().slice(0, 10);

  return (
    <>
      <div className="ad-head">
        <h1>{p.name}</h1>
        {!p.active && <span className="ad-pill warn">link off</span>}
      </div>
      <Notice sp={sp} />

      <section className="ad-box" style={{ maxWidth: 860 }}>
        <h2>Their links</h2>
        <div className="ad-box-body">
          <CopyField value={link} label="Partner link" />
          <p className="ad-help">
            They can also add <code>?ref={p.code}</code> to any page, e.g. {SITE_URL.replace(/^https?:\/\//, "")}/bracelets/love-life?ref={p.code}, or link straight to
            the reading: {SITE_URL.replace(/^https?:\/\//, "")}/p/{p.code}?to=/find-your-bracelet
          </p>
        </div>
      </section>

      <div className="ad-cards">
        <div className="ad-stat">
          <b>{p.clicks}</b>
          <span>Visits ({clicks30} in the last 30 days)</span>
        </div>
        <div className="ad-stat">
          <b>{p.orders}</b>
          <span>Paid orders</span>
        </div>
        <div className="ad-stat">
          <b>{rs(p.sales_paise)}</b>
          <span>Sales</span>
        </div>
        <div className="ad-stat">
          <b>{rs(p.earned_paise)}</b>
          <span>Commission earned</span>
        </div>
        <div className="ad-stat">
          <b>{rs(balance)}</b>
          <span>Still to pay</span>
        </div>
      </div>

      <section className="ad-box">
        <h2>Orders from their link</h2>
        <div className="ad-table-wrap" style={{ border: 0 }}>
          <table className="ad-table">
            <thead>
              <tr>
                <th scope="col">Order</th>
                <th scope="col">Date</th>
                <th scope="col">Bracelet</th>
                <th scope="col">Status</th>
                <th scope="col">Paid</th>
                <th scope="col">Commission</th>
              </tr>
            </thead>
            <tbody>
              {orders.length === 0 && (
                <tr>
                  <td colSpan={6} className="ad-empty">
                    No orders yet.
                  </td>
                </tr>
              )}
              {orders.map((o) => {
                const counts = o.status === "paid" && o.fulfilment_status !== "cancelled";
                return (
                  <tr key={o.id}>
                    <td>
                      <Link href={`/admin/orders/${o.id}`}>{o.ref}</Link>
                    </td>
                    <td>{day(o.created_at)}</td>
                    <td>
                      {o.bracelet_title}
                      <div className="ad-muted">
                        {o.wearer_first_name}, {o.city}
                      </div>
                    </td>
                    <td>
                      <span className={`ad-pill ${o.status === "paid" ? "ok" : o.status === "failed" ? "err" : "warn"}`}>{o.status === "pending" ? "not paid" : o.status}</span>
                      {o.status === "paid" && <div className="ad-muted">{PROGRESS[o.fulfilment_status] ?? o.fulfilment_status}</div>}
                    </td>
                    <td>{o.status === "paid" ? rs(o.amount_paise + o.upgrade_paise) : "—"}</td>
                    <td>{counts ? rs(o.commission_paise) : <span className="ad-muted">not counted</span>}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <div className="ad-two">
        <section className="ad-box">
          <h2>Payouts</h2>
          <div className="ad-box-body">
            {payouts.length === 0 ? (
              <p className="ad-muted">Nothing paid yet.</p>
            ) : (
              <ul className="ad-list">
                {payouts.map((y) => (
                  <li key={y.id}>
                    <b>{rs(y.amount_paise)}</b> on {day(y.paid_on)}
                    {y.reference && <span className="ad-muted"> · {y.reference}</span>}
                    {y.note && <div className="ad-muted">{y.note}</div>}
                    <form action={deletePayoutAction}>
                      <input type="hidden" name="id" value={p.id} />
                      <input type="hidden" name="payout" value={y.id} />
                      <ConfirmButton className="ad-link-btn is-danger" message="Delete this payout record?">
                        Delete
                      </ConfirmButton>
                    </form>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
        <section className="ad-box">
          <h2>Record a payout</h2>
          <form action={addPayoutAction} className="ad-box-body">
            <input type="hidden" name="id" value={p.id} />
            <label className="ad-field">
              <span>Amount (₹)</span>
              <input name="amount" type="number" min={1} step="0.01" required defaultValue={balance > 0 ? Math.round(balance) / 100 : ""} />
            </label>
            <label className="ad-field">
              <span>Paid on</span>
              <input name="paidOn" type="date" required defaultValue={today} />
            </label>
            <label className="ad-field">
              <span>Reference</span>
              <input name="reference" maxLength={120} placeholder="UPI / bank transaction ID" />
            </label>
            <label className="ad-field">
              <span>Note</span>
              <input name="note" maxLength={300} />
            </label>
            <div>
              <button className="ad-btn is-primary" type="submit">
                Record payout
              </button>
            </div>
          </form>
        </section>
      </div>

      <h2 className="ad-sub" style={{ marginTop: 24, fontWeight: 700 }}>
        Details
      </h2>
      <PartnerForm key={p.code + p.active + p.rate} partner={p} siteUrl={SITE_URL} />
    </>
  );
}
