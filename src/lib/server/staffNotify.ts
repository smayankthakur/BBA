import "server-only";
import { buildOrderPdf, orderSections } from "./orderPdf";
import { claimStaffNotification, releaseStaffNotification, type StoredOrder } from "./orders";

/**
 * Emails the staff-only order sheet (PDF attached) to the team when an order
 * is paid. Sent once per order; customers never receive or see this PDF.
 *
 * Env: RESEND_API_KEY, STAFF_ORDER_EMAILS (comma-separated),
 *      ORDER_EMAIL_FROM (optional, e.g. "Bracelet By Ammit <orders@yourdomain.in>")
 */
const KEY = process.env.RESEND_API_KEY ?? "";
const TO = (process.env.STAFF_ORDER_EMAILS ?? "")
  .split(",")
  .map((s) => s.trim())
  .filter((s) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s));
const FROM = process.env.ORDER_EMAIL_FROM || "Bracelet By Ammit <onboarding@resend.dev>";
const API = process.env.RESEND_API_BASE || "https://api.resend.com";

export const staffEmailConfigured = () => !!KEY && TO.length > 0;

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

export async function notifyStaffOfPaidOrder(razorpayOrderId: string) {
  if (!staffEmailConfigured()) {
    console.warn("[staff-email] not configured: set RESEND_API_KEY and STAFF_ORDER_EMAILS");
    return;
  }
  const order = await claimStaffNotification(razorpayOrderId);
  if (!order) return; // already sent, or not paid yet
  try {
    await sendOrderEmail(order);
  } catch (e) {
    console.error("[staff-email] failed", e instanceof Error ? e.message : e);
    await releaseStaffNotification(razorpayOrderId).catch(() => {});
  }
}

/** Builds the PDF and sends the email. Throws if the email provider rejects it. */
export async function sendOrderEmail(order: StoredOrder) {
  {
    const pdf = await buildOrderPdf(order);
    const sections = orderSections(order);
    const html = `<div style="font-family:Arial,sans-serif;color:#1f2550;max-width:620px">
<p style="color:#B8913D;font-size:12px;letter-spacing:.08em;margin:0 0 4px">STAFF ONLY - CONFIDENTIAL</p>
<h2 style="color:#050E8F;margin:0 0 4px">New paid order ${esc(order.ref)}</h2>
<p style="margin:0 0 16px">${esc(order.bracelet_title)} for ${esc(`${order.wearer_first_name} ${order.wearer_last_name}`.trim())}. The full order sheet is attached as a PDF.</p>
${sections
  .map(
    (s) => `<h3 style="color:#B8913D;font-size:13px;margin:18px 0 6px;text-transform:uppercase">${esc(s.title)}</h3>
<table style="border-collapse:collapse;width:100%">${s.rows
      .map(([k, v]) => `<tr><td style="padding:4px 12px 4px 0;color:#62667f;font-size:13px;width:180px;vertical-align:top">${esc(k)}</td><td style="padding:4px 0;font-size:14px">${esc(v)}</td></tr>`)
      .join("")}</table>`,
  )
  .join("")}
<p style="color:#62667f;font-size:12px;margin-top:24px">Contains customer personal data. Do not forward outside the Bracelet By Ammit team.</p>
</div>`;

    const res = await fetch(`${API}/emails`, {
      method: "POST",
      headers: { Authorization: `Bearer ${KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: FROM,
        to: TO,
        subject: `New order ${order.ref}: ${order.bracelet_title} for ${order.wearer_first_name}`,
        html,
        attachments: [{ filename: `BBA-order-${order.ref}.pdf`, content: Buffer.from(pdf).toString("base64") }],
      }),
      signal: AbortSignal.timeout(15_000),
    });
    if (!res.ok) throw new Error(`email API ${res.status}: ${(await res.text()).slice(0, 200)}`);
  }
}
