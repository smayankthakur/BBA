import { apiAdmin } from "@/lib/server/adminApi";
import { listOrders } from "@/lib/server/orders";
import { logAction } from "@/lib/server/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** CSV of orders (all form details), for spreadsheets. Admins and owner only. */
export async function GET(req: Request) {
  const user = await apiAdmin(req, "admin", false);
  if (user instanceof Response) return user;
  const u = new URL(req.url);
  const { rows } = await listOrders({
    status: u.searchParams.get("status") ?? "",
    fulfilment: u.searchParams.get("fulfilment") ?? "",
    q: u.searchParams.get("q") ?? "",
    limit: 5000,
  });
  const cols: [string, (o: (typeof rows)[number]) => unknown][] = [
    ["Order", (o) => o.ref],
    ["Placed", (o) => new Date(o.created_at).toISOString()],
    ["Payment", (o) => o.status],
    ["Progress", (o) => o.fulfilment_status],
    ["Amount (Rs)", (o) => o.amount_paise / 100],
    ["Purposes", (o) => (o.purposes ?? []).length || 1],
    ["Top-up (Rs)", (o) => (o.upgrade_paise ?? 0) / 100],
    ["Coupon", (o) => o.coupon_code],
    ["Discount (Rs)", (o) => (o.discount_paise ?? 0) / 100],
    ["Bracelet", (o) => o.bracelet_title],
    ["Intentions", (o) => (o.intentions ?? []).join("; ")],
    ["Focus", (o) => o.focus],
    ["Wearer", (o) => `${o.wearer_first_name} ${o.wearer_last_name}`.trim()],
    ["Date of birth", (o) => o.dob_text],
    ["Gender", (o) => o.wearer_gender],
    ["Mulank", (o) => o.mulank],
    ["Bhagyank", (o) => o.bhagyank],
    ["Wrist", (o) => o.wrist],
    ["Gift", (o) => (o.is_gift ? "yes" : "no")],
    ["Gift note", (o) => o.gift_note],
    ["Deliver to", (o) => o.delivery_name],
    ["Mobile", (o) => o.mobile],
    ["Email", (o) => o.email],
    ["Address", (o) => [o.address_line1, o.address_line2, o.landmark].filter(Boolean).join(", ")],
    ["City", (o) => o.city],
    ["State", (o) => o.state],
    ["PIN", (o) => o.pincode],
    ["Offers opt-in", (o) => (o.marketing_opt_in ? "yes" : "no")],
    ["Partner", (o) => o.partner_code],
    ["Commission (Rs)", (o) => (o.commission_paise ?? 0) / 100],
    ["Courier", (o) => o.courier],
    ["Tracking", (o) => o.tracking_number],
    ["Payment ID", (o) => o.razorpay_payment_id],
    ["Notes", (o) => o.admin_notes],
  ];
  // Quote every cell; prefix formula-looking values so spreadsheets don't run them.
  const cell = (v: unknown) => {
    let s = v === null || v === undefined ? "" : String(v);
    if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
    return `"${s.replace(/"/g, '""')}"`;
  };
  const csv = [cols.map(([h]) => cell(h)).join(","), ...rows.map((o) => cols.map(([, f]) => cell(f(o))).join(","))].join("\r\n");
  await logAction(user.id, "orders.export", String(rows.length));
  return new Response("﻿" + csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="bba-orders-${new Date().toISOString().slice(0, 10)}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
