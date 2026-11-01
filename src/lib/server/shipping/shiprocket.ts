import "server-only";
import type { AdminOrder } from "../orders";
import type { ShipResult, ShippingProvider } from "./types";

/**
 * Shiprocket (also covers Pickrr, which Shiprocket owns). Uses an API user
 * created in Shiprocket → Settings → API → Configure:
 *   SHIPROCKET_EMAIL, SHIPROCKET_PASSWORD,
 *   SHIPROCKET_PICKUP (pickup location nickname, default "Primary").
 * Parcel size defaults suit one bracelet box; override with SHIP_WEIGHT_KG,
 * SHIP_LENGTH_CM, SHIP_BREADTH_CM, SHIP_HEIGHT_CM.
 */
const BASE = process.env.SHIPROCKET_API_BASE || "https://apiv2.shiprocket.in/v1/external";
const EMAIL = process.env.SHIPROCKET_EMAIL ?? "";
const PASSWORD = process.env.SHIPROCKET_PASSWORD ?? "";
const PICKUP = process.env.SHIPROCKET_PICKUP || "Primary";
const num = (v: string | undefined, d: number) => (v && Number.isFinite(Number(v)) && Number(v) > 0 ? Number(v) : d);

type Tok = { token: string; until: number };
const g = globalThis as unknown as { __bbaShiprocket?: Tok };

async function token(): Promise<string> {
  if (g.__bbaShiprocket && g.__bbaShiprocket.until > Date.now()) return g.__bbaShiprocket.token;
  const res = await fetch(`${BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: EMAIL, password: PASSWORD }),
    signal: AbortSignal.timeout(15_000),
  });
  const d = (await res.json().catch(() => ({}))) as { token?: string; message?: string };
  if (!res.ok || !d.token) throw new Error(`Shiprocket login failed: ${d.message ?? res.status}`);
  // Tokens last 10 days; refresh a day early.
  g.__bbaShiprocket = { token: d.token, until: Date.now() + 9 * 86400_000 };
  return d.token;
}

async function call<T>(path: string, body: unknown): Promise<T> {
  const t = await token();
  const res = await fetch(`${BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${t}` },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(20_000),
  });
  const d = (await res.json().catch(() => ({}))) as T & { message?: string; errors?: unknown };
  if (res.status === 401) g.__bbaShiprocket = undefined;
  if (!res.ok) {
    const detail = d.errors ? JSON.stringify(d.errors).slice(0, 300) : d.message ?? String(res.status);
    throw new Error(`Shiprocket ${path}: ${detail}`);
  }
  return d;
}

const ymdIST = (d: Date | string | null) => {
  const x = d ? new Date(d) : new Date();
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hour12: false })
    .format(x)
    .replace(",", "");
};

export const shiprocket: ShippingProvider = {
  id: "shiprocket",
  name: "Shiprocket",
  configured: () => !!(EMAIL && PASSWORD),
  trackingUrl: (awb) => `https://shiprocket.co/tracking/${encodeURIComponent(awb)}`,

  async createShipment(o: AdminOrder): Promise<ShipResult> {
    const [first, ...rest] = (o.delivery_name || o.wearer_first_name).trim().split(/\s+/);
    const amount = Math.round((o.amount_paise + (o.upgrade_paise ?? 0)) / 100);
    // 1. The order in Shiprocket (prepaid)
    const created = await call<{ order_id?: number; shipment_id?: number; status?: string }>("/orders/create/adhoc", {
      order_id: o.ref,
      order_date: ymdIST(o.paid_at ?? o.created_at),
      pickup_location: PICKUP,
      billing_customer_name: first || "Customer",
      billing_last_name: rest.join(" "),
      billing_address: o.address_line1,
      billing_address_2: [o.address_line2, o.landmark].filter(Boolean).join(", "),
      billing_city: o.city,
      billing_pincode: o.pincode,
      billing_state: o.state,
      billing_country: "India",
      billing_email: o.email || "",
      billing_phone: o.mobile,
      shipping_is_billing: true,
      order_items: [{ name: `${o.bracelet_title} crystal bracelet`, sku: `BBA-${o.bracelet_slug}`.slice(0, 50), units: 1, selling_price: amount }],
      payment_method: "Prepaid",
      sub_total: amount,
      length: num(process.env.SHIP_LENGTH_CM, 12),
      breadth: num(process.env.SHIP_BREADTH_CM, 10),
      height: num(process.env.SHIP_HEIGHT_CM, 5),
      weight: num(process.env.SHIP_WEIGHT_KG, 0.15),
    });
    if (!created.shipment_id) throw new Error("Shiprocket didn't return a shipment id");
    const shipmentId = String(created.shipment_id);

    // 2. Courier + AWB (Shiprocket picks the recommended courier)
    const awb = await call<{ awb_assign_status?: number; response?: { data?: { awb_code?: string; courier_name?: string } }; message?: string }>(
      "/courier/assign/awb",
      { shipment_id: Number(shipmentId) },
    );
    const code = awb.response?.data?.awb_code;
    if (!code) throw new Error(`No courier assigned yet${awb.message ? `: ${awb.message}` : ""}. Try again, or assign one in Shiprocket.`);

    // 3. Pickup request and label (a failure here doesn't undo the shipment)
    await call("/courier/generate/pickup", { shipment_id: [Number(shipmentId)] }).catch((e) => console.warn("[shiprocket] pickup", e instanceof Error ? e.message : e));
    const label = await call<{ label_url?: string }>("/courier/generate/label", { shipment_id: [Number(shipmentId)] }).catch(() => ({ label_url: undefined }));

    return {
      provider: "shiprocket",
      providerOrderId: created.order_id ? String(created.order_id) : null,
      shipmentId,
      awb: code,
      courier: awb.response?.data?.courier_name ?? "Shiprocket",
      labelUrl: label.label_url ?? null,
      trackingUrl: `https://shiprocket.co/tracking/${encodeURIComponent(code)}`,
    };
  },

  async label(shipmentId: string) {
    const label = await call<{ label_url?: string }>("/courier/generate/label", { shipment_id: [Number(shipmentId)] });
    return label.label_url ?? null;
  },
};
