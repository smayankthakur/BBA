import type { Metadata } from "next";
import Link from "next/link";
import Notice from "@/components/admin/Notice";
import ConfirmButton from "@/components/admin/ConfirmButton";
import { requireAdmin } from "@/lib/server/auth";
import { listCoupons } from "@/lib/server/coupons";
import { couponAction } from "@/app/admin/actions";
import { couponLabel, couponState } from "@/lib/coupon-types";

export const metadata: Metadata = { title: "Coupons" };

const day = (iso: string | null) =>
  iso ? new Intl.DateTimeFormat("en-IN", { timeZone: "Asia/Kolkata", day: "numeric", month: "short", year: "numeric" }).format(new Date(iso)) : null;
const STATE = {
  active: ["ok", "Active"],
  scheduled: ["info", "Scheduled"],
  expired: ["err", "Expired"],
  "used-up": ["warn", "Used up"],
  off: ["warn", "Off"],
} as const;

export default async function CouponsPage({ searchParams }: { searchParams: Promise<Record<string, string>> }) {
  const sp = await searchParams;
  await requireAdmin("admin");
  const coupons = await listCoupons();

  return (
    <>
      <div className="ad-head">
        <h1>Coupons</h1>
        <Link className="ad-btn" href="/admin/coupons/new">
          Add new
        </Link>
      </div>
      <p className="ad-sub">Discount codes customers can enter at checkout. The discount is checked on the server, so nobody can change it.</p>
      <Notice sp={sp} />
      <div className="ad-table-wrap">
        <table className="ad-table">
          <thead>
            <tr>
              <th scope="col">Code</th>
              <th scope="col">Discount</th>
              <th scope="col">Used</th>
              <th scope="col">Valid</th>
              <th scope="col">Status</th>
            </tr>
          </thead>
          <tbody>
            {coupons.length === 0 && (
              <tr>
                <td colSpan={5} className="ad-empty">
                  No coupons yet. <Link href="/admin/coupons/new">Create the first one</Link>.
                </td>
              </tr>
            )}
            {coupons.map((c) => {
              const [tone, label] = STATE[couponState(c)];
              return (
                <tr key={c.id}>
                  <td>
                    <Link className="t-title" href={`/admin/coupons/${c.id}`}>
                      {c.code}
                    </Link>
                    {c.description && <div className="ad-muted">{c.description}</div>}
                    <div className="ad-row-actions">
                      <Link href={`/admin/coupons/${c.id}`}>Edit</Link>
                      <form action={couponAction}>
                        <input type="hidden" name="id" value={c.id} />
                        <input type="hidden" name="op" value={c.active ? "off" : "on"} />
                        <button className="ad-link-btn">{c.active ? "Switch off" : "Switch on"}</button>
                      </form>
                      <form action={couponAction}>
                        <input type="hidden" name="id" value={c.id} />
                        <input type="hidden" name="op" value="delete" />
                        <ConfirmButton className="ad-link-btn is-danger" message={`Delete coupon ${c.code}? Customers won't be able to use it.`}>
                          Delete
                        </ConfirmButton>
                      </form>
                    </div>
                  </td>
                  <td>
                    {couponLabel(c)}
                    <div className="ad-muted">
                      {c.products.length ? `${c.products.length} bracelet${c.products.length > 1 ? "s" : ""}` : "All bracelets"}
                      {c.minOrderInr > 0 && ` · min ₹${c.minOrderInr.toLocaleString("en-IN")}`}
                    </div>
                  </td>
                  <td>
                    {c.used}
                    {c.usageLimit != null && ` / ${c.usageLimit}`}
                    {c.perCustomerLimit != null && <div className="ad-muted">{c.perCustomerLimit} per customer</div>}
                    {c.discountGivenInr > 0 && <div className="ad-muted">₹{c.discountGivenInr.toLocaleString("en-IN")} off in total</div>}
                  </td>
                  <td>
                    {!c.startsAt && !c.endsAt ? (
                      "Always"
                    ) : (
                      <>
                        {day(c.startsAt) ?? "Now"} – {day(c.endsAt) ?? "no end"}
                      </>
                    )}
                  </td>
                  <td>
                    <span className={`ad-pill ${tone}`}>{label}</span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="ad-help">Deleting a coupon stops it working. Orders that already used it keep the code and discount.</p>
    </>
  );
}
