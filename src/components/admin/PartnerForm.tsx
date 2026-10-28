import Link from "next/link";
import { savePartnerAction } from "@/app/admin/actions";
import type { Partner } from "@/lib/server/partners";

export default function PartnerForm({ partner, siteUrl }: { partner: Partner | null; siteUrl: string }) {
  const p = partner;
  return (
    <form action={savePartnerAction} className="ad-edit">
      <input type="hidden" name="id" value={p?.id ?? ""} />
      <div>
        <section className="ad-box">
          <h2>Partner</h2>
          <div className="ad-box-body">
            <label className="ad-field">
              <span>Name</span>
              <input name="name" required maxLength={100} defaultValue={p?.name ?? ""} placeholder="e.g. Priya Sharma or Shanti Yoga Studio" />
            </label>
            <label className="ad-field">
              <span>Link code</span>
              <input name="code" required maxLength={31} defaultValue={p?.code ?? ""} placeholder="e.g. priya" autoComplete="off" />
              <small>
                Their link will be {siteUrl.replace(/^https?:\/\//, "")}/p/<b>{p?.code ?? "code"}</b>. Lowercase letters, numbers and dashes. Changing it breaks links
                they've already shared.
              </small>
            </label>
            <div className="ad-grid-2">
              <label className="ad-field">
                <span>Phone</span>
                <input name="phone" maxLength={20} defaultValue={p?.phone ?? ""} inputMode="tel" />
              </label>
              <label className="ad-field">
                <span>Email</span>
                <input name="email" type="email" maxLength={200} defaultValue={p?.email ?? ""} />
              </label>
            </div>
            <label className="ad-field">
              <span>Notes (staff only)</span>
              <textarea name="notes" rows={3} maxLength={1000} defaultValue={p?.notes ?? ""} placeholder="Agreement, UPI ID for payouts, anything to remember" />
            </label>
          </div>
        </section>
        <section className="ad-box">
          <h2>Commission</h2>
          <div className="ad-box-body">
            <div className="ad-grid-2">
              <label className="ad-field">
                <span>Type</span>
                <select name="kind" defaultValue={p?.kind ?? "percent"}>
                  <option value="percent">Percentage of what the customer paid</option>
                  <option value="flat">Fixed amount per order (₹)</option>
                </select>
              </label>
              <label className="ad-field">
                <span>Commission</span>
                <input name="rate" type="number" min={0} max={100000} required defaultValue={p?.rate ?? 10} />
                <small>10 means 10% or ₹10 per order.</small>
              </label>
            </div>
            <p className="ad-help">
              Counted on paid orders that aren&apos;t cancelled. A percentage also applies to purposes added after payment. Changing the commission only affects new
              orders.
            </p>
          </div>
        </section>
      </div>
      <div className="ad-side-col">
        <section className="ad-box">
          <h2>Publish</h2>
          <div className="ad-box-body">
            <label className="ad-check">
              <input type="checkbox" name="active" defaultChecked={p ? p.active : true} />
              <span>Link is on (visits are credited)</span>
            </label>
            <div>
              <button type="submit" className="ad-btn is-primary">
                {p ? "Update" : "Add partner"}
              </button>
            </div>
          </div>
        </section>
        <p>
          <Link href="/admin/partners">← All partners</Link>
        </p>
      </div>
    </form>
  );
}
