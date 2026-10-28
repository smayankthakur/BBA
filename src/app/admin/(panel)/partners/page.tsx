import type { Metadata } from "next";
import Link from "next/link";
import Notice from "@/components/admin/Notice";
import ConfirmButton from "@/components/admin/ConfirmButton";
import { requireAdmin } from "@/lib/server/auth";
import { listPartners } from "@/lib/server/partners";
import { partnerAction } from "@/app/admin/actions";
import { formatINR } from "@/lib/format";

export const metadata: Metadata = { title: "Partners" };
const rs = (paise: number) => formatINR(Math.round(paise) / 100);

export default async function PartnersPage({ searchParams }: { searchParams: Promise<Record<string, string>> }) {
  const sp = await searchParams;
  await requireAdmin("admin");
  const partners = await listPartners();
  const owed = partners.reduce((a, p) => a + Math.max(0, p.earned_paise - p.paid_paise), 0);

  return (
    <>
      <div className="ad-head">
        <h1>Partners</h1>
        <Link className="ad-btn" href="/admin/partners/new">
          Add new
        </Link>
      </div>
      <p className="ad-sub">
        Each partner gets a link. Visitors who come through it are credited to them for 30 days, and you pay the agreed commission on their paid orders.
      </p>
      <Notice sp={sp} />
      {partners.length > 0 && (
        <div className="ad-cards">
          <div className="ad-stat">
            <b>{partners.filter((p) => p.active).length}</b>
            <span>Active partners</span>
          </div>
          <div className="ad-stat">
            <b>{partners.reduce((a, p) => a + p.orders, 0)}</b>
            <span>Paid orders from partners</span>
          </div>
          <div className="ad-stat">
            <b>{rs(partners.reduce((a, p) => a + p.sales_paise, 0))}</b>
            <span>Sales from partners</span>
          </div>
          <div className="ad-stat">
            <b>{rs(owed)}</b>
            <span>Commission still to pay</span>
          </div>
        </div>
      )}
      <div className="ad-table-wrap">
        <table className="ad-table">
          <thead>
            <tr>
              <th scope="col">Partner</th>
              <th scope="col">Commission</th>
              <th scope="col">Visits</th>
              <th scope="col">Orders</th>
              <th scope="col">Earned</th>
              <th scope="col">To pay</th>
            </tr>
          </thead>
          <tbody>
            {partners.length === 0 && (
              <tr>
                <td colSpan={6} className="ad-empty">
                  No partners yet. <Link href="/admin/partners/new">Add the first one</Link>.
                </td>
              </tr>
            )}
            {partners.map((p) => (
              <tr key={p.id}>
                <td>
                  <Link className="t-title" href={`/admin/partners/${p.id}`}>
                    {p.name}
                  </Link>
                  <div className="ad-muted">
                    /p/{p.code} {!p.active && <span className="ad-pill warn">off</span>}
                  </div>
                  <div className="ad-row-actions">
                    <Link href={`/admin/partners/${p.id}`}>Open</Link>
                    <form action={partnerAction}>
                      <input type="hidden" name="id" value={p.id} />
                      <input type="hidden" name="op" value={p.active ? "off" : "on"} />
                      <button className="ad-link-btn">{p.active ? "Switch off" : "Switch on"}</button>
                    </form>
                    <form action={partnerAction}>
                      <input type="hidden" name="id" value={p.id} />
                      <input type="hidden" name="op" value="delete" />
                      <ConfirmButton className="ad-link-btn is-danger" message={`Delete ${p.name}? Their payout history is deleted too. Orders keep the partner code.`}>
                        Delete
                      </ConfirmButton>
                    </form>
                  </div>
                </td>
                <td>{p.kind === "percent" ? `${p.rate}%` : `${formatINR(p.rate)} / order`}</td>
                <td>{p.clicks}</td>
                <td>
                  {p.orders}
                  {p.clicks > 0 && <div className="ad-muted">{((p.orders / p.clicks) * 100).toFixed(1)}% of visits</div>}
                </td>
                <td>
                  {rs(p.earned_paise)}
                  <div className="ad-muted">on {rs(p.sales_paise)} sales</div>
                </td>
                <td>
                  <b>{rs(Math.max(0, p.earned_paise - p.paid_paise))}</b>
                  {p.paid_paise > 0 && <div className="ad-muted">{rs(p.paid_paise)} paid</div>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
