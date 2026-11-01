import type { Metadata } from "next";
import { requireAdmin } from "@/lib/server/auth";
import { razorpayConfigured } from "@/lib/server/razorpay";
import { staffEmailConfigured } from "@/lib/server/staffNotify";
import { PROVIDERS } from "@/lib/server/shipping";
import { TEMPLATES, whatsappProvider } from "@/lib/server/whatsapp";
import { GA_ID, META_PIXEL_ID } from "@/lib/analytics";

export const metadata: Metadata = { title: "Connections" };

function Status({ on, label }: { on: boolean; label?: string }) {
  return <span className={`ad-pill ${on ? "ok" : "warn"}`}>{label ?? (on ? "Connected" : "Not connected")}</span>;
}
function Env({ names }: { names: string[] }) {
  return (
    <p className="ad-help">
      Set in Vercel → Project → Settings → Environment Variables, then redeploy:{" "}
      {names.map((n, i) => (
        <span key={n}>
          {i > 0 && ", "}
          <code>{n}</code>
        </span>
      ))}
    </p>
  );
}

/** What the site is connected to, and how to connect the rest. Shows no secrets. */
export default async function ConnectionsPage() {
  await requireAdmin("admin");
  const wa = whatsappProvider();
  const mail = await staffEmailConfigured();
  const cron = !!process.env.CRON_SECRET;
  return (
    <>
      <div className="ad-head">
        <h1>Connections</h1>
      </div>
      <p className="ad-sub">Outside services the website uses. Keys are never shown here; they live in Vercel.</p>

      <div className="ad-conn">
        <section className="ad-box">
          <h2>
            Online payment (Razorpay) <Status on={razorpayConfigured()} />
          </h2>
          <div className="ad-box-body">
            <p>Card, UPI and net banking at checkout. Until it&apos;s connected, orders are sent to you on WhatsApp instead.</p>
            <Env names={["RAZORPAY_KEY_ID", "RAZORPAY_KEY_SECRET", "NEXT_PUBLIC_RAZORPAY_KEY_ID", "RAZORPAY_WEBHOOK_SECRET"]} />
          </div>
        </section>

        <section className="ad-box">
          <h2>
            Order emails to staff (Resend) <Status on={mail} />
          </h2>
          <div className="ad-box-body">
            <p>The staff PDF for every paid order, and a second email when the customer adds their details. Recipients: Settings → Order emails.</p>
            <Env names={["RESEND_API_KEY", "ORDER_EMAIL_FROM"]} />
          </div>
        </section>

        <section className="ad-box">
          <h2>
            Shipping {PROVIDERS.map((p) => <Status key={p.id} on={p.configured()} label={`${p.name}: ${p.configured() ? "connected" : "not connected"}`} />)}
          </h2>
          <div className="ad-box-body">
            <p>
              Book the courier, pickup and label from an order in one click; the tracking number fills itself in and the customer sees it on <b>Track my
              order</b>. In Shiprocket: Settings → API → Configure → create an API user (a separate email from your login). The pickup location name must
              match one in Shiprocket (Settings → Pickup addresses).
            </p>
            <Env names={["SHIPROCKET_EMAIL", "SHIPROCKET_PASSWORD", "SHIPROCKET_PICKUP"]} />
            <p className="ad-help">Parcel size used for every booking (change if your box differs): 12 × 10 × 5 cm, 0.15 kg (SHIP_LENGTH_CM, SHIP_BREADTH_CM, SHIP_HEIGHT_CM, SHIP_WEIGHT_KG).</p>
          </div>
        </section>

        <section className="ad-box">
          <h2>
            Automatic WhatsApp <Status on={!!wa} label={wa ? `Connected (${wa === "interakt" ? "Interakt" : "AiSensy"})` : undefined} />
          </h2>
          <div className="ad-box-body">
            <p>
              Sent automatically: <b>payment received</b> (right after payment), <b>please add your details</b> (once, a few hours after payment if the
              birth date or address is still missing; checked daily at 10:00), and <b>shipped</b> (when a shipment is booked or an order is moved to
              Shipped with a tracking number). Each can also be sent by hand from the order page.
            </p>
            <p className="ad-help">
              Create these templates in Interakt (or campaigns in AiSensy) and get them approved by WhatsApp. Use these names, or set WA_PAID, WA_DETAILS,
              WA_SHIPPED to yours. Variables are filled in order.
            </p>
            <table className="ad-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Message (sample)</th>
                  <th>Variables</th>
                </tr>
              </thead>
              <tbody>
                {Object.values(TEMPLATES).map((t) => (
                  <tr key={t.name}>
                    <td>
                      <code>{t.name}</code>
                    </td>
                    <td>{t.sample}</td>
                    <td>{t.params.map((p, i) => `{{${i + 1}}} ${p}`).join(" · ")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <Env names={["WHATSAPP_PROVIDER (interakt or aisensy)", "INTERAKT_API_KEY or AISENSY_API_KEY", "CRON_SECRET (daily reminder)"]} />
            {!cron && <p className="ad-help ad-callout">The daily &ldquo;add your details&rdquo; check needs CRON_SECRET set in Vercel.</p>}
          </div>
        </section>

        <section className="ad-box">
          <h2>
            Analytics <Status on={!!(GA_ID || META_PIXEL_ID)} label={GA_ID || META_PIXEL_ID ? [GA_ID && "Google Analytics", META_PIXEL_ID && "Meta Pixel"].filter(Boolean).join(" + ") : undefined} />
          </h2>
          <div className="ad-box-body">
            <p>
              Loads only after a visitor accepts cookies. Tracked: page views, bracelet viewed, order form opened, checkout started, payment, details
              added, WhatsApp order. In Google Analytics, build a funnel from <i>view_item → order_sheet_open → begin_checkout → purchase</i>.
            </p>
            <Env names={["NEXT_PUBLIC_GA_ID (G-…)", "NEXT_PUBLIC_META_PIXEL_ID"]} />
          </div>
        </section>
      </div>
    </>
  );
}
