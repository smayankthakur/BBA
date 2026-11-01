import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Notice from "@/components/admin/Notice";
import { FULFILMENT, getOrder, upgradesFor } from "@/lib/server/orders";
import { bookShipmentAction, labelAction, markShippedAction, sendWhatsAppAction, updateOrderAction } from "@/app/admin/actions";
import CopyText from "@/components/admin/CopyText";
import { activeProvider, manualCourier, manualTrackingUrl, parcel, providerById, shipBlockers } from "@/lib/server/shipping";
import { TEMPLATES, whatsappLog, whatsappProvider } from "@/lib/server/whatsapp";
import { formatINR } from "@/lib/format";
import { INDIAN_STATES } from "@/lib/checkoutSchema";
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

/** Read-only line inside the order form (payment, consent: not editable). */
function Fixed({ label, value, wide }: { label: string; value: React.ReactNode; wide?: boolean }) {
  return (
    <div className={`ad-field is-fixed${wide ? " is-wide" : ""}`}>
      <span>{label}</span>
      <output>{value === null || value === undefined || value === "" ? "—" : value}</output>
    </div>
  );
}
function Text({ label, name, value, max = 120, wide, help, type = "text", inputMode }: {
  label: string; name: string; value: string | null | undefined; max?: number; wide?: boolean; help?: string;
  type?: string; inputMode?: "numeric" | "email" | "text";
}) {
  return (
    <label className={`ad-field${wide ? " is-wide" : ""}`}>
      <span>{label}</span>
      <input type={type} name={name} defaultValue={value ?? ""} maxLength={max} inputMode={inputMode} />
      {help && <small>{help}</small>}
    </label>
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
  const missing = [
    !o.dob_text && "date of birth",
    o.wearer_gender === "unspecified" && "man or woman",
    !o.pincode && "delivery address with PIN code",
    o.wrist === "unsure" && "wrist size",
  ].filter(Boolean) as string[];
  const quickPending = o.status === "paid" && o.order_source === "quick" && missing.length > 0;
  // Staff messages on WhatsApp (opens WhatsApp with the text ready; staff press send).
  const wa = (text: string) => `https://wa.me/91${o.mobile}?text=${encodeURIComponent(text)}`;
  const askDetails = wa(
    `Hi ${name}, thank you for your order ${o.ref} with Bracelet By Ammit! So Ammit Ji can design your ${o.bracelet_title} bracelet and send it, please share:\n${missing.map((m, i) => `${i + 1}. ${m[0].toUpperCase()}${m.slice(1)}`).join("\n")}`,
  );
  const followUp = wa(
    `Hi ${name}, this is Bracelet By Ammit. You started an order for the ${o.bracelet_title} bracelet but the payment didn't go through. Can we help you finish it? Reply here if you have any questions.`,
  );
  const paidTotal = o.amount_paise + (o.upgrade_paise ?? 0);
  const ship = activeProvider();
  const courier = manualCourier();
  const autoLink = !!manualTrackingUrl("X");
  const box = parcel();
  const address = [o.address_line1, o.address_line2, o.landmark ? `Near ${o.landmark}` : ""].filter(Boolean).join(", ");
  const shipCopy: [string, string][] = [
    ["Order ID", o.ref],
    ["Customer name", o.delivery_name || `${o.wearer_first_name} ${o.wearer_last_name}`.trim()],
    ["Phone", o.mobile],
    ["Email", o.email ?? ""],
    ["Address", address],
    ["City", o.city],
    ["State", o.state],
    ["PIN code", o.pincode],
    ["Item", `${o.bracelet_title} crystal bracelet`],
    ["Quantity", "1"],
    ["Invoice value (₹)", String(Math.round((o.amount_paise + (o.upgrade_paise ?? 0)) / 100))],
    ["Payment", "Prepaid"],
    ["Weight (kg)", String(box.weightKg)],
    ["Box (L × B × H cm)", `${box.lengthCm} × ${box.breadthCm} × ${box.heightCm}`],
  ];
  const shippedWith = providerById(o.ship_provider);
  const blockers = shipBlockers(o);
  const waOn = whatsappProvider();
  const waLog = await whatsappLog(o.id);

  return (
    <>
      <div className="ad-head">
        <h1>Order {o.ref}</h1>
        <a className="ad-btn" href={`/api/admin/orders/${o.id}/pdf`}>
          Download staff PDF
        </a>
        <Link className="ad-btn" href={`/admin/orders/${o.id}/card`}>
          Reading card
        </Link>
      </div>
      <p className="ad-sub">
        Placed {fmt(o.created_at)} ·{" "}
        <span className={`ad-pill ${o.status === "paid" ? "ok" : o.status === "failed" ? "err" : "warn"}`}>
          {o.status === "pending" ? "not paid" : o.status}
        </span>
        {o.order_source === "quick" && (
          <>
            {" "}
            · <span className={`ad-pill ${o.details_at ? "ok" : "warn"}`}>{o.details_at ? "details added" : "details missing"}</span>
          </>
        )}
      </p>
      <Notice sp={sp} />
      {quickPending && (
        <p className="ad-help ad-callout">
          Still needed: {missing.join(", ")}.{" "}
          <a href={askDetails} target="_blank" rel="noopener noreferrer">
            Ask on WhatsApp ↗
          </a>{" "}
          When the customer replies, fill it in below and save.
        </p>
      )}
      {o.status !== "paid" && (
        <p className="ad-help ad-callout">
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

      {/* Shipping and WhatsApp */}
      {o.status === "paid" && (
        <div className="ad-order-tools">
          <section className="ad-box">
            <h2>Shipping</h2>
            <div className="ad-box-body">
              {o.tracking_number ? (
                <>
                  <p>
                    <b>{o.courier || "Courier"}</b> · AWB <span className="ad-copy">{o.tracking_number}</span>
                  </p>
                  <div className="ad-actions">
                    {(o.tracking_url || shippedWith) && (
                      <a className="ad-btn" href={o.tracking_url ?? shippedWith!.trackingUrl(o.tracking_number)} target="_blank" rel="noopener noreferrer">
                        Track parcel ↗
                      </a>
                    )}
                    {o.shipment_id && !o.shipment_id.startsWith("booking:") && (
                      <form action={labelAction}>
                        <input type="hidden" name="id" value={o.id} />
                        <button className="ad-btn" type="submit">
                          Print label ↗
                        </button>
                      </form>
                    )}
                  </div>
                </>
              ) : (
                <>
                  {ship && (
                    <>
                      <p className="ad-help">Books the parcel with {ship.name}: courier, pickup and label in one go.</p>
                      {blockers.length > 0 && <p className="ad-help ad-callout">Before booking, fill in: {blockers.join(", ")}.</p>}
                      <form action={bookShipmentAction}>
                        <input type="hidden" name="id" value={o.id} />
                        <button className="ad-btn is-primary" type="submit" disabled={blockers.length > 0}>
                          Book shipment with {ship.name}
                        </button>
                      </form>
                    </>
                  )}
                  <details className="ad-ship" open={!ship}>
                    <summary>
                      Ship with {courier} <small>(book in ProShip, then save the AWB here)</small>
                    </summary>
                    <ol className="ad-steps">
                      <li>In ProShip: Shipments → Create → Forward. Copy these in:</li>
                    </ol>
                    {blockers.filter((b) => b !== "it already has a tracking number").length > 0 && (
                      <p className="ad-help ad-callout">Missing: {blockers.join(", ")}. Fill them in the form below first.</p>
                    )}
                    <dl className="ad-shipcopy">
                      {shipCopy.map(([k, v]) => (
                        <div key={k}>
                          <dt>{k}</dt>
                          <dd>{v ? <CopyText value={v} label={k} /> : <span className="ad-muted">—</span>}</dd>
                        </div>
                      ))}
                    </dl>
                    <ol className="ad-steps" start={2}>
                      <li>After ProShip creates it, type the AWB below. The order moves to Shipped, the customer&apos;s tracking page shows it, and the WhatsApp &ldquo;shipped&rdquo; message goes out.</li>
                    </ol>
                    <form action={markShippedAction} className="ad-ship-form">
                      <input type="hidden" name="id" value={o.id} />
                      <label className="ad-field">
                        <span>Courier</span>
                        <input name="courier" defaultValue={courier} maxLength={80} required />
                      </label>
                      <label className="ad-field">
                        <span>AWB / tracking number</span>
                        <input name="awb" maxLength={40} required pattern="[A-Za-z0-9\- ]{4,40}" autoComplete="off" autoCapitalize="characters" />
                      </label>
                      <label className="ad-field is-wide">
                        <span>Tracking link (optional)</span>
                        <input name="tracking_url" type="url" inputMode="url" maxLength={500} placeholder="https://…" />
                        <small>{autoLink ? "Leave empty to use the standard Prozo tracking link." : "Paste the tracking link from ProShip. If empty, the customer sees the AWB on the Track my order page."}</small>
                      </label>
                      <button className="ad-btn is-primary" type="submit">
                        Mark as shipped
                      </button>
                    </form>
                  </details>
                </>
              )}
            </div>
          </section>
          <section className="ad-box">
            <h2>WhatsApp updates</h2>
            <div className="ad-box-body">
              {waOn ? (
                <div className="ad-actions">
                  {(Object.keys(TEMPLATES) as (keyof typeof TEMPLATES)[]).map((k) => (
                    <form action={sendWhatsAppAction} key={k}>
                      <input type="hidden" name="id" value={o.id} />
                      <input type="hidden" name="kind" value={k} />
                      <button className="ad-btn is-small" type="submit" disabled={k === "shipped" && !o.tracking_number}>
                        Send: {TEMPLATES[k].label}
                      </button>
                    </form>
                  ))}
                </div>
              ) : (
                <p className="ad-help">
                  Automatic messages are off. <Link href="/admin/connections">Connect a WhatsApp service</Link> to send &ldquo;payment received&rdquo;, &ldquo;add your details&rdquo; and &ldquo;shipped&rdquo; automatically.
                </p>
              )}
              {waLog.length > 0 && (
                <ul className="ad-walog">
                  {waLog.map((m) => (
                    <li key={m.id}>
                      <span className={`ad-pill ${m.status === "sent" ? "ok" : "err"}`}>{m.status}</span> {TEMPLATES[m.kind as keyof typeof TEMPLATES]?.label ?? m.kind} · {fmt(m.at)}
                      {m.status !== "sent" && m.detail && <small> · {m.detail.slice(0, 120)}</small>}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>
        </div>
      )}

      {/* Every detail of the order in one form */}
      <form action={updateOrderAction} className="ad-order-form">
        <input type="hidden" name="id" value={o.id} />

        <fieldset className="ad-box">
          <legend>Progress</legend>
          <div className="ad-grid">
            <label className="ad-field">
              <span>Status</span>
              <select name="fulfilment_status" defaultValue={o.fulfilment_status}>
                {FULFILMENT.map((f) => (
                  <option key={f} value={f}>
                    {PROGRESS[f]}
                  </option>
                ))}
              </select>
            </label>
            <Text label="Courier" name="courier" value={o.courier} max={80} />
            <Text label="Tracking number" name="tracking_number" value={o.tracking_number} max={80} />
            <Text label="Tracking link" name="tracking_url" value={o.tracking_url ?? null} max={500} type="url" help="https:// link the customer can open. Optional." />
            <label className="ad-field is-wide">
              <span>Private notes</span>
              <textarea name="admin_notes" rows={3} maxLength={3000} defaultValue={o.admin_notes ?? ""} />
              <small>Only staff see these.</small>
            </label>
          </div>
        </fieldset>

        <fieldset className="ad-box">
          <legend>Wearer and reading</legend>
          <div className="ad-grid">
            <Text label="First name" name="wearer_first_name" value={o.wearer_first_name} max={60} />
            <Text label="Last name" name="wearer_last_name" value={o.wearer_last_name} max={60} />
            <label className="ad-field">
              <span>Date of birth</span>
              <input type="date" name="wearer_dob" defaultValue={o.dob_text ?? ""} />
            </label>
            <label className="ad-field">
              <span>Gender</span>
              <select name="wearer_gender" defaultValue={o.wearer_gender}>
                <option value="unspecified">Not given yet</option>
                <option value="female">Woman</option>
                <option value="male">Man</option>
                <option value="other">Prefer not to say</option>
                {!["unspecified", "female", "male", "other"].includes(o.wearer_gender) && <option value={o.wearer_gender}>{o.wearer_gender}</option>}
              </select>
            </label>
            <Fixed label="Mulank / Bhagyank" value={o.mulank ? `${o.mulank} / ${o.bhagyank}` : null} />
            <Text label="Wrist size" name="wrist" value={o.wrist === "unsure" ? "" : o.wrist} max={20} help="e.g. 15cm. Empty = not sure yet." />
            <Fixed label={`Purposes (${o.purposes?.length || 1})`} value={o.bracelet_title} wide />
            <Text label="What they want help with" name="focus" value={o.focus} max={160} wide />
            <label className="ad-field is-wide">
              <span>Note from the customer</span>
              <textarea name="wearer_note" rows={2} maxLength={500} defaultValue={o.wearer_note ?? ""} />
            </label>
            <Text label="Crystals chosen (Ammit Ji)" name="crystals_chosen" value={o.crystals_chosen} max={400} wide help="Printed on the reading card." />
            <Text label="Note on the reading card" name="reading_notes" value={o.reading_notes} max={400} />
            <label className="ad-check">
              <input type="checkbox" name="is_gift" defaultChecked={o.is_gift} />
              <span>It&apos;s a gift</span>
            </label>
            <Text label="Gift message" name="gift_note" value={o.gift_note} max={240} wide />
          </div>
        </fieldset>

        <fieldset className="ad-box">
          <legend>Delivery</legend>
          <div className="ad-grid">
            <Text label="Deliver to (name)" name="delivery_name" value={o.delivery_name} max={80} />
            <Text label="Mobile (10 digits)" name="mobile" value={o.mobile} max={10} inputMode="numeric" />
            <Text label="Email" name="email" value={o.email} max={120} type="email" />
            <Text label="House / flat, building, street" name="address_line1" value={o.address_line1} wide />
            <Text label="Area" name="address_line2" value={o.address_line2} />
            <Text label="Landmark" name="landmark" value={o.landmark} max={80} />
            <Text label="City" name="city" value={o.city} max={60} />
            <label className="ad-field">
              <span>State</span>
              <select name="state" defaultValue={o.state}>
                <option value="">Choose</option>
                {INDIAN_STATES.map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </select>
            </label>
            <Text label="PIN code" name="pincode" value={o.pincode} max={6} inputMode="numeric" />
            <Fixed
              label="Open"
              value={
                <>
                  <a href={`tel:+91${o.mobile}`}>Call</a> · <a href={wa(`Hi ${name}, `)} target="_blank" rel="noopener noreferrer">WhatsApp ↗</a>
                </>
              }
            />
          </div>
        </fieldset>

        <fieldset className="ad-box">
          <legend>Payment</legend>
          <div className="ad-grid">
            {o.coupon_code ? (
              <>
                <Fixed label="Price" value={formatINR((o.amount_paise + (o.discount_paise ?? 0)) / 100)} />
                <Fixed label="Coupon" value={`${o.coupon_code} (−${formatINR((o.discount_paise ?? 0) / 100)})`} />
              </>
            ) : null}
            <Fixed label="Amount" value={formatINR(o.amount_paise / 100)} />
            {ups.map((up) => (
              <Fixed
                key={up.id}
                label={`Top-up (${up.status})`}
                value={`+ ${up.add_titles.join(" + ")}: ${formatINR(up.amount_paise / 100)}${up.paid_at ? `, paid ${fmt(up.paid_at)}` : ""}`}
              />
            ))}
            {(o.upgrade_paise ?? 0) > 0 && <Fixed label="Total paid" value={formatINR(paidTotal / 100)} />}
            <Fixed label="Paid at" value={fmt(o.paid_at)} />
            <Fixed label="Payment method" value={o.payment_method} />
            {o.partner_code && (
              <Fixed
                label="Partner"
                value={`${o.partner_code} · commission ${formatINR((o.commission_paise ?? 0) / 100)}${o.partner_kind === "percent" ? ` (${o.partner_rate}%)` : ""}`}
              />
            )}
            <Fixed label="Razorpay order" value={<span className="ad-copy">{o.razorpay_order_id}</span>} />
            <Fixed label="Razorpay payment" value={o.razorpay_payment_id ? <span className="ad-copy">{o.razorpay_payment_id}</span> : null} />
          </div>
        </fieldset>

        <fieldset className="ad-box">
          <legend>Consent and source</legend>
          <div className="ad-grid">
            <Fixed label="Terms accepted" value={fmt(o.terms_accepted_at)} />
            <Fixed label="WhatsApp offers" value={o.marketing_opt_in ? "Agreed" : "No"} />
            <Fixed label="Order type" value={o.order_source === "quick" ? `Quick order${o.details_at ? ` · details added ${fmt(o.details_at)}` : ""}` : "60-second reading"} />
            {utm.length > 0 && <Fixed label="Came from" value={utm.map(([k, v]) => `${k.replace(/^utm_/, "")}: ${v}`).join(", ")} wide />}
          </div>
        </fieldset>

        <div className="ad-order-save">
          <button className="ad-btn is-primary" type="submit">
            Save order
          </button>
          {o.updated_at && <small className="ad-help">Last changed {fmt(o.updated_at)}</small>}
          <Link href="/admin/orders">← All orders</Link>
        </div>
      </form>
    </>
  );
}
