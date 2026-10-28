import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Notice from "@/components/admin/Notice";
import { FULFILMENT, getOrder, upgradesFor } from "@/lib/server/orders";
import { updateOrderAction } from "@/app/admin/actions";
import { formatINR } from "@/lib/format";
import { PROGRESS } from "@/lib/orderProgress";

export const metadata: Metadata = { title: "Order" };

const fmt = (d: string | Date | null) =>
  d
    ? new Intl.DateTimeFormat("en-IN", {
        timeZone: "Asia/Kolkata",
        day: "numeric",
        month: "long",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
      }).format(new Date(d))
    : "—";
const dob = (s: string) => {
  const [y, m, d] = s.split("-");
  return y && m && d ? `${d}/${m}/${y}` : s;
};

function Row({ k, v }: { k: string; v: React.ReactNode }) {
  return (
    <>
      <dt>{k}</dt>
      <dd>{v === null || v === undefined || v === "" ? "—" : v}</dd>
    </>
  );
}

export default async function OrderPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string>>;
}) {
  const [{ id }, sp] = await Promise.all([params, searchParams]);
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const o = await getOrder(id);
  if (!o) notFound();
  const utm = Object.entries(o.utm ?? {}).filter(([, v]) => v);
  const ups = await upgradesFor(o.id);
  const name = o.wearer_first_name || o.delivery_name;
  const quickPending = o.status === "paid" && o.order_source === "quick" && !o.details_at;
  // Staff messages on WhatsApp (opens WhatsApp with the text ready; staff press send).
  const wa = (text: string) => `https://wa.me/91${o.mobile}?text=${encodeURIComponent(text)}`;
  const askDetails = wa(
    `Hi ${name}, thank you for your order ${o.ref} with Bracelet By Ammit! So Ammit Ji can design your ${o.bracelet_title} bracelet, could you tell us:\n1. Is the bracelet for a man or a woman?\n2. What would you most like help with?${o.wrist === "unsure" ? "\n3. Your wrist size (or a photo of a thread around your wrist next to a ruler)" : ""}`,
  );
  const followUp = wa(
    `Hi ${name}, this is Bracelet By Ammit. You started an order for the ${o.bracelet_title} bracelet but the payment didn't go through. Can we help you finish it? Reply here if you have any questions.`,
  );

  return (
    <>
      <div className="ad-head">
        <h1>Order {o.ref}</h1>
        <a className="ad-btn" href={`/api/admin/orders/${o.id}/pdf`}>
          Download staff PDF
        </a>
      </div>
      <p className="ad-sub">
        Placed {fmt(o.created_at)} ·{" "}
        <span
          className={`ad-pill ${o.status === "paid" ? "ok" : o.status === "failed" ? "err" : "warn"}`}
        >
          {o.status === "pending" ? "not paid" : o.status}
        </span>
      </p>
      <Notice sp={sp} />
      {quickPending && (
        <p className="ad-help">
          Quick order: the customer hasn&apos;t added gender and what they want help with.{" "}
          <a href={askDetails} target="_blank" rel="noopener noreferrer">
            Ask on WhatsApp ↗
          </a>
        </p>
      )}
      {o.status !== "paid" && (
        <p className="ad-help">
          Not paid yet.{" "}
          {o.marketing_opt_in ? (
            <a href={followUp} target="_blank" rel="noopener noreferrer">
              Follow up on WhatsApp ↗
            </a>
          ) : (
            "The customer didn't agree to WhatsApp messages, so don't follow up."
          )}
        </p>
      )}

      <div className="ad-edit">
        <div>
          <section className="ad-box">
            <h2>Reading details</h2>
            <div className="ad-box-body">
              <dl className="ad-dl">
                <Row
                  k="Wearer"
                  v={`${o.wearer_first_name} ${o.wearer_last_name}`}
                />
                <Row k="Date of birth" v={dob(o.dob_text)} />
                <Row k="Gender" v={o.wearer_gender === "unspecified" ? "Not given yet" : o.wearer_gender} />
                <Row k="Mulank" v={o.mulank} />
                <Row k="Bhagyank" v={o.bhagyank} />
                <Row k="Wrist size" v={o.wrist} />
                <Row k="Intentions" v={(o.intentions ?? []).join(", ")} />
                <Row k="Focus" v={o.focus} />
                <Row k="Note from customer" v={o.wearer_note} />
                {o.order_source === "quick" && (
                  <Row k="Order type" v={o.details_at ? `Quick order · details added ${fmt(o.details_at)}` : "Quick order · details not added yet"} />
                )}
              </dl>
            </div>
          </section>
          <section className="ad-box">
            <h2>Bracelet and payment</h2>
            <div className="ad-box-body">
              <dl className="ad-dl">
                <Row k={`Purposes (${o.purposes?.length || 1})`} v={o.bracelet_title} />
                {o.coupon_code ? (
                  <>
                    <Row k="Price" v={formatINR((o.amount_paise + (o.discount_paise ?? 0)) / 100)} />
                    <Row k="Coupon" v={`${o.coupon_code} (−${formatINR((o.discount_paise ?? 0) / 100)})`} />
                    <Row k="Amount paid" v={formatINR(o.amount_paise / 100)} />
                  </>
                ) : (
                  <Row k="Amount" v={formatINR(o.amount_paise / 100)} />
                )}
                {ups.map((u) => (
                  <Row
                    key={u.id}
                    k={`Top-up (${u.status})`}
                    v={`+ ${u.add_titles.join(" + ")}: ${formatINR(u.amount_paise / 100)}${u.paid_at ? `, paid ${fmt(u.paid_at)}` : ""}`}
                  />
                ))}
                {(o.upgrade_paise ?? 0) > 0 && <Row k="Total paid" v={formatINR((o.amount_paise + (o.upgrade_paise ?? 0)) / 100)} />}
                {o.partner_code && (
                  <Row
                    k="Partner"
                    v={`${o.partner_code} · commission ${formatINR((o.commission_paise ?? 0) / 100)}${o.partner_kind === "percent" ? ` (${o.partner_rate}%)` : ""}`}
                  />
                )}
                <Row k="Gift" v={o.is_gift ? "Yes" : "No"} />
                {o.is_gift && <Row k="Gift message" v={o.gift_note} />}
                <Row k="Paid at" v={fmt(o.paid_at)} />
                <Row k="Payment method" v={o.payment_method} />
                <Row
                  k="Razorpay order"
                  v={<span className="ad-copy">{o.razorpay_order_id}</span>}
                />
                <Row
                  k="Razorpay payment"
                  v={
                    o.razorpay_payment_id ? (
                      <span className="ad-copy">{o.razorpay_payment_id}</span>
                    ) : null
                  }
                />
              </dl>
            </div>
          </section>
          <section className="ad-box">
            <h2>Delivery</h2>
            <div className="ad-box-body">
              <dl className="ad-dl">
                <Row k="Name" v={o.delivery_name} />
                <Row
                  k="Mobile"
                  v={<a href={`tel:+91${o.mobile}`}>{o.mobile}</a>}
                />
                <Row
                  k="Email"
                  v={
                    o.email ? <a href={`mailto:${o.email}`}>{o.email}</a> : null
                  }
                />
                <Row
                  k="Address"
                  v={
                    <>
                      {[o.address_line1, o.address_line2]
                        .filter(Boolean)
                        .join(", ")}
                      {o.landmark && (
                        <>
                          <br />
                          Landmark: {o.landmark}
                        </>
                      )}
                      <br />
                      {o.city}, {o.state} {o.pincode}
                    </>
                  }
                />
                <Row
                  k="Marketing messages"
                  v={o.marketing_opt_in ? "Agreed" : "No"}
                />
                <Row k="Terms accepted" v={fmt(o.terms_accepted_at)} />
                {utm.length > 0 && (
                  <Row
                    k="Came from"
                    v={utm
                      .map(([k, v]) => `${k.replace(/^utm_/, "")}: ${v}`)
                      .join(", ")}
                  />
                )}
              </dl>
            </div>
          </section>
        </div>

        <div className="ad-side-col">
          <form action={updateOrderAction} className="ad-box">
            <h2>Progress</h2>
            <div className="ad-box-body">
              <input type="hidden" name="id" value={o.id} />
              <label className="ad-field">
                <span>Status</span>
                <select
                  name="fulfilment_status"
                  defaultValue={o.fulfilment_status}
                >
                  {FULFILMENT.map((f) => (
                    <option key={f} value={f}>
                      {PROGRESS[f]}
                    </option>
                  ))}
                </select>
              </label>
              <label className="ad-field">
                <span>Courier</span>
                <input
                  name="courier"
                  maxLength={80}
                  defaultValue={o.courier ?? ""}
                  placeholder="e.g. Delhivery"
                />
              </label>
              <label className="ad-field">
                <span>Tracking number</span>
                <input
                  name="tracking_number"
                  maxLength={80}
                  defaultValue={o.tracking_number ?? ""}
                />
              </label>
              <label className="ad-field">
                <span>Private notes</span>
                <textarea
                  name="admin_notes"
                  rows={5}
                  maxLength={3000}
                  defaultValue={o.admin_notes ?? ""}
                />
                <small>Only staff see these.</small>
              </label>
              <button className="ad-btn is-primary" type="submit">
                Save
              </button>
              {o.updated_at && (
                <small className="ad-help">
                  Last changed {fmt(o.updated_at)}
                </small>
              )}
            </div>
          </form>
          <p>
            <Link href="/admin/orders">← All orders</Link>
          </p>
        </div>
      </div>
    </>
  );
}
