import "server-only";
import { sql } from "../db";
import { ensureSchema } from "../schema";
import type { AdminOrder } from "../orders";
import { shiprocket } from "./shiprocket";
import type { ShippingProvider } from "./types";

/** Every provider the panel knows. Add another aggregator here (same interface). */
export const PROVIDERS: ShippingProvider[] = [shiprocket];
export const activeProvider = () => PROVIDERS.find((p) => p.configured()) ?? null;
export const providerById = (id: string | null | undefined) => PROVIDERS.find((p) => p.id === id) ?? null;

/** Problems that stop a shipment being booked. */
export function shipBlockers(o: AdminOrder): string[] {
  const out: string[] = [];
  if (o.status !== "paid") out.push("the order isn't paid");
  if (o.tracking_number) out.push("it already has a tracking number");
  if (!/^[1-9]\d{5}$/.test(o.pincode ?? "")) out.push("PIN code");
  if (!o.address_line1?.trim()) out.push("address");
  if (!o.city?.trim()) out.push("city");
  if (!o.state?.trim()) out.push("state");
  if (!/^[6-9]\d{9}$/.test(o.mobile ?? "")) out.push("mobile");
  return out;
}

/** Books the shipment and saves courier, AWB, label and tracking link on the order (moves it to Shipped). */
export async function bookShipment(o: AdminOrder) {
  const p = activeProvider();
  if (!p) throw new Error("No shipping service is connected (see Connections).");
  await ensureSchema();
  // Claim the order first so a double tap (or two staff at once) can't book and pay for two parcels.
  // A claim older than 3 minutes is treated as abandoned (e.g. the request timed out).
  const claim = `booking:${Date.now()}`;
  const got = await sql`update orders set shipment_id = ${claim}, updated_at = now()
    where id = ${o.id} and tracking_number is null
      and (shipment_id is null or (shipment_id like 'booking:%' and updated_at < now() - interval '3 minutes'))
    returning id`;
  if (!got.length) throw new Error("This order is already booked, or a booking is in progress. Refresh the page in a minute.");
  let r: Awaited<ReturnType<ShippingProvider["createShipment"]>>;
  try {
    r = await p.createShipment(o);
  } catch (e) {
    await sql`update orders set shipment_id = null where id = ${o.id} and shipment_id = ${claim}`;
    throw e;
  }
  await sql`update orders set ship_provider = ${r.provider}, ship_order_id = ${r.providerOrderId}, shipment_id = ${r.shipmentId},
    tracking_number = ${r.awb}, courier = ${r.courier}, label_url = ${r.labelUrl}, tracking_url = ${r.trackingUrl},
    fulfilment_status = case when fulfilment_status in ('delivered', 'cancelled') then fulfilment_status else 'shipped' end,
    shipped_at = coalesce(shipped_at, now()), making_at = coalesce(making_at, now()), reading_done_at = coalesce(reading_done_at, now()),
    updated_at = now() where id = ${o.id}`;
  return r;
}

/* ---------------- Manual shipping (Prozo / ProShip) ----------------
 * Prozo's API docs and keys are given during onboarding, so until then staff
 * create the shipment in ProShip and type the AWB here. SHIP_COURIER_NAME
 * (default "Prozo") pre-fills the courier; PROZO_TRACKING_URL, a link with
 * {awb} in it (e.g. the tracking page ProShip gives you), fills the customer's
 * tracking link automatically when staff don't paste one.
 */
export const manualCourier = () => process.env.SHIP_COURIER_NAME?.trim() || "Prozo";
export function manualTrackingUrl(awb: string): string | null {
  const t = process.env.PROZO_TRACKING_URL?.trim();
  if (!t || !t.includes("{awb}") || !/^https:\/\//.test(t)) return null;
  return t.replaceAll("{awb}", encodeURIComponent(awb));
}
const num = (v: string | undefined, d: number) => {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? n : d;
};
/** Parcel size for one bracelet box (same defaults as Shiprocket bookings). */
export const parcel = () => ({
  weightKg: num(process.env.SHIP_WEIGHT_KG, 0.15),
  lengthCm: num(process.env.SHIP_LENGTH_CM, 12),
  breadthCm: num(process.env.SHIP_BREADTH_CM, 10),
  heightCm: num(process.env.SHIP_HEIGHT_CM, 5),
});

/** Saves a shipment booked outside the panel (e.g. in ProShip) and moves the order to Shipped. */
export async function saveManualShipment(id: string, s: { courier: string; awb: string; trackingUrl: string | null }) {
  await ensureSchema();
  const url = s.trackingUrl || manualTrackingUrl(s.awb);
  const rows = await sql`update orders set ship_provider = 'manual', courier = ${s.courier}, tracking_number = ${s.awb}, tracking_url = ${url},
    fulfilment_status = case when fulfilment_status in ('delivered', 'cancelled') then fulfilment_status else 'shipped' end,
    shipped_at = coalesce(shipped_at, now()), making_at = coalesce(making_at, now()), reading_done_at = coalesce(reading_done_at, now()),
    updated_at = now()
    where id = ${id} and status = 'paid' and tracking_number is null returning id`;
  return rows.length > 0;
}
