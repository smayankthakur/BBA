import Link from "next/link";
import { saveCouponAction } from "@/app/admin/actions";
import type { Coupon } from "@/lib/coupon-types";

type B = { slug: string; title: string; priceInr: number };

/** Date (YYYY-MM-DD) in India time, for the date inputs. */
const istDay = (iso: string | null) => (iso ? new Date(new Date(iso).getTime() + 5.5 * 3600_000).toISOString().slice(0, 10) : "");

export default function CouponForm({ coupon, bracelets }: { coupon: Coupon | null; bracelets: B[] }) {
  const c = coupon;
  return (
    <form action={saveCouponAction} className="ad-edit">
      <input type="hidden" name="id" value={c?.id ?? ""} />
      <div>
        <section className="ad-box">
          <h2>Coupon</h2>
          <div className="ad-box-body">
            <label className="ad-field">
              <span>Code</span>
              <input
                name="code"
                required
                maxLength={24}
                pattern="[A-Za-z0-9][A-Za-z0-9_\-]{2,23}"
                defaultValue={c?.code ?? ""}
                placeholder="e.g. DIWALI10"
                autoComplete="off"
                style={{ textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 600 }}
              />
              <small>What customers type at checkout. Letters and numbers, no spaces. Saved in capitals.</small>
            </label>
            <label className="ad-field">
              <span>Internal note</span>
              <input name="description" maxLength={200} defaultValue={c?.description ?? ""} placeholder="e.g. Diwali Instagram campaign" />
              <small>Only staff see this.</small>
            </label>
            <div className="ad-grid-2">
              <label className="ad-field">
                <span>Discount type</span>
                <select name="kind" defaultValue={c?.kind ?? "percent"}>
                  <option value="percent">Percentage (%)</option>
                  <option value="flat">Fixed amount (₹)</option>
                </select>
              </label>
              <label className="ad-field">
                <span>Discount</span>
                <input name="value" type="number" min={1} max={1000000} required defaultValue={c?.value ?? 10} />
                <small>A number: 10 means 10% or ₹10. Percentages go up to 90.</small>
              </label>
            </div>
            <div className="ad-grid-2">
              <label className="ad-field">
                <span>Most it can take off (₹)</span>
                <input name="maxDiscountInr" type="number" min={1} defaultValue={c?.maxDiscountInr ?? ""} placeholder="No cap" />
                <small>Percentage coupons only. Leave empty for no cap.</small>
              </label>
              <label className="ad-field">
                <span>Minimum bracelet price (₹)</span>
                <input name="minOrderInr" type="number" min={0} defaultValue={c?.minOrderInr ?? 0} />
                <small>0 means any price.</small>
              </label>
            </div>
          </div>
        </section>

        <section className="ad-box">
          <h2>When and how often</h2>
          <div className="ad-box-body">
            <div className="ad-grid-2">
              <label className="ad-field">
                <span>Starts on</span>
                <input name="startsAt" type="date" defaultValue={istDay(c?.startsAt ?? null)} />
                <small>Empty = straight away.</small>
              </label>
              <label className="ad-field">
                <span>Ends on (last day it works)</span>
                <input name="endsAt" type="date" defaultValue={istDay(c?.endsAt ?? null)} />
                <small>Empty = never expires. Works until 11:59 pm India time.</small>
              </label>
            </div>
            <div className="ad-grid-2">
              <label className="ad-field">
                <span>Total uses allowed</span>
                <input name="usageLimit" type="number" min={1} defaultValue={c?.usageLimit ?? ""} placeholder="Unlimited" />
                <small>Counts paid orders.</small>
              </label>
              <label className="ad-field">
                <span>Uses per customer</span>
                <input name="perCustomerLimit" type="number" min={1} defaultValue={c?.perCustomerLimit ?? ""} placeholder="Unlimited" />
                <small>Matched by mobile number. 1 = once per customer.</small>
              </label>
            </div>
          </div>
        </section>

        <section className="ad-box">
          <h2>Which bracelets</h2>
          <div className="ad-box-body">
            <p className="ad-help">Tick nothing for every bracelet, or tick only the ones this coupon is for.</p>
            <div className="ad-grid-2">
              {bracelets.map((b) => (
                <label className="ad-check" key={b.slug}>
                  <input type="checkbox" name="products" value={b.slug} defaultChecked={c?.products.includes(b.slug)} />
                  <span>
                    {b.title} <span className="ad-muted">· ₹{b.priceInr.toLocaleString("en-IN")}</span>
                  </span>
                </label>
              ))}
            </div>
          </div>
        </section>
      </div>

      <div className="ad-side-col">
        <section className="ad-box">
          <h2>Publish</h2>
          <div className="ad-box-body">
            <label className="ad-check">
              <input type="checkbox" name="active" defaultChecked={c ? c.active : true} />
              <span>Switched on (customers can use it)</span>
            </label>
            {c && (
              <p className="ad-help">
                Used on {c.used} paid order{c.used === 1 ? "" : "s"}, ₹{c.discountGivenInr.toLocaleString("en-IN")} given in discounts.
              </p>
            )}
            <div>
              <button type="submit" className="ad-btn is-primary">
                {c ? "Update" : "Create coupon"}
              </button>
            </div>
          </div>
        </section>
        <p>
          <Link href="/admin/coupons">← All coupons</Link>
        </p>
      </div>
    </form>
  );
}
